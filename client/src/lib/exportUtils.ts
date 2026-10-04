import { Device } from '../types/device';
import { DomainEvent } from '../types/traffic';

export function exportDevicesToCsv(devices: Device[]) {
  const headers = ['ID', 'Hostname', 'Nickname', 'IP', 'MAC', 'Vendor', 'Category', 'Status', 'Signal dBm', 'Link Speed (Mbps)', 'Data Used (Bytes)'];
  const rows = devices.map((d) => [
    `"${d.id}"`,
    `"${d.hostname || ''}"`,
    `"${d.nickname || ''}"`,
    `"${d.ip}"`,
    `"${d.mac}"`,
    `"${d.vendor || ''}"`,
    `"${d.category}"`,
    `"${d.status}"`,
    d.signalDbm,
    d.linkSpeedMbps || 0,
    d.todayBytesTotal || 0,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, `wifi-sentinel-devices-${getDateStr()}.csv`, 'text/csv');
}

export function exportDevicesToJson(devices: Device[]) {
  const jsonContent = JSON.stringify(devices, null, 2);
  downloadBlob(jsonContent, `wifi-sentinel-devices-${getDateStr()}.json`, 'application/json');
}

export function exportActivityToCsv(logs: DomainEvent[]) {
  const headers = ['Timestamp', 'Domain', 'Category', 'Device ID', 'Device Name', 'Status', 'Query Count'];
  const rows = logs.map((l) => [
    `"${new Date(l.timestamp).toISOString()}"`,
    `"${l.domain}"`,
    `"${l.category}"`,
    `"${l.deviceId || ''}"`,
    `"${l.deviceNickname || ''}"`,
    `"${l.status}"`,
    l.queryCountToday || 1,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, `wifi-sentinel-activity-${getDateStr()}.csv`, 'text/csv');
}

function getDateStr() {
  return new Date().toISOString().split('T')[0];
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
