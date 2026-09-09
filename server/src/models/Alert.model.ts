import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  id: string;
  type: 'new_device_connected' | 'malicious_domain_blocked' | 'bandwidth_spike' | 'suspicious_traffic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  targetMac?: string;
  timestamp: Date;
  isRead: boolean;
}

export const AlertSchema = new Schema<IAlert>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['new_device_connected', 'malicious_domain_blocked', 'bandwidth_spike', 'suspicious_traffic'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetMac: { type: String },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AlertModel = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
