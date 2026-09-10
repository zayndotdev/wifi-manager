import mongoose, { Schema } from 'mongoose';

export interface IRouterConfig {
  id: string;
  ip: string;
  model: string;
  username: string;
  password?: string;
  isConnected: boolean;
  lastConnectedAt?: Date;
  autoBlockMac: boolean;
  enforcementMode: 'router_hardware' | 'dns_sinkhole' | 'hybrid';
}

export const RouterConfigSchema = new Schema<IRouterConfig>(
  {
    id: { type: String, required: true, unique: true, default: 'default_router' },
    ip: { type: String, required: true, default: '192.168.1.1' },
    model: { type: String, default: 'ZTE TEWA-220G' },
    username: { type: String, default: 'admin' },
    password: { type: String, default: '' },
    isConnected: { type: Boolean, default: false },
    lastConnectedAt: { type: Date },
    autoBlockMac: { type: Boolean, default: true },
    enforcementMode: {
      type: String,
      enum: ['router_hardware', 'dns_sinkhole', 'hybrid'],
      default: 'hybrid',
    },
  },
  {
    timestamps: true,
  }
);

export const RouterConfigModel =
  mongoose.models.RouterConfig || mongoose.model<IRouterConfig>('RouterConfig', RouterConfigSchema);
