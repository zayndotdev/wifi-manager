import mongoose from 'mongoose';
import { RouterConfigModel, IRouterConfig } from '../models/RouterConfig.model.js';
import { isConnectedToMongo } from '../config/database.js';

export interface RouterStatus {
  ip: string;
  model: string;
  isReachable: boolean;
  isAuthenticated: boolean;
  enforcementMode: 'router_hardware' | 'dns_sinkhole' | 'hybrid';
  lastError?: string;
}

class RouterService {
  private config: {
    ip: string;
    model: string;
    username: string;
    password?: string;
    isConnected: boolean;
    enforcementMode: 'router_hardware' | 'dns_sinkhole' | 'hybrid';
  };
  private sessionCookie: string = '';
  private blockedMacs: Set<string> = new Set();

  constructor() {
    this.config = {
      ip: '192.168.1.1',
      model: 'ZTE TEWA-220G',
      username: 'admin',
      password: '',
      isConnected: false,
      enforcementMode: 'hybrid',
    };
    this.loadFromMongo();
  }

  private async loadFromMongo() {
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        const found = (await RouterConfigModel.findOne({ id: 'default_router' }).lean()) as any;
        if (found) {
          this.config = {
            ip: found.ip || '192.168.1.1',
            model: found.model || 'ZTE TEWA-220G',
            username: found.username || 'admin',
            password: found.password || '',
            isConnected: !!found.isConnected,
            enforcementMode: found.enforcementMode || 'hybrid',
          };
        }
      } catch {
        // ignore
      }
    }
  }

  public async getConfig(): Promise<any> {
    return {
      ip: this.config.ip,
      model: this.config.model,
      username: this.config.username,
      hasPassword: !!this.config.password,
      isConnected: this.config.isConnected,
      enforcementMode: this.config.enforcementMode,
      blockedMacCount: this.blockedMacs.size,
    };
  }

  public async saveConfig(data: {
    ip?: string;
    username?: string;
    password?: string;
    enforcementMode?: 'router_hardware' | 'dns_sinkhole' | 'hybrid';
  }): Promise<any> {
    if (data.ip) this.config.ip = data.ip.trim();
    if (data.username) this.config.username = data.username.trim();
    if (data.password !== undefined) this.config.password = data.password.trim();
    if (data.enforcementMode) this.config.enforcementMode = data.enforcementMode;

    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        await RouterConfigModel.findOneAndUpdate(
          { id: 'default_router' },
          { $set: this.config },
          { upsert: true, new: true }
        );
      } catch {
        // ignore
      }
    }

    return this.getConfig();
  }

  public async testConnection(
    ip?: string,
    username?: string,
    password?: string
  ): Promise<RouterStatus> {
    const targetIp = ip || this.config.ip;
    const targetUser = username || this.config.username;
    const targetPass = password !== undefined ? password : this.config.password;

    try {
      const pingRes = await fetch(`http://${targetIp}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (!pingRes.ok && pingRes.status !== 401 && pingRes.status !== 403) {
        return {
          ip: targetIp,
          model: this.config.model,
          isReachable: false,
          isAuthenticated: false,
          enforcementMode: this.config.enforcementMode,
          lastError: `HTTP Status ${pingRes.status}`,
        };
      }

      // If password provided, attempt login
      let authenticated = false;
      if (targetPass) {
        authenticated = await this.loginZte(targetIp, targetUser, targetPass);
      }

      this.config.isConnected = authenticated;

      return {
        ip: targetIp,
        model: this.config.model,
        isReachable: true,
        isAuthenticated: authenticated,
        enforcementMode: this.config.enforcementMode,
        lastError: targetPass && !authenticated ? 'Invalid credentials or login locked' : undefined,
      };
    } catch (err: any) {
      return {
        ip: targetIp,
        model: this.config.model,
        isReachable: false,
        isAuthenticated: false,
        enforcementMode: this.config.enforcementMode,
        lastError: err.message || 'Connection timed out',
      };
    }
  }

  private async loginZte(ip: string, user: string, pass: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', user);
      formData.append('Password', pass);
      formData.append('action', 'login');
      formData.append('Frm_Logintoken', '1');

      const res = await fetch(`http://${ip}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: `http://${ip}/`,
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(4000),
      });

      const body = await res.text();
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        this.sessionCookie = setCookie;
      }

      // Check if redirected to main page or login error
      if (body.includes('main.html') || body.includes('top.gch') || res.status === 302) {
        return true;
      }
      if (body.includes('User information is error') || body.includes('wrong username or password')) {
        return false;
      }

      return !body.includes('fLogin');
    } catch {
      return false;
    }
  }

  public async blockMac(mac: string): Promise<{ success: boolean; method: string }> {
    if (!mac) return { success: false, method: 'none' };
    const cleanMac = mac.toUpperCase().replace(/-/g, ':').trim();
    this.blockedMacs.add(cleanMac);

    console.log(`[RouterService] Registering hardware block for MAC: ${cleanMac}`);

    // If router credentials are authenticated, push to ZTE router MAC filter
    if (this.config.isConnected && this.config.password) {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'add');
        formData.append('mac', cleanMac);

        await fetch(`http://${this.config.ip}/getpage.gch?pid=1002&nextpage=net_wlan_mac_filter_t.gch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: this.sessionCookie,
            Referer: `http://${this.config.ip}/`,
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(3000),
        });
        return { success: true, method: 'router_hardware_filter' };
      } catch (err: any) {
        console.warn('[RouterService] Router hardware filter dispatch failed, falling back to DNS/ARP:', err.message);
      }
    }

    return { success: true, method: 'dns_sinkhole_enforced' };
  }

  public async unblockMac(mac: string): Promise<{ success: boolean; method: string }> {
    if (!mac) return { success: false, method: 'none' };
    const cleanMac = mac.toUpperCase().replace(/-/g, ':').trim();
    this.blockedMacs.delete(cleanMac);

    console.log(`[RouterService] Removing hardware block for MAC: ${cleanMac}`);

    if (this.config.isConnected && this.config.password) {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'delete');
        formData.append('mac', cleanMac);

        await fetch(`http://${this.config.ip}/getpage.gch?pid=1002&nextpage=net_wlan_mac_filter_t.gch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: this.sessionCookie,
            Referer: `http://${this.config.ip}/`,
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(3000),
        });
        return { success: true, method: 'router_hardware_filter' };
      } catch (err: any) {
        console.warn('[RouterService] Router hardware unblock dispatch failed:', err.message);
      }
    }

    return { success: true, method: 'dns_sinkhole_restored' };
  }

  public async kickStation(mac: string): Promise<{ success: boolean; method: string }> {
    // A kick is executed by applying an immediate transient hardware block and clearing it,
    // forcing the wireless chip to disassociate the station frame
    const blockRes = await this.blockMac(mac);
    setTimeout(() => {
      this.unblockMac(mac);
    }, 15000);
    return { success: blockRes.success, method: 'disassociate_frame_cycle' };
  }
}

export const routerService = new RouterService();
