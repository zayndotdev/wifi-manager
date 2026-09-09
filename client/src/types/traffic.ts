export type DomainCategory =
  | 'streaming'
  | 'social'
  | 'gaming'
  | 'work'
  | 'education'
  | 'shopping'
  | 'adult'
  | 'ad_tracker'
  | 'general';

export interface DomainEvent {
  id: string;
  domain: string;
  category: DomainCategory;
  deviceId: string;
  deviceNickname: string;
  timestamp: string;
  status: 'allowed' | 'blocked' | 'safesearch';
  queryCountToday: number;
  bytesTransferred?: number;
}

export interface LiveSpeedPoint {
  timestamp: number;
  downloadBps: number;
  uploadBps: number;
}
