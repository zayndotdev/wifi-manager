import mongoose, { Schema, Document } from 'mongoose';

export interface IDomainLog extends Document {
  id: string;
  domain: string;
  category: 'streaming' | 'social' | 'gaming' | 'work' | 'education' | 'shopping' | 'adult' | 'ad_tracker' | 'general';
  deviceId: string;
  deviceNickname: string;
  timestamp: Date;
  status: 'allowed' | 'blocked' | 'safesearch';
  queryCountToday: number;
  bytesTransferred?: number;
}

export const DomainLogSchema = new Schema<IDomainLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    domain: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['streaming', 'social', 'gaming', 'work', 'education', 'shopping', 'adult', 'ad_tracker', 'general'],
      default: 'general',
      index: true,
    },
    deviceId: { type: String, required: true, index: true },
    deviceNickname: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['allowed', 'blocked', 'safesearch'],
      default: 'allowed',
    },
    queryCountToday: { type: Number, default: 1 },
    bytesTransferred: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const DomainLogModel = mongoose.models.DomainLog || mongoose.model<IDomainLog>('DomainLog', DomainLogSchema);
