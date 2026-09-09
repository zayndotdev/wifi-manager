import mongoose from 'mongoose';
import { DomainLogModel, IDomainLog } from '../models/DomainLog.model.js';
import { isConnectedToMongo } from '../config/database.js';

const SYSTEM_NOISE_REGEX = /(mongodb\.(net|com)|compute\.amazonaws\.com|\.amazonaws\.com|\.cloudfront\.net|azurefd\.net|azureedge\.net|trafficmanager\.net|cloudapp\.azure\.com|cloudapp\.net|core\.windows\.net|msedge\.net|office\.net|cloud\.microsoft|skype\.com|prod\.do\.dsp\.mp\.microsoft\.com|events\.data\.microsoft\.com|delivery\.mp\.microsoft\.com|windowsupdate\.com|storequality\.microsoft\.com|data\.microsoft\.com|exp-tas\.com|iris\.microsoft\.com|cwsapp|update\.microsoft\.com|wdcp\.microsoft\.com|pki-goog|googleusercontent\.com|googleapis\.com|gvt1\.com|1e100\.net|\.goog$|\.goog\/|\.pki\.goog|wisprflow\.com|sentry\.io|bugsnag\.com|crashlytics\.com|segment\.io|\.akamaiedge\.net|\.edgekey\.net|\.edgesuite\.net|\.akadns\.net|\.akamai\.net|\.akamaized\.net|fastly\.net|gcdn\.co|digicert\.com|msidentity\.com|assets\.msn\.com|ecs\.office\.com|tm-\d+\.office\.com|svc\..*\.office\.com|\.local$|\.arpa$|\.internal$|\.lan$)/i;

class TrafficService {
  private domainList: any[];
  private blockedDomains: Set<string>;

  constructor() {
    this.blockedDomains = new Set(['doubleclick.net', 'tracker-telemetry.analytics.io']);
    this.domainList = [];
    this.loadFromMongo();
  }

  public async purgeHistoricalNoise(): Promise<number> {
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        const res = await DomainLogModel.deleteMany({ domain: { $regex: SYSTEM_NOISE_REGEX } });
        console.log(`[TrafficService] Purged ${res.deletedCount} historical noise domain logs from MongoDB Atlas.`);
        return res.deletedCount || 0;
      } catch (err: any) {
        console.error('[TrafficService] Error purging historical noise:', err.message);
        return 0;
      }
    }
    return 0;
  }

  private async loadFromMongo() {
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        // Clean purge any historical background cloud infrastructure noise
        await this.purgeHistoricalNoise();

        const docs = await DomainLogModel.find({ domain: { $not: SYSTEM_NOISE_REGEX } })
          .sort({ timestamp: -1 })
          .limit(100)
          .lean();
        if (docs.length > 0) {
          this.domainList = docs;
        }
      } catch {
        // Fallback
      }
    }
  }

  public async getRecentDomains(category?: string): Promise<{ total: number; domains: any[] }> {
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        const query: any = { domain: { $not: SYSTEM_NOISE_REGEX } };
        if (category && category !== 'all') {
          query.category = category;
        }
        const docs = await DomainLogModel.find(query).sort({ timestamp: -1 }).limit(100).lean();
        if (docs.length > 0) {
          return { total: docs.length, domains: docs };
        }
      } catch {
        // Fallback
      }
    }

    let result = this.domainList.filter((d) => !SYSTEM_NOISE_REGEX.test(d.domain));
    if (category && category !== 'all') {
      result = result.filter((d) => d.category === category);
    }
    return {
      total: result.length,
      domains: result,
    };
  }

  public async blockDomain(domain: string): Promise<any> {
    this.blockedDomains.add(domain.toLowerCase());
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        await DomainLogModel.updateMany(
          { domain: new RegExp(`^${domain}$`, 'i') },
          { $set: { status: 'blocked' } }
        );
      } catch {
        // Fallback
      }
    }
    this.domainList.forEach((d) => {
      if (d.domain.toLowerCase() === domain.toLowerCase()) {
        d.status = 'blocked';
      }
    });
    return { domain, status: 'blocked', blockedAt: new Date().toISOString() };
  }

  public async unblockDomain(domain: string): Promise<any> {
    this.blockedDomains.delete(domain.toLowerCase());
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        await DomainLogModel.updateMany(
          { domain: new RegExp(`^${domain}$`, 'i') },
          { $set: { status: 'allowed' } }
        );
      } catch {
        // Fallback
      }
    }
    this.domainList.forEach((d) => {
      if (d.domain.toLowerCase() === domain.toLowerCase()) {
        d.status = 'allowed';
      }
    });
    return { domain, status: 'allowed', unblockedAt: new Date().toISOString() };
  }

  public async addLiveEvent(event: any) {
    if (SYSTEM_NOISE_REGEX.test(event.domain)) {
      return;
    }

    if (this.blockedDomains.has(event.domain.toLowerCase())) {
      event.status = 'blocked';
    }

    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        await DomainLogModel.create(event);
      } catch {
        // Ignore duplicate or error
      }
    }

    this.domainList.unshift(event);
    if (this.domainList.length > 200) {
      this.domainList.pop();
    }
  }
}

export const trafficService = new TrafficService();
