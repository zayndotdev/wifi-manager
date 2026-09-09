import mongoose, { Schema, Document } from 'mongoose';

export interface IMeshNode extends Document {
  nodeId: string;
  name: string;
  isMainRouter: boolean;
  ip: string;
  connectedClientsCount: number;
  backhaul: {
    type: 'ethernet' | 'wireless_5ghz' | 'wireless_6ghz';
    signalDbm?: number;
    speedMbps?: number;
  };
  channel24: number;
  channel5: number;
}

export const MeshNodeSchema = new Schema<IMeshNode>(
  {
    nodeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    isMainRouter: { type: Boolean, default: false },
    ip: { type: String, required: true },
    connectedClientsCount: { type: Number, default: 0 },
    backhaul: {
      type: { type: String, enum: ['ethernet', 'wireless_5ghz', 'wireless_6ghz'], default: 'ethernet' },
      signalDbm: { type: Number },
      speedMbps: { type: Number, default: 1000 },
    },
    channel24: { type: Number, default: 6 },
    channel5: { type: Number, default: 149 },
  },
  { timestamps: true }
);

export const MeshNodeModel = mongoose.models.MeshNode || mongoose.model<IMeshNode>('MeshNode', MeshNodeSchema);
