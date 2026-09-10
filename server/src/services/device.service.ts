import { DeviceModel, IDevice } from '../models/Device.model.js';
import { isConnectedToMongo } from '../config/database.js';
import { realNetworkService } from './realNetwork.service.js';
import { dnsGatewayService } from './dnsGateway.service.js';
import { routerService } from './router.service.js';

class DeviceService {
  private memoryStore: Map<string, any> = new Map();

  constructor() {
    // Initial real network discovery in background
    this.rescan().catch(() => {});
  }

  public async rescan(): Promise<any[]> {
    try {
      const realDocs = await realNetworkService.syncRealDevicesToMongo();
      for (const d of realDocs) {
        const obj = d.toObject ? d.toObject() : d;
        const existing = this.memoryStore.get(obj.id);
        if (existing) {
          obj.todayBytesTotal = Math.max(existing.todayBytesTotal || 0, obj.todayBytesTotal || 0);
          obj.currentDownloadBps = obj.status === 'offline' ? 0 : (existing.currentDownloadBps ?? obj.currentDownloadBps);
          obj.currentUploadBps = obj.status === 'offline' ? 0 : (existing.currentUploadBps ?? obj.currentUploadBps);
          if (existing.status === 'paused' || existing.status === 'blocked' || existing.status === 'throttled') {
            obj.status = existing.status;
          }
          obj.isThrottled = existing.isThrottled ?? obj.isThrottled;
        }
        this.memoryStore.set(obj.id, obj);
      }
      return await this.getAll();
    } catch (err) {
      console.error('[DeviceService] Rescan failed:', err);
      return Array.from(this.memoryStore.values());
    }
  }

  public async getAll(): Promise<any[]> {
    let list: any[] = [];
    if (isConnectedToMongo) {
      try {
        const docs = await DeviceModel.find().lean();
        const hasDummy = docs.some(
          (d) =>
            /^Device-\d+$/i.test(d.nickname || '') ||
            /^Apple-Device-\d+$/i.test(d.nickname || '') ||
            /^Samsung-Galaxy-\d+$/i.test(d.nickname || '')
        );
        if (docs.length > 0 && !hasDummy) {
          list = docs;
        } else {
          await realNetworkService.syncRealDevicesToMongo();
          list = await DeviceModel.find().lean();
        }
      } catch {
        // Fallback to memory
      }
    }
    if (list.length === 0) {
      list = Array.from(this.memoryStore.values());
    }

    // Merge live in-memory telemetry (todayBytesTotal, currentDownloadBps, currentUploadBps)
    return list.map((d) => {
      const mem = this.memoryStore.get(d.id);
      if (mem) {
        const status = (mem.status === 'paused' || mem.status === 'blocked' || mem.status === 'throttled')
          ? mem.status
          : d.status;
        const isOffline = status === 'offline';
        return {
          ...d,
          status,
          currentDownloadBps: isOffline ? 0 : (mem.currentDownloadBps ?? d.currentDownloadBps),
          currentUploadBps: isOffline ? 0 : (mem.currentUploadBps ?? d.currentUploadBps),
          todayBytesTotal: Math.max(d.todayBytesTotal || 0, mem.todayBytesTotal || 0),
          isThrottled: mem.isThrottled ?? d.isThrottled,
        };
      }
      return d;
    });
  }

  public async getById(id: string): Promise<any | null> {
    let dev: any = null;
    if (isConnectedToMongo) {
      try {
        dev = await DeviceModel.findOne({ id }).lean();
      } catch {
        // fallback
      }
    }
    if (!dev) {
      dev = this.memoryStore.get(id) || null;
    }
    if (dev) {
      const mem = this.memoryStore.get(dev.id);
      if (mem) {
        return {
          ...dev,
          currentDownloadBps: mem.currentDownloadBps ?? dev.currentDownloadBps,
          currentUploadBps: mem.currentUploadBps ?? dev.currentUploadBps,
          todayBytesTotal: Math.max(dev.todayBytesTotal || 0, mem.todayBytesTotal || 0),
          status: mem.status ?? dev.status,
          isThrottled: mem.isThrottled ?? dev.isThrottled,
        };
      }
    }
    return dev;
  }

  public async updateNickname(id: string, nickname: string): Promise<any> {
    if (isConnectedToMongo) {
      try {
        const updated = await DeviceModel.findOneAndUpdate(
          { id },
          { $set: { nickname } },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (!dev) throw new Error('Device not found');
    dev.nickname = nickname;
    this.memoryStore.set(id, dev);
    return dev;
  }

  public async updateCategory(id: string, category: string): Promise<any> {
    if (isConnectedToMongo) {
      try {
        const updated = await DeviceModel.findOneAndUpdate(
          { id },
          { $set: { category } },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (!dev) throw new Error('Device not found');
    dev.category = category;
    this.memoryStore.set(id, dev);
    return dev;
  }

  public async pause(id: string): Promise<any> {
    const patch = {
      status: 'paused',
      currentDownloadBps: 0,
      currentUploadBps: 0,
    };
    if (isConnectedToMongo) {
      try {
        await DeviceModel.updateOne({ id }, { $set: patch });
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    let enforcement = 'dns_sinkhole_enforced';
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);

      // 1. Enforce physical DNS Sinkhole on UDP Port 53
      if (dev.ip) {
        dnsGatewayService.pauseDevice(dev.ip);
      }
      // 2. Enforce Router Hardware Access Control / MAC Filter
      if (dev.mac) {
        const routerRes = await routerService.blockMac(dev.mac);
        if (routerRes.method === 'router_hardware_filter') {
          enforcement = 'router_hardware_filter';
        }
      }
    }
    return { id, status: 'paused', pausedAt: new Date().toISOString(), enforcement };
  }

  public async resume(id: string): Promise<any> {
    const patch = { status: 'active' };
    if (isConnectedToMongo) {
      try {
        await DeviceModel.updateOne({ id }, { $set: patch });
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);

      // 1. Restore physical DNS access
      if (dev.ip) {
        dnsGatewayService.resumeDevice(dev.ip);
      }
      // 2. Remove Router Hardware Block
      if (dev.mac) {
        await routerService.unblockMac(dev.mac);
      }
    }
    return { id, status: 'active', resumedAt: new Date().toISOString() };
  }

  public async kick(id: string): Promise<any> {
    const dev = this.memoryStore.get(id);
    if (isConnectedToMongo) {
      try {
        await DeviceModel.deleteOne({ id });
      } catch {
        // fallback
      }
    }
    this.memoryStore.delete(id);

    // Physically kick device by forcing disassociation frame via router cycle & transient sinkhole
    if (dev?.mac) {
      await routerService.kickStation(dev.mac);
    }
    if (dev?.ip) {
      dnsGatewayService.pauseDevice(dev.ip);
      setTimeout(() => dnsGatewayService.resumeDevice(dev.ip), 30000);
    }

    return { id, mac: dev?.mac, action: 'deauthenticated', timestamp: new Date().toISOString() };
  }

  public async block(id: string, notes?: string): Promise<any> {
    const patch = { status: 'blocked', currentDownloadBps: 0, currentUploadBps: 0 };
    if (isConnectedToMongo) {
      try {
        await DeviceModel.updateOne({ id }, { $set: patch });
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);

      if (dev.ip) dnsGatewayService.pauseDevice(dev.ip);
      if (dev.mac) await routerService.blockMac(dev.mac);
    }
    return { id, status: 'blocked', notes, blockedAt: new Date().toISOString() };
  }

  public async unblock(id: string): Promise<any> {
    const patch = { status: 'active' };
    if (isConnectedToMongo) {
      try {
        await DeviceModel.updateOne({ id }, { $set: patch });
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);

      if (dev.ip) dnsGatewayService.resumeDevice(dev.ip);
      if (dev.mac) await routerService.unblockMac(dev.mac);
    }
    return { id, status: 'active', message: 'Device unblocked' };
  }

  public async throttle(
    id: string,
    downloadLimitKbps: number,
    uploadLimitKbps: number
  ): Promise<any> {
    const patch = {
      isThrottled: true,
      throttleLimits: { downloadLimitKbps, uploadLimitKbps },
    };
    if (isConnectedToMongo) {
      try {
        const updated = await DeviceModel.findOneAndUpdate(
          { id },
          { $set: patch },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);
    }
    return { id, isThrottled: true, throttleLimits: { downloadLimitKbps, uploadLimitKbps } };
  }

  public async removeThrottle(id: string): Promise<any> {
    const patch = { isThrottled: false, throttleLimits: undefined };
    if (isConnectedToMongo) {
      try {
        await DeviceModel.updateOne({ id }, { $set: patch, $unset: { throttleLimits: 1 } });
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);
    }
    return { id, isThrottled: false, message: 'Throttle removed' };
  }

  public async pauseAll(excludeWhitelisted: boolean = true): Promise<any> {
    let pausedCount = 0;
    for (const [id, dev] of this.memoryStore.entries()) {
      if (excludeWhitelisted && dev.category === 'iot') continue; // IoT devices exempt
      if (dev.status === 'active') {
        dev.status = 'paused';
        dev.currentDownloadBps = 0;
        dev.currentUploadBps = 0;
        pausedCount++;
      }
    }
    return { action: 'pause_all', pausedDevicesCount: pausedCount };
  }

  public async resumeAll(): Promise<any> {
    for (const [id, dev] of this.memoryStore.entries()) {
      if (dev.status === 'paused') {
        dev.status = 'active';
      }
    }
    return { action: 'resume_all' };
  }

  private lastMongoBytesFlush = 0;

  public updateSpeeds(speedMap: Record<string, { downBps: number; upBps: number }>) {
    const deltaMap: Record<string, number> = {};

    for (const [id, speeds] of Object.entries(speedMap)) {
      const dev = this.memoryStore.get(id);
      if (dev && dev.status === 'active') {
        dev.currentDownloadBps = speeds.downBps;
        dev.currentUploadBps = speeds.upBps;
        const delta = (speeds.downBps || 0) + (speeds.upBps || 0);
        dev.todayBytesTotal = (dev.todayBytesTotal || 0) + delta;
        if (delta > 0) {
          deltaMap[id] = delta;
        }
      }
    }

    // Periodically flush accumulated bandwidth delta to MongoDB every 5 seconds
    const now = Date.now();
    if (now - this.lastMongoBytesFlush > 5000 && Object.keys(deltaMap).length > 0) {
      this.lastMongoBytesFlush = now;
      if (isConnectedToMongo) {
        const ops = Object.entries(deltaMap).map(([id, delta]) => ({
          updateOne: {
            filter: { id },
            update: { $inc: { todayBytesTotal: delta } },
          },
        }));
        DeviceModel.bulkWrite(ops).catch(() => {});
      }
    }
  }
}

export const deviceService = new DeviceService();
