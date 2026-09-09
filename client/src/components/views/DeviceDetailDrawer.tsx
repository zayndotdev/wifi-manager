import * as React from 'react';
import { Drawer } from '../ui/Drawer';
import { Device, DeviceCategory } from '../../types/device';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DeviceIcon } from '../ui/DeviceIcon';
import { RssiIndicator } from '../ui/RssiIndicator';
import { formatBytes, formatSpeed, formatDuration } from '../../lib/formatters';
import { useDevices } from '../../context/DeviceContext';
import { api } from '../../lib/api';
import { DomainEvent } from '../../types/traffic';
import {
  Pause,
  Play,
  Sliders,
  UserX,
  Ban,
  Shield,
  Clock,
  Radio,
  Wifi,
  ExternalLink,
} from 'lucide-react';

export interface DeviceDetailDrawerProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenThrottleModal: (device: Device) => void;
  onOpenKickModal: (device: Device) => void;
}

export const DeviceDetailDrawer: React.FC<DeviceDetailDrawerProps> = ({
  device,
  isOpen,
  onClose,
  onOpenThrottleModal,
  onOpenKickModal,
}) => {
  const { pauseDevice, resumeDevice, blockDevice, updateCategory } = useDevices();
  const [deviceDomains, setDeviceDomains] = React.useState<DomainEvent[]>([]);

  // Fetch recent domains for this specific device
  React.useEffect(() => {
    if (!device) return;
    api.getRecentDomains('all').then((res) => {
      setDeviceDomains(res.domains.filter((d) => d.deviceId === device.id).slice(0, 6));
    }).catch(() => {});
  }, [device?.id]);

  if (!device) return null;

  const isPaused = device.status === 'paused';
  const isBlocked = device.status === 'blocked';

  const proximityLabel =
    device.signalDbm >= -50
      ? 'Immediate Room (< 3m)'
      : device.signalDbm >= -68
      ? 'Adjacent Room (3 - 8m)'
      : 'Edge of Coverage (> 8m)';

  const categories: DeviceCategory[] = [
    'phone',
    'laptop',
    'tablet',
    'tv',
    'console',
    'iot',
    'audio',
    'printer',
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={device.nickname || device.hostname}
      subtitle={`${device.vendor} • ${device.ip}`}
    >
      <div className="space-y-6 text-xs">
        {/* Top Action Bar */}
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/40">
          <Button
            variant={isPaused ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => (isPaused ? resumeDevice(device.id) : pauseDevice(device.id))}
          >
            {isPaused ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
            <span>{isPaused ? 'Resume Internet' : 'Pause Internet'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onClose();
              onOpenThrottleModal(device);
            }}
          >
            <Sliders className="h-3 w-3" />
            <span>Speed Limit</span>
          </Button>
        </div>

        {/* Real-time Speeds & Data */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] text-foreground-secondary">
            Live Bandwidth Telemetry
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-card">
            <div>
              <span className="text-[10px] text-foreground-muted block">Download Rate</span>
              <span className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {formatSpeed(device.currentDownloadBps)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-foreground-muted block">Upload Rate</span>
              <span className="font-mono text-base font-semibold text-primary">
                {formatSpeed(device.currentUploadBps)}
              </span>
            </div>
            <div className="pt-2 border-t border-border col-span-2 flex items-center justify-between">
              <span className="text-foreground-secondary">Today's Total Usage</span>
              <span className="font-semibold text-foreground font-mono">
                {formatBytes(device.todayBytesTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Network & Hardware Identity */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] text-foreground-secondary">
            Hardware & Network Parameters
          </h4>
          <div className="divide-y divide-border rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">MAC Address</span>
              <span className="font-mono font-medium text-foreground">{device.mac}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Private MAC (Randomized)</span>
              <span>{device.isRandomizedMac ? 'Yes (iOS/Android)' : 'No (Hardware MAC)'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">IP Address</span>
              <span className="font-mono text-foreground">{device.ip}</span>
            </div>
            {device.ipv6 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-foreground-secondary">IPv6 Address</span>
                <span className="font-mono text-[10px] text-foreground-muted truncate max-w-[180px]">
                  {device.ipv6}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Hardware Manufacturer</span>
              <span className="text-foreground font-medium">{device.vendor}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Device Category</span>
              <select
                value={device.category}
                onChange={(e) => updateCategory(device.id, e.target.value)}
                className="h-6 text-xs rounded border border-border bg-secondary px-2 text-foreground"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Wi-Fi Radio & Proximity */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] text-foreground-secondary">
            Wireless Radio & Proximity
          </h4>
          <div className="divide-y divide-border rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Connected Access Point</span>
              <span className="font-medium text-foreground">{device.meshNodeName}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Wi-Fi Band & Channel</span>
              <span>{device.band} (Ch {device.channel || 36})</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Radio Link Speed</span>
              <span className="font-mono">{device.linkSpeedMbps} Mbps PHY</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Signal Attenuation (RSSI)</span>
              <RssiIndicator dbm={device.signalDbm} />
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-foreground-secondary">Estimated Proximity</span>
              <span className="text-foreground font-medium">{proximityLabel}</span>
            </div>
          </div>
        </div>

        {/* Recent Visited Domains */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] text-foreground-secondary">
            Recent Domains Visited by This Device
          </h4>
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            {deviceDomains.length === 0 ? (
              <p className="text-foreground-muted text-[11px] py-2 text-center">
                No recent domain queries logged for this device.
              </p>
            ) : (
              deviceDomains.map((dom) => (
                <div key={dom.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="font-medium text-foreground truncate">{dom.domain}</span>
                  <Badge variant={dom.status === 'blocked' ? 'blocked' : 'neutral'} className="text-[10px]">
                    {dom.category}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danger Zone Actions */}
        <div className="pt-4 border-t border-border space-y-2">
          <h4 className="text-xs font-semibold text-rose-600 mb-2 uppercase tracking-wider text-[10px]">
            Access Governance & Restriction
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20"
              onClick={() => {
                onClose();
                onOpenKickModal(device);
              }}
            >
              <UserX className="h-3.5 w-3.5 mr-1.5" />
              Kick Off Network
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => {
                blockDevice(device.id, 'Blocked from drawer');
                onClose();
              }}
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Ban MAC Address
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
