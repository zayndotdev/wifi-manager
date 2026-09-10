import { ScheduleModel } from '../models/Schedule.model.js';
import { isConnectedToMongo } from '../config/database.js';
import { deviceService } from './device.service.js';

class ScheduleService {
  private schedules: Map<string, any> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private activeCurfews: Set<string> = new Set(); // scheduleId -> currently enforcing pause

  constructor() {
    this.loadFromMongo();
    this.startCurfewLoop();
  }

  private async loadFromMongo() {
    if (isConnectedToMongo) {
      try {
        const docs = await ScheduleModel.find().lean();
        docs.forEach((s: any) => this.schedules.set(s.id, s));
      } catch {
        // Fallback
      }
    }
  }

  private startCurfewLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.evaluateCurfewRules().catch(() => {});
    }, 30000); // check every 30 seconds
  }

  private async evaluateCurfewRules() {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // 'mon', 'tue', etc.
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    for (const [id, sch] of this.schedules.entries()) {
      if (!sch.enabled || !sch.days || !sch.startTime || !sch.endTime) continue;

      const appliesToday = sch.days.some(
        (d: string) => d.toLowerCase().startsWith(currentDay.substring(0, 3))
      );

      if (!appliesToday) {
        // Not active today
        if (this.activeCurfews.has(id)) {
          this.activeCurfews.delete(id);
          if (sch.deviceId) {
            await deviceService.resume(sch.deviceId);
            console.log(`[ScheduleService] Bedtime curfew ended for device: ${sch.deviceId}`);
          }
        }
        continue;
      }

      const [startH, startM] = sch.startTime.split(':').map((n: string) => parseInt(n, 10));
      const [endH, endM] = sch.endTime.split(':').map((n: string) => parseInt(n, 10));
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      let isCurfewActive = false;
      if (startMinutes < endMinutes) {
        // Same-day window (e.g. 14:00 to 18:00)
        isCurfewActive = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Overnight window (e.g. 21:00 to 07:00 next morning)
        isCurfewActive = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      if (isCurfewActive && !this.activeCurfews.has(id)) {
        this.activeCurfews.add(id);
        if (sch.deviceId) {
          await deviceService.pause(sch.deviceId);
          console.log(`[ScheduleService] Bedtime curfew ENFORCED: physically paused device: ${sch.deviceId}`);
        }
      } else if (!isCurfewActive && this.activeCurfews.has(id)) {
        this.activeCurfews.delete(id);
        if (sch.deviceId) {
          await deviceService.resume(sch.deviceId);
          console.log(`[ScheduleService] Bedtime curfew EXPIRED: physically resumed device: ${sch.deviceId}`);
        }
      }
    }
  }

  public async getAll(): Promise<any[]> {
    if (isConnectedToMongo) {
      try {
        const docs = await ScheduleModel.find().lean();
        return docs;
      } catch {
        // Fallback
      }
    }
    return Array.from(this.schedules.values());
  }

  public async create(data: any): Promise<any> {
    const id = `sched_${Date.now().toString(36)}`;
    const newSchedule = { id, ...data };
    if (isConnectedToMongo) {
      try {
        await ScheduleModel.create(newSchedule);
      } catch {
        // Fallback
      }
    }
    this.schedules.set(id, newSchedule);
    this.evaluateCurfewRules().catch(() => {});
    return newSchedule;
  }

  public async toggle(id: string, enabled: boolean): Promise<any> {
    if (isConnectedToMongo) {
      try {
        await ScheduleModel.findOneAndUpdate({ id }, { $set: { enabled } });
      } catch {
        // Fallback
      }
    }
    const sch = this.schedules.get(id);
    if (!sch) throw new Error('Schedule not found');
    sch.enabled = enabled;
    this.schedules.set(id, sch);
    this.evaluateCurfewRules().catch(() => {});
    return sch;
  }

  public async delete(id: string): Promise<boolean> {
    if (isConnectedToMongo) {
      try {
        await ScheduleModel.deleteOne({ id });
      } catch {
        // Fallback
      }
    }
    if (this.activeCurfews.has(id)) {
      this.activeCurfews.delete(id);
      const sch = this.schedules.get(id);
      if (sch?.deviceId) {
        await deviceService.resume(sch.deviceId);
      }
    }
    return this.schedules.delete(id);
  }
}

export const scheduleService = new ScheduleService();
