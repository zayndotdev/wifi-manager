import mongoose from 'mongoose';
import { DomainLogModel, IDomainLog } from '../models/DomainLog.model.js';
import { isConnectedToMongo } from '../config/database.js';

export const SYSTEM_NOISE_REGEX =
  /(mongodb\.(net|com)|compute\.amazonaws\.com|\.amazonaws\.com|\.cloudfront\.net|azurefd\.net|azureedge\.net|trafficmanager\.net|cloudapp\.azure\.com|cloudapp\.net|core\.windows\.net|msedge\.net|office\.net|cloud\.microsoft|skype\.com|prod\.do\.dsp\.mp\.microsoft\.com|events\.data\.microsoft\.com|delivery\.mp\.microsoft\.com|delivery\.microsoft\.com|trafficshaping|windowsupdate\.com|storequality\.microsoft\.com|data\.microsoft\.com|exp-tas\.com|iris\.microsoft\.com|cwsapp|update\.microsoft\.com|wdcp\.microsoft\.com|displaycatalog|bigcatalog|\.commerce\.microsoft\.com|api\.cdp\.microsoft\.com|storeedge|oneocsp\.microsoft\.com|telecommandsvc|teams\.microsoft\.com|teams\.office\.com|outlook\.office365\.com|oneclient\.sfx\.ms|login\.live\.com|identity\.live\.com|g\.live\.com|\.live\.com|login\.microsoftonline\.com|assets\.msn\.com|\.msn\.com|smartscreen|wns\.windows\.com|time\.windows\.com|notify\.windows\.com|msftncsi\.com|msftconnecttest\.com|pki-goog|googleusercontent\.com|googleapis\.com|gstatic\.com|gvt1\.com|gvt2\.com|1e100\.net|\.goog$|\.goog\/|\.pki\.goog|cloudcode-pa|cdn\.whatsapp\.net|\.whatsapp\.net|wisprflow|ip-api\.com|registry\.npmjs\.org|schemastore|freedownloadmanager\.org|sentry\.io|bugsnag\.com|crashlytics\.com|segment\.io|\.akamaiedge\.net|\.edgekey\.net|\.edgesuite\.net|\.akadns\.net|\.akamai\.net|\.akamaized\.net|fastly\.net|gcdn\.co|digicert\.com|msidentity\.com|lencr\.org|sectigo\.com|ecs\.office\.com|tm-\d+\.office\.com|svc\..*\.office\.com|\.local$|\.arpa$|\.internal$|\.lan$)/i;

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

        // Deduplicate legacy duplicate records in MongoDB Atlas
        const allDomains = await DomainLogModel.distinct('domain');
        for (const dom of allDomains) {
          const docs = await DomainLogModel.find({ domain: dom }).sort({ timestamp: -1 });
          if (docs.length > 1) {
            const keepDoc = docs[0];
            let totalQueries = keepDoc.queryCountToday || 1;
            let totalBytes = keepDoc.bytesTransferred || 0;
            const toDeleteIds: any[] = [];
            for (let i = 1; i < docs.length; i++) {
              totalQueries += (docs[i].queryCountToday || 1);
              totalBytes += (docs[i].bytesTransferred || 0);
              toDeleteIds.push(docs[i]._id);
            }
            await DomainLogModel.deleteMany({ _id: { $in: toDeleteIds } });
            keepDoc.queryCountToday = totalQueries;
            keepDoc.bytesTransferred = totalBytes;
            await keepDoc.save();
          }
        }

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
        await this.purgeHistoricalNoise();
        const docs = await DomainLogModel.find().sort({ timestamp: -1 }).limit(150).lean();
        this.domainList = docs.filter((d) => !SYSTEM_NOISE_REGEX.test(d.domain)).slice(0, 100);
      } catch (err: any) {
        console.error('[TrafficService] loadFromMongo error:', err.message);
      }
    }
  }

  public async getRecentDomains(category?: string, deviceId?: string): Promise<{ total: number; domains: any[] }> {
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        const query: any = {};
        if (category && category !== 'all') {
          query.category = category;
        }
        if (deviceId) {
          query.deviceId = deviceId;
        }
        const docs = await DomainLogModel.find(query).sort({ timestamp: -1 }).limit(150).lean();
        const clean = docs.filter((d) => !SYSTEM_NOISE_REGEX.test(d.domain)).slice(0, 100);
        return { total: clean.length, domains: clean };
      } catch (err: any) {
        console.error('[TrafficService] getRecentDomains error:', err.message);
      }
    }

    let result = this.domainList.filter((d) => !SYSTEM_NOISE_REGEX.test(d.domain));
    if (category && category !== 'all') {
      result = result.filter((d) => d.category === category);
    }
    if (deviceId) {
      result = result.filter((d) => d.deviceId === deviceId);
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

    // Deduplicate and aggregate in MongoDB: update existing record if already logged for this device today
    if (mongoose.connection.readyState === 1 || isConnectedToMongo) {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existing = await DomainLogModel.findOne({
          domain: event.domain,
          deviceId: event.deviceId,
          timestamp: { $gte: startOfDay },
        });

        if (existing) {
          existing.queryCountToday = (existing.queryCountToday || 1) + 1;
          existing.timestamp = event.timestamp || new Date();
          if (event.bytesTransferred) {
            existing.bytesTransferred = (existing.bytesTransferred || 0) + event.bytesTransferred;
          }
          await existing.save();
          event.id = existing.id;
          event.queryCountToday = existing.queryCountToday;
          event.bytesTransferred = existing.bytesTransferred;
        } else {
          await DomainLogModel.create(event);
        }
      } catch {
        // Ignore error
      }
    }

    // Deduplicate in-memory list
    const idx = this.domainList.findIndex(
      (d) => d.domain.toLowerCase() === event.domain.toLowerCase() && d.deviceId === event.deviceId
    );
    if (idx !== -1) {
      this.domainList[idx].timestamp = event.timestamp || new Date();
      this.domainList[idx].queryCountToday = event.queryCountToday || (this.domainList[idx].queryCountToday || 1) + 1;
      if (event.bytesTransferred) {
        this.domainList[idx].bytesTransferred = (this.domainList[idx].bytesTransferred || 0) + event.bytesTransferred;
      }
      const [updated] = this.domainList.splice(idx, 1);
      this.domainList.unshift(updated);
    } else {
      this.domainList.unshift(event);
      if (this.domainList.length > 200) {
        this.domainList.pop();
      }
    }
  }
}

export const trafficService = new TrafficService();
