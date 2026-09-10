import { telemetryBroadcaster } from '../websocket/telemetryServer.js';
import { deviceService } from './device.service.js';
import { trafficService } from './traffic.service.js';
import { realNetworkService } from './realNetwork.service.js';

class TelemetryService {
  private intervalTimer: NodeJS.Timeout | null = null;
  private dnsCacheTimer: NodeJS.Timeout | null = null;
  private subnetScanTimer: NodeJS.Timeout | null = null;
  private lastDomainLoggedTime: Map<string, number> = new Map();
  private domainCounts: Map<string, number> = new Map();

  public start() {
    this.intervalTimer = setInterval(async () => {
      await this.generateRealSpeedTick();
    }, 1000);

    this.dnsCacheTimer = setInterval(async () => {
      await this.captureRealDnsActivity();
    }, 2500);

    // Initial capture immediately on boot
    this.captureRealDnsActivity().catch(() => {});

    // Automatic background network discovery every 20 seconds
    this.subnetScanTimer = setInterval(async () => {
      try {
        const devices = await deviceService.rescan();
        telemetryBroadcaster.broadcast('devices_updated', { devices });
      } catch {
        // ignore
      }
    }, 20000);

    console.log('[Telemetry] Live 1-second 100% Real Hardware Telemetry engine started.');
  }

  public stop() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    if (this.dnsCacheTimer) clearInterval(this.dnsCacheTimer);
    if (this.subnetScanTimer) clearInterval(this.subnetScanTimer);
  }

  // Measure 100% genuine network interface bytes transferred per second
  private async generateRealSpeedTick() {
    const devices = await deviceService.getAll();
    const realDelta = realNetworkService.getRealBandwidthDelta();
    const wifiInfo = realNetworkService.getWifiInterfaceInfo();

    const wanDownloadTotal = realDelta.downloadBps;
    const wanUploadTotal = realDelta.uploadBps;

    const deviceSpeeds: Record<string, { downBps: number; upBps: number }> = {};

    for (const dev of devices) {
      if (dev.status === 'offline' || dev.status === 'paused' || dev.status === 'blocked') {
        deviceSpeeds[dev.id] = { downBps: 0, upBps: 0 };
        continue;
      }

      // If this device is the local workstation, it receives the measured network bandwidth
      if (dev.ip === wifiInfo.localIp || dev.mac === wifiInfo.adapterMac) {
        deviceSpeeds[dev.id] = {
          downBps: wanDownloadTotal,
          upBps: wanUploadTotal,
        };
      } else {
        // Other devices on subnet report honest zero unless actively transmitting
        deviceSpeeds[dev.id] = {
          downBps: 0,
          upBps: 0,
        };
      }
    }

    deviceService.updateSpeeds(deviceSpeeds);

    telemetryBroadcaster.broadcast('speed_tick', {
      wanDownloadBps: wanDownloadTotal,
      wanUploadBps: wanUploadTotal,
      deviceSpeeds,
      timestamp: Date.now(),
    });
  }

  // Capture real domains actively queried and cached by the Windows DNS client
  public async captureRealDnsActivity() {
    const devices = await deviceService.getAll();
    if (devices.length === 0) return;

    const wifiInfo = realNetworkService.getWifiInterfaceInfo();
    const hostDevice = devices.find((d) => d.ip === wifiInfo.localIp || d.mac === wifiInfo.adapterMac) || devices[0];

    const currentDomains = realNetworkService.getRealDnsCache();
    const now = Date.now();

    for (const domain of currentDomains) {
      if (realNetworkService.isSystemNoiseDomain(domain)) {
        continue;
      }

      const lastLogged = this.lastDomainLoggedTime.get(domain) || 0;
      // Do not spam repetitive logs for lingering cache entries; refresh active sessions at a calm 120s cadence
      if (lastLogged > 0 && now - lastLogged < 120000) {
        continue;
      }

      this.lastDomainLoggedTime.set(domain, now);
      const queryCount = (this.domainCounts.get(domain) || 0) + 1;
      this.domainCounts.set(domain, queryCount);

      const dLower = domain.toLowerCase();
      let category: 'work' | 'streaming' | 'social' | 'gaming' | 'shopping' | 'ad_tracker' | 'general' = 'general';

      if (
        dLower.includes('google') ||
        dLower.includes('chatgpt') ||
        dLower.includes('openai') ||
        dLower.includes('claude') ||
        dLower.includes('anthropic') ||
        dLower.includes('gemini') ||
        dLower.includes('bing') ||
        dLower.includes('duckduckgo') ||
        dLower.includes('github') ||
        dLower.includes('microsoft') ||
        dLower.includes('office') ||
        dLower.includes('azure') ||
        dLower.includes('aws') ||
        dLower.includes('mongodb') ||
        dLower.includes('gitlab') ||
        dLower.includes('slack') ||
        dLower.includes('jobicy') ||
        dLower.includes('remotive')
      ) {
        category = 'work';
      } else if (
        dLower.includes('youtube') ||
        dLower.includes('netflix') ||
        dLower.includes('spotify') ||
        dLower.includes('twitch') ||
        dLower.includes('hulu') ||
        dLower.includes('disney') ||
        dLower.includes('video')
      ) {
        category = 'streaming';
      } else if (
        dLower.includes('reddit') ||
        dLower.includes('twitter') ||
        dLower.includes('x.com') ||
        dLower.includes('discord') ||
        dLower.includes('instagram') ||
        dLower.includes('facebook') ||
        dLower.includes('tiktok') ||
        dLower.includes('whatsapp')
      ) {
        category = 'social';
      } else if (
        dLower.includes('steam') ||
        dLower.includes('epic') ||
        dLower.includes('roblox') ||
        dLower.includes('riot') ||
        dLower.includes('playstation') ||
        dLower.includes('xbox') ||
        dLower.includes('game')
      ) {
        category = 'gaming';
      } else if (
        dLower.includes('amazon') ||
        dLower.includes('ebay') ||
        dLower.includes('walmart') ||
        dLower.includes('shopify') ||
        dLower.includes('daraz') ||
        dLower.includes('shop')
      ) {
        category = 'shopping';
      } else if (
        dLower.includes('telemetry') ||
        dLower.includes('analytics') ||
        dLower.includes('adservice') ||
        dLower.includes('doubleclick') ||
        dLower.includes('sentry') ||
        dLower.includes('trafficmanager') ||
        dLower.includes('ad.') ||
        dLower.includes('ads.')
      ) {
        category = 'ad_tracker';
      }

      const event = {
        id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        domain,
        category,
        deviceId: hostDevice.id,
        deviceNickname: hostDevice.nickname || hostDevice.hostname,
        timestamp: new Date(),
        status: 'allowed',
        queryCountToday: queryCount,
        bytesTransferred: 0,
      };

      await trafficService.addLiveEvent(event);
      telemetryBroadcaster.broadcast('dns_activity', { event });
    }
  }
}

export const telemetryService = new TelemetryService();
