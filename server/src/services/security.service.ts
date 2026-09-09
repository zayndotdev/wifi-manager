import { AlertModel } from '../models/Alert.model.js';
import { isConnectedToMongo } from '../config/database.js';

class SecurityService {
  private alerts: any[] = [];

  constructor() {
    this.alerts = [];
    this.loadFromMongo();
  }

  private async loadFromMongo() {
    if (isConnectedToMongo) {
      try {
        const docs = await AlertModel.find().sort({ timestamp: -1 }).limit(50).lean();
        if (docs.length > 0) {
          this.alerts = docs;
        }
      } catch {
        // Fallback
      }
    }
  }

  public async getAlerts(): Promise<any[]> {
    if (isConnectedToMongo) {
      try {
        const docs = await AlertModel.find().sort({ timestamp: -1 }).limit(50).lean();
        return docs;
      } catch {
        // Fallback
      }
    }
    return this.alerts;
  }

  public async markAsRead(id: string): Promise<any> {
    if (isConnectedToMongo) {
      try {
        await AlertModel.findOneAndUpdate({ id }, { $set: { isRead: true } });
      } catch {
        // Fallback
      }
    }
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) alert.isRead = true;
    return alert || { id, isRead: true };
  }

  public async addAlert(alert: any) {
    if (isConnectedToMongo) {
      try {
        await AlertModel.create(alert);
      } catch {
        // Ignore
      }
    }
    this.alerts.unshift(alert);
  }
}

export const securityService = new SecurityService();
