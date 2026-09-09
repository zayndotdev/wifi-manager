export type DeviceCategory =
  | 'phone'
  | 'laptop'
  | 'tablet'
  | 'tv'
  | 'console'
  | 'iot'
  | 'audio'
  | 'printer'
  | 'unknown';

export type DeviceStatus = 'active' | 'idle' | 'paused' | 'blocked' | 'throttled';

export interface Device {
  id: string;
  mac: string;
  ip: string;
  ipv6?: string;
  hostname: string;
  nickname?: string;
  vendor: string;
  category: DeviceCategory;
  status: DeviceStatus;
  signalDbm: number;
  meshNodeId: string;
  meshNodeName: string;
  band: '2.4GHz' | '5GHz' | '6GHz';
  channel?: number;
  linkSpeedMbps: number;
  currentDownloadBps: number;
  currentUploadBps: number;
  todayBytesTotal: number;
  connectedAt: string;
  lastSeenAt: string;
  isRandomizedMac: boolean;
  isNew?: boolean;
  isThrottled?: boolean;
  throttleLimits?: {
    downloadLimitKbps: number;
    uploadLimitKbps: number;
  };
  bedtimeScheduleId?: string;
}
