const API_BASE = typeof window !== 'undefined' && window.location.port.startsWith('51')
  ? 'http://127.0.0.1:5080/api'
  : '/api';

let authToken = typeof window !== 'undefined' ? localStorage.getItem('sentinel_auth_token') : null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('sentinel_auth_token', token);
  } else {
    localStorage.removeItem('sentinel_auth_token');
  }
};

export const getAuthToken = () => authToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error || errData.message) {
        errorMsg = errData.error || errData.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // System
  getSystemStatus: () => request<import('../types/system').GatewayStatus>('/system/status'),
  
  // Devices
  getDevices: () => request<import('../types/device').Device[]>('/devices'),
  getDevice: (id: string) => request<import('../types/device').Device>(`/devices/${id}`),
  scanDevices: () => request<{ message: string; count: number; devices: import('../types/device').Device[] }>('/devices/scan', { method: 'POST' }),
  getDeviceById: (id: string) => request<import('../types/device').Device>(`/devices/${id}`),
  updateDeviceNickname: (id: string, nickname: string) =>
    request<import('../types/device').Device>(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ nickname }),
    }),
  updateDeviceCategory: (id: string, category: string) =>
    request<import('../types/device').Device>(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ category }),
    }),
  pauseDevice: (id: string) =>
    request<{ id: string; status: string }>(`/devices/${id}/pause`, { method: 'POST' }),
  resumeDevice: (id: string) =>
    request<{ id: string; status: string }>(`/devices/${id}/resume`, { method: 'POST' }),
  kickDevice: (id: string) =>
    request<{ id: string; action: string }>(`/devices/${id}/kick`, { method: 'POST' }),
  blockDevice: (id: string, notes?: string) =>
    request<{ id: string; status: string }>(`/devices/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  unblockDevice: (id: string) =>
    request<{ id: string; status: string }>(`/devices/${id}/block`, { method: 'DELETE' }),
  throttleDevice: (id: string, downloadLimitKbps: number, uploadLimitKbps: number) =>
    request<import('../types/device').Device>(`/devices/${id}/throttle`, {
      method: 'POST',
      body: JSON.stringify({ downloadLimitKbps, uploadLimitKbps }),
    }),
  removeThrottle: (id: string) =>
    request<{ id: string; isThrottled: boolean }>(`/devices/${id}/throttle`, { method: 'DELETE' }),
  pauseAllDevices: (excludeWhitelisted: boolean = true) =>
    request<{ action: string; pausedDevicesCount: number }>('/network/pause-all', {
      method: 'POST',
      body: JSON.stringify({ excludeWhitelisted }),
    }),
  resumeAllDevices: () =>
    request<{ action: string }>('/network/resume-all', { method: 'POST' }),

  // Fingerprint & Anti-Leech Bandwidth Guard
  probeDevice: (id: string) =>
    request<{ device: import('../types/device').Device; fingerprint: any }>(`/devices/${id}/probe`, { method: 'POST' }),
  probeAllDevices: () =>
    request<{ probedCount: number; devices: import('../types/device').Device[] }>('/devices/probe-all', { method: 'POST' }),
  throttleUnknownDevices: (downloadLimitKbps: number = 512, uploadLimitKbps: number = 128) =>
    request<{ action: string; downloadLimitKbps: number; uploadLimitKbps: number; count: number; devices: any[] }>(
      '/devices/guard/throttle-unknown',
      { method: 'POST', body: JSON.stringify({ downloadLimitKbps, uploadLimitKbps }) }
    ),
  pauseUnknownDevices: () =>
    request<{ action: string; count: number; devices: any[] }>('/devices/guard/pause-unknown', { method: 'POST' }),
  resumeUnknownDevices: () =>
    request<{ action: string; count: number; devices: any[] }>('/devices/guard/resume-unknown', { method: 'POST' }),

  // Traffic & Domains
  getRecentDomains: (category: string = 'all', deviceId?: string) =>
    request<{ total: number; domains: import('../types/traffic').DomainEvent[] }>(
      `/domains/recent?category=${category}${deviceId ? `&deviceId=${encodeURIComponent(deviceId)}` : ''}`
    ),
  blockDomain: (domain: string) =>
    request<{ domain: string; status: string }>('/domains/block', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }),
  unblockDomain: (domain: string) =>
    request<{ domain: string; status: string }>('/domains/block', {
      method: 'DELETE',
      body: JSON.stringify({ domain }),
    }),

  // Schedules
  getSchedules: () => request<import('../types/rules').BedtimeSchedule[]>('/schedules'),
  createSchedule: (data: Omit<import('../types/rules').BedtimeSchedule, 'id'>) =>
    request<import('../types/rules').BedtimeSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleSchedule: (id: string, enabled: boolean) =>
    request<import('../types/rules').BedtimeSchedule>(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),
  deleteSchedule: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/schedules/${id}`, { method: 'DELETE' }),

  // Mesh Nodes
  getMeshNodes: () => request<import('../types/system').MeshNode[]>('/mesh/nodes'),

  // Security Alerts
  getAlerts: () => request<import('../types/system').SecurityAlert[]>('/security/alerts'),
  dismissAlert: (id: string) =>
    request<{ id: string; isRead: boolean }>(`/security/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead: true }),
    }),

  // Router Gateway Hardware Integration
  getRouterConfig: () => request<any>('/system/router'),
  saveRouterConfig: (data: any) =>
    request<any>('/system/router', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testRouterConnection: (data: any) =>
    request<any>('/system/router/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDnsStats: () => request<any>('/system/dns/stats'),
  getSystemLogs: (limit: number = 100) => request<{ total: number; logs: any[] }>(`/system/logs?limit=${limit}`),
  clearSystemLogs: () => request<{ success: boolean; message: string }>('/system/logs', { method: 'DELETE' }),

  // SaaS Autonomous Layer 2 ARP Engine
  getArpStatus: () =>
    request<{
      available: boolean;
      enginePath: string;
      driverStatus: 'ready' | 'npcap_missing' | 'error';
      activePauses: string[];
    }>('/system/arp/status'),
  installArpDriver: () =>
    request<{ success: boolean; message: string; path: string }>('/system/arp/install-driver', {
      method: 'POST',
    }),

  // Authentication
  login: (username: string, password: string) =>
    request<{ message: string; token: string; user: { username: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => request<{ user: { username: string; role: string } }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Diagnostic Speedtest
  getSpeedtestPing: () =>
    request<{ pingMs: number; jitterMs: number; gatewayIp: string; timestamp: number }>('/system/speedtest/ping'),
  runSpeedtestDownload: async (sizeMb: number = 4): Promise<{ bytes: number; durationMs: number; speedMbps: number }> => {
    const start = performance.now();
    const res = await fetch(`${API_BASE}/system/speedtest/download?size=${sizeMb}`);
    const blob = await res.blob();
    const durationMs = Math.max(1, performance.now() - start);
    const speedMbps = parseFloat(((blob.size * 8) / (durationMs / 1000) / 1000000).toFixed(2));
    return { bytes: blob.size, durationMs, speedMbps };
  },
  runSpeedtestUpload: async (sizeMb: number = 2): Promise<{ speedMbps: number; elapsedSec: number }> => {
    const payload = new Uint8Array(sizeMb * 1024 * 1024);
    const start = performance.now();
    const res = await fetch(`${API_BASE}/system/speedtest/upload`, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const durationMs = Math.max(1, performance.now() - start);
    try {
      const data = await res.json();
      return { speedMbps: data.speedMbps || parseFloat(((payload.byteLength * 8) / (durationMs / 1000) / 1000000).toFixed(2)), elapsedSec: data.elapsedSec || durationMs / 1000 };
    } catch {
      return { speedMbps: parseFloat(((payload.byteLength * 8) / (durationMs / 1000) / 1000000).toFixed(2)), elapsedSec: durationMs / 1000 };
    }
  },

  // Configuration Backup & Restore
  exportBackup: () => request<any>('/system/backup'),
  restoreBackup: (bundle: any) =>
    request<{ success: boolean; message: string }>('/system/restore', {
      method: 'POST',
      body: JSON.stringify(bundle),
    }),

  // Wi-Fi Security Audit
  getWifiSecurityAudit: () =>
    request<{
      ssid: string;
      bssid: string;
      radioType: string;
      band: string;
      securityStandard: string;
      wpsStatus: string;
      guestNetworkIsolated: boolean;
      channelInterference: string;
      securityScore: number;
      rating: string;
      recommendations: string[];
    }>('/system/audit'),

  // Bandwidth Quota Tracker
  getBandwidthQuota: () =>
    request<{
      monthlyCapGb: number;
      billingCycleStartDay: number;
      usedGb: number;
      remainingGb: number;
      percentUsed: number;
      daysRemaining: number;
      isNearCap: boolean;
    }>('/system/quota'),
  updateBandwidthQuota: (data: { monthlyCapGb?: number; billingCycleStartDay?: number }) =>
    request<{ success: boolean; quota: any }>('/system/quota', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
