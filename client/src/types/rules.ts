export interface BedtimeSchedule {
  id: string;
  name: string;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // e.g. "21:00"
  endTime: string; // e.g. "07:00"
  deviceIds: string[];
  enabled: boolean;
  isCurrentlyActive?: boolean;
}

export interface BlacklistEntry {
  id: string;
  mac: string;
  deviceName?: string;
  notes?: string;
  blockedAt: string;
}
