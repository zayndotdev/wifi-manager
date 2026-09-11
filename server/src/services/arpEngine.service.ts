import { spawn, execFile, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { systemLogger } from './systemLogger.service.js';
import { realNetworkService } from './realNetwork.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled SentinelArpEngine.exe
const ENGINE_EXE = path.resolve(__dirname, '../../native/SentinelArpEngine.exe');

export interface ArpStatus {
  available: boolean;
  enginePath: string;
  driverStatus: 'ready' | 'npcap_missing' | 'error';
  activePauses: string[];
}

class ArpEngineService {
  private activePauseProcesses: Map<string, ChildProcess> = new Map();
  private isDriverReady = false;

  constructor() {
    this.checkDriverStatus().catch(() => {});
  }

  public async checkDriverStatus(): Promise<boolean> {
    if (!fs.existsSync(ENGINE_EXE)) {
      this.isDriverReady = false;
      return false;
    }

    return new Promise((resolve) => {
      execFile(ENGINE_EXE, ['check'], { timeout: 3000 }, (error, stdout) => {
        try {
          const res = JSON.parse(stdout.trim());
          if (res.status === 'ok' && res.driver === 'npcap_ready') {
            this.isDriverReady = true;
            resolve(true);
            return;
          }
        } catch {
          // ignore
        }
        this.isDriverReady = false;
        resolve(false);
      });
    });
  }

  public getStatus(): ArpStatus {
    return {
      available: this.isDriverReady,
      enginePath: ENGINE_EXE,
      driverStatus: this.isDriverReady ? 'ready' : 'npcap_missing',
      activePauses: Array.from(this.activePauseProcesses.keys()),
    };
  }

  /**
   * Autonomous Layer 2 Internet Pause (Blackholing)
   * Sends continuous ARP redirection frames to target device routing all egress traffic to host blackhole.
   * Target device loses 100% of internet access across all apps without touching router or device settings.
   */
  public async pauseDevice(targetIp: string, targetMac: string): Promise<boolean> {
    const wifiInfo = realNetworkService.getWifiInterfaceInfo();
    const gatewayIp = wifiInfo.gatewayIp || '192.168.1.1';
    const gatewayMac = wifiInfo.gatewayMac || wifiInfo.bssid || '00:00:00:00:00:00';
    const hostMac = wifiInfo.adapterMac;

    if (!targetIp || !targetMac) {
      systemLogger.error('ARP', `Cannot pause device: missing IP (${targetIp}) or MAC (${targetMac})`);
      return false;
    }

    // Stop any existing pause process for this target
    this.stopActivePauseProcess(targetIp);

    const ready = await this.checkDriverStatus();
    if (!ready) {
      systemLogger.warn(
        'ARP',
        `Autonomous L2 ARP Engine requires Npcap driver. Target ${targetIp} (${targetMac}) scheduled for L2 enforcement. Install Npcap to activate live raw frame injection.`
      );
      return false;
    }

    try {
      systemLogger.hardware(
        'ARP',
        `[SaaS Engine] Spawning Layer 2 ARP Blackhole for ${targetIp} [${targetMac}] (Gateway: ${gatewayIp} [${gatewayMac}])`
      );

      const child = spawn(
        ENGINE_EXE,
        ['pause', targetIp, targetMac, gatewayIp, gatewayMac, hostMac, '1200'],
        {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      this.activePauseProcesses.set(targetIp, child);

      child.stdout?.on('data', (data) => {
        const text = data.toString().trim();
        try {
          const parsed = JSON.parse(text);
          if (parsed.status === 'running') {
            systemLogger.hardware(
              'ARP',
              `[L2 Autonomous Active] Target ${targetIp} redirected to blackhole via ${parsed.adapter}. Physical internet PAUSED.`
            );
          } else if (parsed.heartbeat) {
            systemLogger.info(
              'ARP',
              `[L2 Heartbeat] Target ${targetIp} maintained in blackhole (Cycle ${parsed.cycles}).`
            );
          }
        } catch {
          // Plain text log
          if (text) systemLogger.info('ARP', `[SentinelEngine] ${text}`);
        }
      });

      child.stderr?.on('data', (data) => {
        systemLogger.error('ARP', `[SentinelEngine stderr] ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        this.activePauseProcesses.delete(targetIp);
        systemLogger.hardware(
          'ARP',
          `[SentinelEngine] L2 pause loop for ${targetIp} ended (Exit code: ${code}).`
        );
      });

      return true;
    } catch (err: any) {
      systemLogger.error('ARP', `Failed to spawn ARP engine: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Autonomous Layer 2 Internet Resume (ARP Restoration)
   * Sends rapid ARP restoration frames to target device and gateway restoring true Gateway MAC.
   * Target device internet restores in < 1 second.
   */
  public async resumeDevice(targetIp: string, targetMac: string): Promise<boolean> {
    const wifiInfo = realNetworkService.getWifiInterfaceInfo();
    const gatewayIp = wifiInfo.gatewayIp || '192.168.1.1';
    const gatewayMac = wifiInfo.gatewayMac || wifiInfo.bssid || '00:00:00:00:00:00';

    // 1. Kill the continuous pause background loop
    this.stopActivePauseProcess(targetIp);

    const ready = await this.checkDriverStatus();
    if (!ready) {
      systemLogger.info('ARP', `Device ${targetIp} resume recorded in state engine.`);
      return true;
    }

    try {
      systemLogger.hardware(
        'ARP',
        `[SaaS Engine] Transmitting ARP cache restoration frames for ${targetIp} [${targetMac}] -> restoring Gateway MAC ${gatewayMac}`
      );

      return new Promise((resolve) => {
        execFile(
          ENGINE_EXE,
          ['resume', targetIp, targetMac, gatewayIp, gatewayMac],
          { timeout: 5000 },
          (error, stdout) => {
            if (error) {
              systemLogger.error('ARP', `ARP restoration failed: ${error.message}`);
              resolve(false);
              return;
            }
            systemLogger.hardware(
              'ARP',
              `[SaaS Engine] ARP cache restored successfully for ${targetIp}. Target has 100% internet access.`
            );
            resolve(true);
          }
        );
      });
    } catch (err: any) {
      systemLogger.error('ARP', `Failed to execute ARP resume: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Autonomous Force Disconnect (Kick)
   * Bursts 15 dead-MAC ARP frames to sever all open TCP sockets and drop the client.
   */
  public async kickDevice(targetIp: string, targetMac: string): Promise<boolean> {
    const wifiInfo = realNetworkService.getWifiInterfaceInfo();
    const gatewayIp = wifiInfo.gatewayIp || '192.168.1.1';
    const gatewayMac = wifiInfo.gatewayMac || wifiInfo.bssid || '00:00:00:00:00:00';

    const ready = await this.checkDriverStatus();
    if (!ready) {
      systemLogger.warn('ARP', `Cannot burst kick frames for ${targetIp}: Npcap driver not ready.`);
      return false;
    }

    return new Promise((resolve) => {
      execFile(
        ENGINE_EXE,
        ['kick', targetIp, targetMac, gatewayIp, gatewayMac],
        { timeout: 3000 },
        (error) => {
          if (error) {
            systemLogger.error('ARP', `Kick burst error: ${error.message}`);
            resolve(false);
            return;
          }
          systemLogger.hardware(
            'ARP',
            `[SaaS Engine] 15 Dead-MAC ARP burst frames sent to ${targetIp}. All existing TCP/UDP streams severed.`
          );
          resolve(true);
        }
      );
    });
  }

  private stopActivePauseProcess(targetIp: string) {
    const proc = this.activePauseProcesses.get(targetIp);
    if (proc) {
      try {
        proc.kill('SIGTERM');
      } catch {
        // ignore
      }
      this.activePauseProcesses.delete(targetIp);
    }
  }
}

export const arpEngineService = new ArpEngineService();
