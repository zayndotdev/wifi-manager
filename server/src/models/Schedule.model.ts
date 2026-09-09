import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  deviceIds: string[];
  action: string;
  enabled: boolean;
}

export const ScheduleSchema = new Schema<ISchedule>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    daysOfWeek: [{ type: Number }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    deviceIds: [{ type: String }],
    action: { type: String, default: 'pause_wan' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ScheduleModel = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);
