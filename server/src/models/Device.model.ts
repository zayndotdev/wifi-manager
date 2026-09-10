import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  id: string;
  mac: string;
  ip: string;
  ipv6?: string;
  hostname: string;
  nickname?: string;
  vendor: string;
  category: 'phone' | 'laptop' | 'tablet' | 'tv' | 'console' | 'iot' | 'audio' | 'printer' | 'unknown';
  status: 'active' | 'idle' | 'offline' | 'paused' | 'blocked' | 'throttled';
  signalDbm: number;
  latencyMs?: number;
  estimatedDistanceMeters?: number;
  proximityTier?: 'immediate' | 'adjacent' | 'far' | 'unknown';
  meshNodeId: string;
  meshNodeName: string;
  band: '2.4GHz' | '5GHz' | '6GHz';
  channel?: number;
  linkSpeedMbps: number;
  currentDownloadBps: number;
  currentUploadBps: number;
  todayBytesTotal: number;
  connectedAt: Date;
  lastSeenAt: Date;
  isRandomizedMac: boolean;
  isNewDevice: boolean;
  isThrottled?: boolean;
  throttleLimits?: {
    downloadLimitKbps: number;
    uploadLimitKbps: number;
  };
  bedtimeScheduleId?: string;
}

export const DeviceSchema = new Schema<IDevice>(
  {
    id: { type: String, required: true, unique: true, index: true },
    mac: { type: String, required: true, unique: true, index: true },
    ip: { type: String, required: true, index: true },
    ipv6: { type: String },
    hostname: { type: String, required: true },
    nickname: { type: String },
    vendor: { type: String, required: true },
    category: {
      type: String,
      enum: ['phone', 'laptop', 'tablet', 'tv', 'console', 'iot', 'audio', 'printer', 'unknown'],
      default: 'unknown',
    },
    status: {
      type: String,
      enum: ['active', 'idle', 'offline', 'paused', 'blocked', 'throttled'],
      default: 'active',
      index: true,
    },
    signalDbm: { type: Number, default: -60 },
    latencyMs: { type: Number, default: 0 },
    estimatedDistanceMeters: { type: Number, default: 0 },
    proximityTier: {
      type: String,
      enum: ['immediate', 'adjacent', 'far', 'unknown'],
      default: 'unknown',
    },
    meshNodeId: { type: String, default: 'node_01' },
    meshNodeName: { type: String, default: 'Gateway AP' },
    band: { type: String, enum: ['2.4GHz', '5GHz', '6GHz'], default: '5GHz' },
    channel: { type: Number, default: 36 },
    linkSpeedMbps: { type: Number, default: 433 },
    currentDownloadBps: { type: Number, default: 0 },
    currentUploadBps: { type: Number, default: 0 },
    todayBytesTotal: { type: Number, default: 0 },
    connectedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    isRandomizedMac: { type: Boolean, default: false },
    isNewDevice: { type: Boolean, default: false },
    isThrottled: { type: Boolean, default: false },
    throttleLimits: {
      downloadLimitKbps: { type: Number },
      uploadLimitKbps: { type: Number },
    },
    bedtimeScheduleId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const DeviceModel =
  mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
