import { DomainLogModel, IDomainLog } from '../models/DomainLog.model.js';
import { isConnectedToMongo } from '../config/database.js';

class TrafficService {
  private domainList: any[] = [];
  private blockedDomains: Set<string> = new Set(['doubleclick.net', 'tracker-telemetry.analytics.io']);

  constructor() {
    this.domainList = [];
    this.loadFromMongo();
  }

  private async loadFromMongo() {
    if (isConnectedToMongo) {
      try {
        const docs = await DomainLogModel.find().sort({ timestamp: -1 }).limit(100).lean();
        if (docs.length > 0) {
          this.domainList = docs;
        }
      } catch {
        // Fallback
      }
    }
  }

  public async getRecentDomains(category?: string): Promise<{ total: number; domains: any[] }> {
    if (isConnectedToMongo) {
      try {
        const query: any = {};
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

    let result = this.domainList;
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
    if (isConnectedToMongo) {
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
    if (isConnectedToMongo) {
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
    if (this.blockedDomains.has(event.domain.toLowerCase())) {
      event.status = 'blocked';
    }

    if (isConnectedToMongo) {
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
