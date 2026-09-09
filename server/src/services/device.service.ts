import { DeviceModel, IDevice } from '../models/Device.model.js';
import { isConnectedToMongo } from '../config/database.js';
import { realNetworkService } from './realNetwork.service.js';

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
        this.memoryStore.set(obj.id, obj);
      }
      return await this.getAll();
    } catch (err) {
      console.error('[DeviceService] Rescan failed:', err);
      return Array.from(this.memoryStore.values());
    }
  }

  public async getAll(): Promise<any[]> {
    if (isConnectedToMongo) {
      try {
        const docs = await DeviceModel.find().lean();
        const hasDummy = docs.some(
          (d) =>
            /^Device-\d+$/i.test(d.nickname || '') ||
            /^Apple-Device-\d+$/i.test(d.nickname || '') ||
            /^Samsung-Galaxy-\d+$/i.test(d.nickname || '')
        );
        if (docs.length > 0 && !hasDummy) return docs;
        // If empty or contains old dummy/fabricated names, force a fresh network sync
        await realNetworkService.syncRealDevicesToMongo();
        return await DeviceModel.find().lean();
      } catch {
        // Fallback to memory
      }
    }
    return Array.from(this.memoryStore.values());
  }

  public async getById(id: string): Promise<any | null> {
    if (isConnectedToMongo) {
      try {
        const doc = await DeviceModel.findOne({ id }).lean();
        if (doc) return doc;
      } catch {
        // fallback
      }
    }
    return this.memoryStore.get(id) || null;
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
    if (dev) {
      Object.assign(dev, patch);
      this.memoryStore.set(id, dev);
    }
    return { id, status: 'paused', pausedAt: new Date().toISOString() };
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
    }
    return { id, status: 'active', resumedAt: new Date().toISOString() };
  }

  public async kick(id: string): Promise<any> {
    if (isConnectedToMongo) {
      try {
        await DeviceModel.deleteOne({ id });
      } catch {
        // fallback
      }
    }
    const dev = this.memoryStore.get(id);
    this.memoryStore.delete(id);
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

  public updateSpeeds(speedMap: Record<string, { downBps: number; upBps: number }>) {
    for (const [id, speeds] of Object.entries(speedMap)) {
      const dev = this.memoryStore.get(id);
      if (dev && dev.status === 'active') {
        dev.currentDownloadBps = speeds.downBps;
        dev.currentUploadBps = speeds.upBps;
        dev.todayBytesTotal += speeds.downBps + speeds.upBps;
      }
    }
  }
}

export const deviceService = new DeviceService();
