import http from 'http';
import https from 'https';
import net from 'net';

export interface DeviceFingerprint {
  os?: string;
  brand?: string;
  model?: string;
  trafficProfile?: string;
  leakedHost?: string;
  evidence: string[];
  openPorts?: number[];
  banner?: string;
  lastProbedAt?: string;
}

class DeviceFingerprintService {
  private fingerprints: Map<string, DeviceFingerprint> = new Map();
  private ipDomains: Map<string, Set<string>> = new Map();

  // Record a domain query from an IP to learn its manufacturer & app usage
  public recordDnsQuery(ip: string, domain: string) {
    if (!ip || !domain) return;
    if (!this.ipDomains.has(ip)) {
      this.ipDomains.set(ip, new Set());
    }
    const set = this.ipDomains.get(ip)!;
    set.add(domain.toLowerCase());
    if (set.size > 200) {
      const arr = Array.from(set).slice(-100);
      this.ipDomains.set(ip, new Set(arr));
    }
    this.analyzeDnsForIp(ip);
  }

  public getFingerprint(ip: string): DeviceFingerprint | null {
    return this.fingerprints.get(ip) || null;
  }

  public setFingerprint(ip: string, fp: DeviceFingerprint): void {
    this.fingerprints.set(ip, fp);
  }

  // Analyze DNS domain patterns to infer OS, brand, and apps
  public analyzeDnsForIp(ip: string): DeviceFingerprint | null {
    const domains = this.ipDomains.get(ip);
    if (!domains || domains.size === 0) return null;

    const fp = this.fingerprints.get(ip) || { evidence: [] };
    const evidenceSet = new Set(fp.evidence || []);

    let hasApple = false;
    let hasSamsung = false;
    let hasXiaomi = false;
    let hasVivo = false;
    let hasOppo = false;
    let hasHuawei = false;
    let hasGoogle = false;
    let hasMicrosoft = false;
    let hasAmazon = false;
    let hasStreaming = false;
    let hasSocial = false;

    for (const d of domains) {
      if (
        d.includes('apple.com') ||
        d.includes('icloud.com') ||
        d.includes('apple-dns.net') ||
        d.includes('aaplimg.com') ||
        d.includes('push.apple.com')
      ) {
        hasApple = true;
        evidenceSet.add('Apple iCloud & Push notification telemetry');
      }
      if (
        d.includes('samsungcloud.com') ||
        d.includes('samsungosp.com') ||
        d.includes('samsungdm.com') ||
        d.includes('samsungapps.com') ||
        d.includes('samsungpushservice.com')
      ) {
        hasSamsung = true;
        evidenceSet.add('Samsung Cloud & OneUI telemetry');
      }
      if (
        d.includes('miui.com') ||
        d.includes('xiaomi.com') ||
        d.includes('xiaomi.net') ||
        d.includes('micloud.xiaomi.net')
      ) {
        hasXiaomi = true;
        evidenceSet.add('Xiaomi / MIUI Cloud infrastructure');
      }
      if (d.includes('vivo.com') || d.includes('vivoglobal.com') || d.includes('iqoo.com')) {
        hasVivo = true;
        evidenceSet.add('Vivo FuntouchOS / OriginOS telemetry');
      }
      if (
        d.includes('heytapmobile.com') ||
        d.includes('coloros.com') ||
        d.includes('oppo.com') ||
        d.includes('realme.com') ||
        d.includes('oneplus.net')
      ) {
        hasOppo = true;
        evidenceSet.add('Oppo / Realme / OnePlus HeyTap telemetry');
      }
      if (d.includes('hicloud.com') || d.includes('huawei.com') || d.includes('dbankcloud.com')) {
        hasHuawei = true;
        evidenceSet.add('Huawei HiCloud / EMUI service');
      }
      if (
        d.includes('android.clients.google.com') ||
        d.includes('gvt1.com') ||
        d.includes('play.googleapis.com') ||
        d.includes('connectivitycheck.gstatic.com')
      ) {
        hasGoogle = true;
        evidenceSet.add('Google Play & Android core services');
      }
      if (
        d.includes('windowsupdate.com') ||
        d.includes('msedge.net') ||
        d.includes('microsoft.com') ||
        d.includes('msftncsi.com') ||
        d.includes('msftconnecttest.com')
      ) {
        hasMicrosoft = true;
        evidenceSet.add('Microsoft Windows update & telemetry');
      }
      if (d.includes('amazon.com') || d.includes('media-amazon.com') || d.includes('device-messaging.amazon.com')) {
        hasAmazon = true;
        evidenceSet.add('Amazon Echo / FireOS services');
      }
      if (
        d.includes('googlevideo.com') ||
        d.includes('youtube.com') ||
        d.includes('netflix.com') ||
        d.includes('tiktokv.com') ||
        d.includes('byteoversea.com') ||
        d.includes('twitch.tv')
      ) {
        hasStreaming = true;
        evidenceSet.add('High-bandwidth Video Streaming (YouTube/TikTok/Netflix)');
      }
      if (
        d.includes('instagram.com') ||
        d.includes('fbcdn.net') ||
        d.includes('whatsapp.net') ||
        d.includes('snapchat.com') ||
        d.includes('telegram.org')
      ) {
        hasSocial = true;
        evidenceSet.add('Social messaging apps (WhatsApp / Instagram / Snapchat)');
      }
    }

    if (hasApple) {
      fp.os = 'Apple iOS / iPadOS';
      fp.brand = 'Apple';
      fp.model = 'iPhone / iPad';
    } else if (hasSamsung) {
      fp.os = 'Android (OneUI)';
      fp.brand = 'Samsung';
      fp.model = 'Galaxy Smartphone';
    } else if (hasXiaomi) {
      fp.os = 'Android (HyperOS / MIUI)';
      fp.brand = 'Xiaomi';
      fp.model = 'Redmi / Xiaomi Phone';
    } else if (hasVivo) {
      fp.os = 'Android (FuntouchOS)';
      fp.brand = 'Vivo';
      fp.model = 'Vivo Smartphone';
    } else if (hasOppo) {
      fp.os = 'Android (ColorOS)';
      fp.brand = 'Realme / Oppo';
      fp.model = 'Smartphone';
    } else if (hasHuawei) {
      fp.os = 'HarmonyOS / Android';
      fp.brand = 'Huawei';
      fp.model = 'Huawei Smartphone';
    } else if (hasAmazon) {
      fp.os = 'FireOS';
      fp.brand = 'Amazon';
      fp.model = 'Echo / Fire TV';
    } else if (hasGoogle) {
      fp.os = 'Android OS';
      fp.brand = 'Android Device';
      fp.model = 'Smartphone';
    } else if (hasMicrosoft) {
      fp.os = 'Windows 10/11';
      fp.brand = 'PC / Laptop';
      fp.model = 'Workstation';
    }

    if (hasStreaming) {
      fp.trafficProfile = 'Heavy Video Streaming (High Bill Impact)';
    } else if (hasSocial) {
      fp.trafficProfile = 'Social Media & Chat';
    } else {
      fp.trafficProfile = 'Background Telemetry';
    }

    fp.evidence = Array.from(evidenceSet);
    this.fingerprints.set(ip, fp);
    return fp;
  }

  // Active Multi-Port & Banner Probe: Google Cast, AirPlay, Apple Sync, UPnP, HTTP banner
  public async probeDevice(ip: string): Promise<DeviceFingerprint | null> {
    const existing = this.fingerprints.get(ip) || { evidence: [] };
    const evidenceSet = new Set(existing.evidence || []);
    const openPorts: number[] = [];

    // Probe common discovery ports in parallel with strict 900ms timeout
    const portsToProbe = [80, 8080, 7000, 8008, 62078, 5555, 445];
    const portChecks = await Promise.all(
      portsToProbe.map(async (port) => {
        const isOpen = await this.probePortOpen(ip, port, 900);
        return { port, isOpen };
      })
    );

    for (const res of portChecks) {
      if (res.isOpen) {
        openPorts.push(res.port);
      }
    }

    existing.openPorts = openPorts;

    // 1. Check Google Cast (port 8008)
    if (openPorts.includes(8008)) {
      evidenceSet.add('Port 8008 open: Google Cast / DIAL receiver');
      const castInfo = await this.probeHttpPort(ip, 8008, '/setup/eureka_info');
      if (castInfo) {
        try {
          const json = JSON.parse(castInfo);
          const name = json.name || json.device_info?.name;
          const model = json.device_info?.model_name || 'Google Cast / Android TV';
          existing.os = 'CastOS / Android';
          existing.brand = 'Google / Smart TV';
          existing.model = model;
          if (name) existing.leakedHost = name;
          evidenceSet.add(`Google Cast announced: "${name || 'Device'}" (${model})`);
        } catch {
          // ignore
        }
      }
    }

    // 2. Check Apple AirPlay (port 7000) or Apple Mobile Device Sync (port 62078)
    if (openPorts.includes(7000) || openPorts.includes(62078)) {
      if (openPorts.includes(7000)) evidenceSet.add('Port 7000 open: Apple AirPlay daemon');
      if (openPorts.includes(62078)) evidenceSet.add('Port 62078 open: Apple MobileDevice Wi-Fi sync');
      if (!existing.brand || existing.brand === 'Android Device') {
        existing.os = 'Apple iOS / tvOS';
        existing.brand = 'Apple';
        existing.model = openPorts.includes(62078) ? 'Apple iPhone' : 'Apple AirPlay Receiver';
      }
    }

    // 3. Check Android ADB (port 5555)
    if (openPorts.includes(5555)) {
      evidenceSet.add('Port 5555 open: Android Debug Bridge (ADB)');
      if (!existing.os) existing.os = 'Android OS (Developer Mode)';
      if (!existing.brand) existing.brand = 'Android Device';
    }

    // 4. Check Windows SMB (port 445)
    if (openPorts.includes(445)) {
      evidenceSet.add('Port 445 open: Microsoft SMB / Samba file sharing');
      if (!existing.brand) {
        existing.os = 'Windows / Samba';
        existing.brand = 'PC / Workstation';
        existing.model = 'Desktop PC';
      }
    }

    // 5. Check Web / UPnP on port 80 / 8080
    if (openPorts.includes(80) || openPorts.includes(8080)) {
      const port = openPorts.includes(80) ? 80 : 8080;
      evidenceSet.add(`Port ${port} open: Web server / UPnP endpoint`);
      const httpBody = await this.probeHttpPort(ip, port, '/');
      if (httpBody) {
        const titleMatch = httpBody.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const pageTitle = titleMatch[1].trim();
          existing.banner = pageTitle;
          evidenceSet.add(`HTTP Page Title: "${pageTitle}"`);
          if (/router|wireless|gateway|mercusys|tp-link|tenda|netgear|zte/i.test(pageTitle)) {
            existing.brand = pageTitle.split(' ')[0] || 'Router';
            existing.model = pageTitle;
            existing.os = 'Router Firmware';
          }
        }
      }
    }

    existing.evidence = Array.from(evidenceSet);
    existing.lastProbedAt = new Date().toISOString();
    this.fingerprints.set(ip, existing);
    return existing;
  }

  private probeHttpPort(ip: string, port: number, path: string): Promise<string | null> {
    return new Promise((resolve) => {
      const req = http.get(
        {
          host: ip,
          port,
          path,
          timeout: 1000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => {
            data += c;
            if (data.length > 8192) req.destroy();
          });
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  private probePortOpen(ip: string, port: number, timeoutMs = 800): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, ip);
    });
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();
