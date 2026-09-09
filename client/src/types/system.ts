export interface GatewayStatus {
  status: 'online' | 'degraded' | 'offline';
  gatewayIp: string;
  wanIp: string;
  uptimeSeconds: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  firmwareVersion: string;
  activeBandwidth: {
    downloadBps: number;
    uploadBps: number;
  };
  clientCounts: {
    total: number;
    active: number;
    paused: number;
    blocked: number;
  };
}

export interface SecurityAlert {
  id: string;
  type: 'new_device_connected' | 'malicious_domain_blocked' | 'bandwidth_spike' | 'suspicious_traffic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  targetMac?: string;
  timestamp: string;
  isRead: boolean;
}

export interface MeshNode {
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
