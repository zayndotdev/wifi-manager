const API_BASE = typeof window !== 'undefined' && window.location.port.startsWith('51')
  ? 'http://127.0.0.1:5080/api'
  : '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
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

  // Traffic & Domains
  getRecentDomains: (category: string = 'all') =>
    request<{ total: number; domains: import('../types/traffic').DomainEvent[] }>(
      `/domains/recent?category=${category}`
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
};
