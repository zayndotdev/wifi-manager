import { ScheduleModel } from '../models/Schedule.model.js';
import { isConnectedToMongo } from '../config/database.js';

class ScheduleService {
  private schedules: Map<string, any> = new Map();

  constructor() {
    this.loadFromMongo();
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
    return this.schedules.delete(id);
  }
}

export const scheduleService = new ScheduleService();
