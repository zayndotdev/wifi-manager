import dgram from 'dgram';
import dnsPacket from 'dns-packet';
import { trafficService } from './traffic.service.js';
import { telemetryBroadcaster } from '../websocket/telemetryServer.js';

export interface DnsSinkholeStats {
  totalQueries: number;
  blockedQueries: number;
  allowedQueries: number;
  activePausedIps: number;
  uptimeSeconds: number;
}

class DnsGatewayService {
  private socket: dgram.Socket | null = null;
  private isRunning: boolean = false;
  private pausedIps: Set<string> = new Set();
  private blockedDomains: Set<string> = new Set(['doubleclick.net', 'tracker-telemetry.analytics.io']);
  private upstreamDns: string = '1.1.1.1';
  private upstreamPort: number = 53;
  private startTime: number = 0;
  private totalQueries: number = 0;
  private blockedQueries: number = 0;

  public start(port: number = 53, host: string = '0.0.0.0'): Promise<boolean> {
    if (this.isRunning) return Promise.resolve(true);

    return new Promise((resolve) => {
      try {
        this.socket = dgram.createSocket('udp4');

        this.socket.on('error', (err) => {
          console.error('[DnsGateway] UDP socket error:', err.message);
          if ((err as any).code === 'EADDRINUSE' || (err as any).code === 'EACCES') {
            console.warn('[DnsGateway] Port 53 unavailable, DNS sinkhole disabled.');
          }
          this.isRunning = false;
          resolve(false);
        });

        this.socket.on('message', (msg, rinfo) => {
          this.handleDnsMessage(msg, rinfo);
        });

        this.socket.bind(port, host, () => {
          this.isRunning = true;
          this.startTime = Date.now();
          console.log(`[DnsGateway] Active DNS Gateway & Sinkhole Engine listening on ${host}:${port}`);
          resolve(true);
        });
      } catch (err: any) {
        console.error('[DnsGateway] Failed to start DNS Gateway:', err.message);
        this.isRunning = false;
        resolve(false);
      }
    });
  }

  public stop(): void {
    if (this.socket && this.isRunning) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
      this.isRunning = false;
      console.log('[DnsGateway] DNS Gateway stopped.');
    }
  }

  public pauseDevice(ip: string): void {
    if (!ip) return;
    this.pausedIps.add(ip.trim());
    console.log(`[DnsGateway] Enforcing physical DNS pause for IP: ${ip}`);
  }

  public resumeDevice(ip: string): void {
    if (!ip) return;
    this.pausedIps.delete(ip.trim());
    console.log(`[DnsGateway] Restored physical DNS access for IP: ${ip}`);
  }

  public isDevicePaused(ip: string): boolean {
    return this.pausedIps.has(ip.trim());
  }

  public blockDomain(domain: string): void {
    if (!domain) return;
    this.blockedDomains.add(domain.toLowerCase().trim());
  }

  public unblockDomain(domain: string): void {
    if (!domain) return;
    this.blockedDomains.delete(domain.toLowerCase().trim());
  }

  public getStats(): DnsSinkholeStats {
    return {
      totalQueries: this.totalQueries,
      blockedQueries: this.blockedQueries,
      allowedQueries: Math.max(0, this.totalQueries - this.blockedQueries),
      activePausedIps: this.pausedIps.size,
      uptimeSeconds: this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
    };
  }

  private handleDnsMessage(msg: Buffer, rinfo: dgram.RemoteInfo): void {
    this.totalQueries++;
    const clientIp = rinfo.address;

    let decoded: any;
    try {
      decoded = dnsPacket.decode(msg);
    } catch {
      // Invalid packet format
      return;
    }

    if (!decoded.questions || decoded.questions.length === 0) {
      return;
    }

    const question = decoded.questions[0];
    const qName = (question.name || '').toLowerCase().trim();
    const qType = question.type || 'A';

    const isClientPaused = this.pausedIps.has(clientIp);
    const isDomainBlocked = this.blockedDomains.has(qName);

    // 1. PHYSICAL ENFORCEMENT: Client is Paused OR Domain is Blocked -> Sinkhole immediately!
    if (isClientPaused || isDomainBlocked) {
      this.blockedQueries++;

      const answers: any[] = [];
      if (qType === 'A') {
        answers.push({
          type: 'A',
          name: question.name,
          ttl: 5,
          data: '0.0.0.0',
        });
      } else if (qType === 'AAAA') {
        answers.push({
          type: 'AAAA',
          name: question.name,
          ttl: 5,
          data: '::',
        });
      }

      try {
        const sinkholeResponse = dnsPacket.encode({
          type: 'response',
          id: decoded.id,
          flags: (dnsPacket as any).AUTHORITATIVE_ANSWER || 0x8400,
          questions: decoded.questions,
          answers,
        });

        this.socket?.send(sinkholeResponse, rinfo.port, rinfo.address);

        // Record live sinkholed event
        const liveEvent = {
          id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          domain: qName || 'blocked-query',
          category: isClientPaused ? 'general' : 'ad_tracker',
          deviceId: `ip_${clientIp.replace(/\./g, '_')}`,
          deviceNickname: isClientPaused ? `Paused Client (${clientIp})` : clientIp,
          timestamp: new Date(),
          status: 'blocked',
          queryCountToday: 1,
          bytesTransferred: 0,
        };

        trafficService.addLiveEvent(liveEvent);
        telemetryBroadcaster.broadcast('dns_activity', { event: liveEvent });
      } catch (err: any) {
        console.error('[DnsGateway] Failed to send sinkhole response:', err.message);
      }
      return;
    }

    // 2. Client is Allowed -> Forward upstream to 1.1.1.1 / 8.8.8.8
    const upstreamSocket = dgram.createSocket('udp4');

    upstreamSocket.on('error', () => {
      try {
        upstreamSocket.close();
      } catch {
        // ignore
      }
    });

    upstreamSocket.on('message', (upstreamReply) => {
      try {
        this.socket?.send(upstreamReply, rinfo.port, rinfo.address);

        // Log authentic allowed query event
        if (qName && !trafficService['domainList']?.some?.((d: any) => d.domain === qName)) {
          const liveEvent = {
            id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            domain: qName,
            category: 'general',
            deviceId: `ip_${clientIp.replace(/\./g, '_')}`,
            deviceNickname: clientIp,
            timestamp: new Date(),
            status: 'allowed',
            queryCountToday: 1,
            bytesTransferred: msg.length + upstreamReply.length,
          };
          trafficService.addLiveEvent(liveEvent);
          telemetryBroadcaster.broadcast('dns_activity', { event: liveEvent });
        }
      } catch {
        // ignore
      } finally {
        try {
          upstreamSocket.close();
        } catch {
          // ignore
        }
      }
    });

    try {
      upstreamSocket.send(msg, this.upstreamPort, this.upstreamDns);
    } catch {
      try {
        upstreamSocket.close();
      } catch {
        // ignore
      }
    }
  }
}

export const dnsGatewayService = new DnsGatewayService();
