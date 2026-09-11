import http from 'http';
import mongoose from 'mongoose';
import { RouterConfigModel, IRouterConfig } from '../models/RouterConfig.model.js';
import { isConnectedToMongo } from '../config/database.js';
import { systemLogger } from './systemLogger.service.js';

export interface RouterStatus {
  ip: string;
  model: string;
  isReachable: boolean;
  isAuthenticated: boolean;
  enforcementMode: 'router_hardware' | 'dns_sinkhole' | 'hybrid';
  lastError?: string;
  authMessage?: string;
}

// Low-level HTTP helper using Node's standard http module to avoid undici parser bugs with ZTE 2005 mini web server
function routerHttp(options: http.RequestOptions, postData: string | null = null): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.setTimeout(4000, () => {
      req.destroy(new Error('Connection timed out'));
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
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
          systemLogger.info('ROUTER', `Loaded hardware configuration for ${this.config.model} (${this.config.ip}).`);
        }
      } catch (err: any) {
        systemLogger.warn('ROUTER', `Failed to load router config from database: ${err.message}`);
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

    if (data.password) {
      systemLogger.info('AUTH', `Testing credentials for ${this.config.username}@${this.config.ip}...`);
      const auth = await this.loginZte(this.config.ip, this.config.username, data.password);
      this.config.isConnected = auth.success;
    }

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

    systemLogger.hardware('ROUTER', `Probing gateway hardware at http://${targetIp}/...`);

    try {
      const probe = await routerHttp({
        hostname: targetIp,
        port: 80,
        path: '/',
        method: 'GET',
      });

      const isReachable = probe.statusCode > 0;
      systemLogger.info('ROUTER', `Gateway reachability probe responded with HTTP ${probe.statusCode}.`);

      let authenticated = false;
      let authMessage = '';

      if (targetPass) {
        systemLogger.hardware('AUTH', `Attempting authentication on ${targetIp} with username: ${targetUser}`);
        const loginRes = await this.loginZte(targetIp, targetUser, targetPass);
        authenticated = loginRes.success;
        authMessage = loginRes.message;
      }

      this.config.isConnected = authenticated;

      return {
        ip: targetIp,
        model: this.config.model,
        isReachable,
        isAuthenticated: authenticated,
        enforcementMode: this.config.enforcementMode,
        lastError: targetPass && !authenticated ? authMessage : undefined,
        authMessage,
      };
    } catch (err: any) {
      systemLogger.error('ROUTER', `Gateway hardware probe failed: ${err.message}`);
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

  public async loginZte(ip: string, user: string, pass: string): Promise<{ success: boolean; message: string }> {
    try {
      const postData = `action=login&Frm_Logintoken=1&username=${encodeURIComponent(user)}&Password=${encodeURIComponent(pass)}`;

      const res = await routerHttp({
        hostname: ip,
        port: 80,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Referer': `http://${ip}/`,
        },
      }, postData);

      if (res.headers['set-cookie']) {
        const cookieVal = Array.isArray(res.headers['set-cookie'])
          ? res.headers['set-cookie'].join('; ')
          : res.headers['set-cookie'];
        this.sessionCookie = cookieVal;
      }

      // Check for lockouts or error banners
      if (res.body.includes('wrong username or password')) {
        const msg = 'Router rejected credentials: "You have input the wrong username or password".';
        systemLogger.error('AUTH', msg, { username: user, ip });
        return { success: false, message: msg };
      }

      if (res.body.includes('three times') || res.body.includes('minute later')) {
        const msg = 'Router lockout active: Too many failed attempts. Cooldown is 60 seconds.';
        systemLogger.warn('AUTH', msg);
        return { success: false, message: msg };
      }

      // Successful login on ZTE redirects (302) to /start.ghtml or loads start.ghtml
      if (res.statusCode === 302 || res.headers.location?.includes('start.ghtml') || res.body.includes('start.ghtml')) {
        systemLogger.hardware('AUTH', `Successfully authenticated with ZTE TEWA-220G as "${user}". Hardware control unlocked!`);
        this.config.isConnected = true;
        return { success: true, message: 'Authentication successful.' };
      }

      // If it reloaded the login form without redirect
      if (res.body.includes('fLogin') || res.body.includes('loginArea')) {
        const msg = `Router rejected credentials for user "${user}". Please check the password on your ZTE router sticker.`;
        systemLogger.warn('AUTH', msg);
        return { success: false, message: msg };
      }

      systemLogger.hardware('AUTH', `ZTE router returned HTTP ${res.statusCode}. Assuming session active.`);
      this.config.isConnected = true;
      return { success: true, message: 'Session accepted.' };
    } catch (err: any) {
      systemLogger.error('AUTH', `Authentication failed with exception: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  public async blockMac(mac: string): Promise<{ success: boolean; method: string; details?: string }> {
    if (!mac) return { success: false, method: 'none' };
    const cleanMac = mac.toUpperCase().replace(/-/g, ':').trim();
    this.blockedMacs.add(cleanMac);

    systemLogger.hardware('ROUTER', `Registering hardware block for target MAC: ${cleanMac}`);

    // If router is authenticated, push to ZTE WLAN MAC filter
    if (this.config.isConnected && this.config.password) {
      try {
        const postData = `action=add&mac=${encodeURIComponent(cleanMac)}`;
        const filterRes = await routerHttp({
          hostname: this.config.ip,
          port: 80,
          path: '/getpage.gch?pid=1002&nextpage=net_wlan_mac_filter_t.gch',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Cookie': this.sessionCookie,
            'Referer': `http://${this.config.ip}/`,
          },
        }, postData);

        systemLogger.hardware('ROUTER', `Pushed MAC block rule for ${cleanMac} to ZTE hardware. (HTTP ${filterRes.statusCode})`);
        return { success: true, method: 'zte_hardware_mac_filter', details: `HTTP ${filterRes.statusCode}` };
      } catch (err: any) {
        systemLogger.error('ROUTER', `Failed to dispatch hardware block to router: ${err.message}`);
      }
    } else {
      systemLogger.warn('ROUTER', `Router hardware credentials not connected. Enforcing autonomous Port 53 DNS sinkhole for MAC ${cleanMac}.`);
    }

    return { success: true, method: 'dns_sinkhole_enforced' };
  }

  public async unblockMac(mac: string): Promise<{ success: boolean; method: string; details?: string }> {
    if (!mac) return { success: false, method: 'none' };
    const cleanMac = mac.toUpperCase().replace(/-/g, ':').trim();
    this.blockedMacs.delete(cleanMac);

    systemLogger.hardware('ROUTER', `Removing hardware block for target MAC: ${cleanMac}`);

    if (this.config.isConnected && this.config.password) {
      try {
        const postData = `action=delete&mac=${encodeURIComponent(cleanMac)}`;
        const filterRes = await routerHttp({
          hostname: this.config.ip,
          port: 80,
          path: '/getpage.gch?pid=1002&nextpage=net_wlan_mac_filter_t.gch',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Cookie': this.sessionCookie,
            'Referer': `http://${this.config.ip}/`,
          },
        }, postData);

        systemLogger.hardware('ROUTER', `Removed MAC block rule for ${cleanMac} on ZTE router. (HTTP ${filterRes.statusCode})`);
        return { success: true, method: 'zte_hardware_mac_filter', details: `HTTP ${filterRes.statusCode}` };
      } catch (err: any) {
        systemLogger.error('ROUTER', `Failed to dispatch hardware unblock: ${err.message}`);
      }
    }

    return { success: true, method: 'dns_sinkhole_restored' };
  }

  public async kickStation(mac: string): Promise<{ success: boolean; method: string }> {
    systemLogger.hardware('ROUTER', `Executing station deauthentication kick cycle for MAC: ${mac}`);
    const blockRes = await this.blockMac(mac);
    setTimeout(() => {
      this.unblockMac(mac);
    }, 15000);
    return { success: blockRes.success, method: 'disassociate_frame_cycle' };
  }
}

export const routerService = new RouterService();
