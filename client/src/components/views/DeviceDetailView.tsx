import * as React from 'react';
import { Device, DeviceCategory } from '../../types/device';
import { DomainEvent } from '../../types/traffic';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DeviceIcon } from '../ui/DeviceIcon';
import { RssiIndicator } from '../ui/RssiIndicator';
import { formatBytes, formatSpeed } from '../../lib/formatters';
import { useDevices } from '../../context/DeviceContext';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { useWebSocket } from '../../context/WebSocketContext';
import { isUserFacingDomain } from '../../lib/domainFilter';
import {
  ArrowLeft,
  Pause,
  Play,
  Sliders,
  UserX,
  Ban,
  Shield,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  Globe,
  HardDrive,
  ArrowDown,
  ArrowUp,
  Copy,
  Check,
  Edit2,
  Lock,
  Cpu,
  RefreshCw,
  Server,
  Activity,
  Layers,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemLoggerDrawer } from '../common/SystemLoggerDrawer';
import { cn } from '../../lib/utils';

export interface DeviceDetailViewProps {
  deviceId: string;
  onBack: () => void;
  onOpenThrottleModal: (device: Device) => void;
  onOpenKickModal: (device: Device) => void;
}

export const DeviceDetailView: React.FC<DeviceDetailViewProps> = ({
  deviceId,
  onBack,
  onOpenThrottleModal,
  onOpenKickModal,
}) => {
  const {
    devices,
    isLoading,
    pauseDevice,
    resumeDevice,
    blockDevice,
    updateNickname,
    updateCategory,
  } = useDevices();
  const { toast } = useToast();

  const [directDevice, setDirectDevice] = React.useState<Device | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = React.useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = React.useState(false);

  const matchedDevice = devices.find((d) => d.id === deviceId);
  const device = matchedDevice || directDevice;

  React.useEffect(() => {
    if (!matchedDevice && deviceId) {
      setIsFetchingDirect(true);
      api.getDeviceById(deviceId)
        .then((res: Device) => {
          if (res) setDirectDevice(res);
        })
        .catch(() => {})
        .finally(() => setIsFetchingDirect(false));
    }
  }, [matchedDevice, deviceId]);

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [nicknameInput, setNicknameInput] = React.useState('');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const { addListener } = useWebSocket();
  const [deviceDomains, setDeviceDomains] = React.useState<DomainEvent[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = React.useState(false);
  const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'activity' | 'network' | 'rules'>('overview');

  // Load clean user domains (Approach A)
  const fetchDeviceDomains = React.useCallback(async () => {
    if (!device) return;
    try {
      setIsLoadingDomains(true);
      const res = await api.getRecentDomains('all', device.id);
      const filtered = (res?.domains || []).filter(
        (d) =>
          isUserFacingDomain(d.domain) &&
          (d.deviceId === device.id ||
            d.deviceNickname?.toLowerCase() === (device.nickname || device.hostname).toLowerCase())
      );
      setDeviceDomains(filtered);
    } catch {
      // ignore
    } finally {
      setIsLoadingDomains(false);
    }
  }, [device]);

  React.useEffect(() => {
    fetchDeviceDomains();
  }, [fetchDeviceDomains]);

  // Live WebSocket listener for new real DNS user activity for this device
  React.useEffect(() => {
    if (!device) return;
    const unsubscribe = addListener('dns_activity', (payload: any) => {
      const event = payload?.event;
      if (!event || !isUserFacingDomain(event.domain)) return;
      if (
        event.deviceId === device.id ||
        event.deviceNickname?.toLowerCase() === (device.nickname || device.hostname).toLowerCase()
      ) {
        setDeviceDomains((prev) => {
          const withoutCurrent = prev.filter((d) => d.domain.toLowerCase() !== event.domain.toLowerCase());
          return [event, ...withoutCurrent].slice(0, 50);
        });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [device?.id, device?.nickname, device?.hostname, addListener]);

  React.useEffect(() => {
    if (device) {
      setNicknameInput(device.nickname || device.hostname);
    }
  }, [device?.nickname, device?.hostname]);

  if (!device && (isLoading || isFetchingDirect)) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 animate-fade-in text-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-foreground-muted">Loading device parameters from gateway...</p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-foreground-muted">Device not found or disconnected from the network.</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Devices List
        </Button>
      </div>
    );
  }

  const isPaused = device.status === 'paused';
  const isBlocked = device.status === 'blocked';
  const isOffline = device.status === 'offline';

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({ type: 'info', title: 'Copied to Clipboard', description: `${fieldName}: ${text}` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) return;
    try {
      await updateNickname(device.id, nicknameInput.trim());
      setIsEditingName(false);
      toast({ type: 'success', title: 'Device Renamed', description: `Saved as "${nicknameInput.trim()}"` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Rename Failed', description: err.message });
    }
  };

  const proximityLabel = isOffline
    ? 'Offline / Disconnected'
    : device.estimatedDistanceMeters != null
    ? `~${device.estimatedDistanceMeters}m (${device.proximityTier === 'immediate' ? 'Immediate Room' : device.proximityTier === 'adjacent' ? 'Adjacent Room' : 'Far Area'})`
    : device.signalDbm >= -50
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
    'unknown',
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 cursor-pointer shadow-subtle hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Devices</span>
          </Button>
          <div className="text-xs text-foreground-muted hidden sm:flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-foreground hover:underline" onClick={onBack}>Devices</span>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[220px]">
              {device.nickname || device.hostname}
            </span>
          </div>
          <Badge variant="neutral" className="text-[10px] hidden md:inline-flex font-mono">
            {device.id}
          </Badge>
        </div>

        {/* Global Quick Action Controls + Shareable URL Link */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-foreground-muted hover:text-foreground"
            onClick={() => {
              const url = `${window.location.origin}/devices/${device.id}`;
              navigator.clipboard.writeText(url);
              toast({ type: 'info', title: 'Shareable URL Copied', description: url });
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>
          <Button
            variant={isPaused ? 'primary' : 'secondary'}
            size="sm"
            disabled={isOffline}
            className="flex-1 sm:flex-none gap-1.5"
            onClick={() => (isPaused ? resumeDevice(device.id) : pauseDevice(device.id))}
          >
            {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? 'Resume Internet' : isOffline ? 'Device Offline' : 'Pause Internet'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isOffline}
            className="flex-1 sm:flex-none gap-1.5"
            onClick={() => onOpenThrottleModal(device)}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Speed Limit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20"
            onClick={() => onOpenKickModal(device)}
          >
            <UserX className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Force Disconnect</span>
            <span className="md:hidden">Kick</span>
          </Button>

          <Button
            variant={isBlocked ? 'subtle' : 'destructive'}
            size="sm"
            className="flex-1 sm:flex-none gap-1.5"
            onClick={() => blockDevice(device.id, 'Blocked from Dedicated Device View')}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{isBlocked ? 'Unblock' : 'Block MAC'}</span>
          </Button>
        </div>
      </div>

      {/* Offline Alert Banner */}
      {isOffline && (
        <Card className="p-4 border-slate-500/30 bg-slate-500/10 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center shrink-0">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Device is currently disconnected / offline
              </h4>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                Local ICMP ping reachability probes did not receive a response from {device.ip}.
                {device.lastSeenAt ? ` Device was last detected on ${new Date(device.lastSeenAt).toLocaleString()}.` : ''}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Paused Physical Enforcement Status Banner */}
      {isPaused && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/10 shadow-subtle animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                  Internet Paused — Physical Network Enforcement Active
                </h4>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Port 53 UDP Sinkhole is actively dropping domain resolution for <code>{device.ip}</code> and router MAC blocking is registered.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsLoggerOpen(true)}
              className="gap-1.5 font-mono text-xs text-amber-600 border-amber-300 dark:border-amber-800 dark:text-amber-400 shrink-0"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>View Live Logs</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Main Hero Header Card */}
      <Card className="p-6 bg-gradient-to-r from-card via-card to-secondary/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-subtle">
              <DeviceIcon category={device.category} className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      className="text-lg font-bold bg-background border border-primary rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                    <Button size="xs" variant="primary" onClick={handleSaveNickname}>
                      Save
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setIsEditingName(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {device.nickname || device.hostname}
                    </h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-foreground-muted hover:text-foreground p-1 rounded transition-colors cursor-pointer"
                      title="Rename device"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Status Badges */}
                {isPaused ? (
                  <>
                    <Badge variant="paused">Internet Paused</Badge>
                    <Badge variant="blocked" className="text-[10px] font-mono">
                      Port 53 Sinkholed & Hardware Blocked
                    </Badge>
                  </>
                ) : isBlocked ? (
                  <Badge variant="blocked">Access Blocked</Badge>
                ) : isOffline ? (
                  <Badge variant="offline" dot>Offline / Unreachable</Badge>
                ) : (
                  <Badge variant="online" dot>Online & Active</Badge>
                )}
                {device.isThrottled && <Badge variant="throttled">Bandwidth Throttled</Badge>}
                {device.isRandomizedMac ? (
                  <Badge variant="neutral">Private Randomized MAC</Badge>
                ) : (
                  <Badge variant="neutral">Hardware Factory MAC</Badge>
                )}
              </div>

              {/* Subtitle row with quick copyable chips */}
              <div className="flex items-center gap-3 text-xs text-foreground-secondary flex-wrap">
                <span className="font-semibold text-foreground">{device.vendor}</span>
                <span>•</span>
                <button
                  onClick={() => copyToClipboard(device.ip, 'IP Address')}
                  className="flex items-center gap-1 font-mono hover:text-foreground transition-colors cursor-pointer bg-secondary/80 px-2 py-0.5 rounded border border-border"
                >
                  <span>{device.ip}</span>
                  {copiedField === 'IP Address' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-foreground-muted" />}
                </button>
                <span>•</span>
                <button
                  onClick={() => copyToClipboard(device.mac, 'MAC Address')}
                  className="flex items-center gap-1 font-mono hover:text-foreground transition-colors cursor-pointer bg-secondary/80 px-2 py-0.5 rounded border border-border"
                >
                  <span>{device.mac}</span>
                  {copiedField === 'MAC Address' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-foreground-muted" />}
                </button>
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
            <span className="text-xs text-foreground-secondary">Category:</span>
            <select
              value={device.category}
              onChange={(e) => updateCategory(device.id, e.target.value)}
              className="text-xs rounded-md border border-border bg-card px-3 py-1.5 text-foreground font-medium focus:ring-1 focus:ring-primary shadow-subtle cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Top 4 Key Live Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-secondary font-medium">Download Rate</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isOffline ? '0 B/s' : formatSpeed(device.currentDownloadBps)}
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">{isOffline ? 'Offline / idle' : 'Live incoming payload'}</p>
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-secondary font-medium">Upload Rate</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-primary">
              {isOffline ? '0 B/s' : formatSpeed(device.currentUploadBps)}
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">{isOffline ? 'Offline / idle' : 'Live outbound traffic'}</p>
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-secondary font-medium">Total Data Used Today</span>
            <div className="h-8 w-8 rounded-lg bg-secondary text-foreground flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-foreground">
              {formatBytes(device.todayBytesTotal)}
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">Cumulative daily consumption</p>
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-secondary font-medium">Wi-Fi Signal Strength</span>
            <div className="h-8 w-8 rounded-lg bg-secondary text-foreground flex items-center justify-center">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">
                {isOffline ? 'Offline' : `${device.signalDbm} dBm`}
              </span>
              {!isOffline && <RssiIndicator dbm={device.signalDbm} showDbmText={false} />}
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">{proximityLabel}</p>
          </div>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
            activeSubTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          Comprehensive Specifications
        </button>
        <button
          onClick={() => setActiveSubTab('activity')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
            activeSubTab === 'activity'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          <span>Visited Domains & Activity</span>
          <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
            {deviceDomains.length}
          </Badge>
        </button>
        <button
          onClick={() => setActiveSubTab('network')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
            activeSubTab === 'network'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          Network & IP Stack
        </button>
        <button
          onClick={() => setActiveSubTab('rules')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
            activeSubTab === 'rules'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          Policies & Bandwidth Rules
        </button>
      </div>

      {/* Sub-Tab 1: Comprehensive Specifications */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wireless & Radio Telemetry */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <CardTitle>Wireless Radio & PHY Link</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Connected Access Point</td>
                    <td className="py-2.5 text-right font-medium text-foreground">{device.meshNodeName}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Mesh Node Identifier</td>
                    <td className="py-2.5 text-right font-mono text-foreground-secondary">{device.meshNodeId}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Frequency Band</td>
                    <td className="py-2.5 text-right font-medium text-foreground">{device.band}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Operating Wi-Fi Channel</td>
                    <td className="py-2.5 text-right font-medium text-foreground">Channel {device.channel || 36}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">PHY Link Rate (Negotiated)</td>
                    <td className="py-2.5 text-right font-mono text-foreground">{device.linkSpeedMbps} Mbps</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Signal Attenuation (RSSI)</td>
                    <td className="py-2.5 text-right font-mono text-foreground">
                      {isOffline ? (
                        <span className="text-foreground-muted">No carrier / Offline</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span>{device.signalDbm} dBm</span>
                          <RssiIndicator dbm={device.signalDbm} showDbmText={false} />
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">ICMP Ping Round-Trip (RTT)</td>
                    <td className="py-2.5 text-right font-mono font-medium text-foreground">
                      {isOffline ? (
                        <span className="text-foreground-muted">Request Timed Out (Offline)</span>
                      ) : device.latencyMs != null ? (
                        <span className="text-emerald-600 dark:text-emerald-400">{device.latencyMs} ms</span>
                      ) : (
                        <span className="text-foreground-muted">Measuring...</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Estimated Distance (Physics Model)</td>
                    <td className="py-2.5 text-right font-medium text-foreground">
                      {isOffline ? (
                        <span className="text-foreground-muted">Offline</span>
                      ) : (
                        <span>
                          {device.estimatedDistanceMeters != null ? `~${device.estimatedDistanceMeters} meters` : 'Local Host'}
                          {device.proximityTier ? ` (${device.proximityTier === 'immediate' ? 'Immediate Room' : device.proximityTier === 'adjacent' ? 'Adjacent Room' : 'Far Area'})` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Hardware & Identity Specs */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <CardTitle>Hardware & Identity Specifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Device Hostname</td>
                    <td className="py-2.5 text-right font-mono text-foreground truncate max-w-[200px]">
                      {device.hostname}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">MAC Address</td>
                    <td className="py-2.5 text-right font-mono text-foreground">{device.mac}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Manufacturer / Vendor</td>
                    <td className="py-2.5 text-right font-medium text-foreground">{device.vendor}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">MAC Privacy Mode</td>
                    <td className="py-2.5 text-right">
                      {device.isRandomizedMac ? (
                        <span className="text-amber-600 font-medium">Randomized (Privacy Protection)</span>
                      ) : (
                        <span className="text-foreground">Burned-in Factory MAC</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Device Classification</td>
                    <td className="py-2.5 text-right font-medium capitalize text-foreground">{device.category}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">Assigned ID</td>
                    <td className="py-2.5 text-right font-mono text-foreground-muted text-[11px]">{device.id}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-Tab 2: Visited Domains & Web Activity */}
      {activeSubTab === 'activity' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Live Visited Domains for {device.nickname || device.hostname}</CardTitle>
              <p className="text-xs text-foreground-muted mt-0.5">
                Real DNS lookups and web destinations accessed by this client
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDeviceDomains}
              isLoading={isLoadingDomains}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-y border-border text-foreground-secondary uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 font-semibold">Domain / Hostname</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Gateway Action</th>
                  <th className="p-3 font-semibold text-right">Block Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deviceDomains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground-muted">
                      No web destinations logged specifically for this device yet.
                    </td>
                  </tr>
                ) : (
                  deviceDomains.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-foreground-muted" />
                          <span className="font-mono text-xs">{item.domain}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="neutral">{item.category}</Badge>
                      </td>
                      <td className="p-3 text-foreground-muted tabular-nums">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3">
                        {item.status === 'blocked' ? (
                          <Badge variant="blocked">DNS Sinkholed</Badge>
                        ) : (
                          <Badge variant="online">Forwarded</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant={item.status === 'blocked' ? 'subtle' : 'outline'}
                          size="xs"
                          onClick={async () => {
                            if (item.status === 'blocked') {
                              await api.unblockDomain(item.domain);
                              toast({ type: 'success', title: 'Domain Restored', description: `${item.domain} unblocked` });
                            } else {
                              await api.blockDomain(item.domain);
                              toast({ type: 'warning', title: 'Domain Blocked', description: `${item.domain} sinkholed` });
                            }
                            fetchDeviceDomains();
                          }}
                        >
                          {item.status === 'blocked' ? 'Unblock' : 'Block'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sub-Tab 3: Network & IP Stack */}
      {activeSubTab === 'network' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <CardTitle>TCP/IP Network Stack & Addressing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2.5 text-foreground-secondary">Assigned IPv4 Address</td>
                  <td className="py-2.5 text-right font-mono font-medium text-foreground">{device.ip}</td>
                </tr>
                {device.ipv6 && (
                  <tr>
                    <td className="py-2.5 text-foreground-secondary">IPv6 Address</td>
                    <td className="py-2.5 text-right font-mono text-foreground truncate max-w-[280px]">
                      {device.ipv6}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 text-foreground-secondary">Subnet Mask</td>
                  <td className="py-2.5 text-right font-mono text-foreground">255.255.255.0 (/24)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-foreground-secondary">Default Gateway</td>
                  <td className="py-2.5 text-right font-mono text-foreground">192.168.1.1</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-foreground-secondary">DNS Resolver Gateway</td>
                  <td className="py-2.5 text-right font-mono text-foreground">192.168.1.1 (Wi-Fi Sentinel)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-foreground-secondary">DHCP Allocation Type</td>
                  <td className="py-2.5 text-right font-medium text-foreground">Dynamic DHCP Lease</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-foreground-secondary">Last Active Telemetry</td>
                  <td className="py-2.5 text-right font-mono text-foreground-muted">
                    {new Date(device.lastSeenAt).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 4: Policies & Bandwidth Rules */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle>Bandwidth Rate Limiting</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div>
                  <span className="font-semibold text-foreground block text-xs">Throttle Status</span>
                  <span className="text-[11px] text-foreground-muted">
                    {device.isThrottled
                      ? `Active: ${device.throttleLimits?.downloadLimitKbps} Kbps Down / ${device.throttleLimits?.uploadLimitKbps} Kbps Up`
                      : 'Unrestricted hardware speed'}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => onOpenThrottleModal(device)}>
                  <Sliders className="h-3.5 w-3.5 mr-1.5" />
                  {device.isThrottled ? 'Modify Limits' : 'Configure Limit'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle>Bedtime Curfew & Parental Controls</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-foreground-secondary mb-3">
                Assign this client to scheduled bedtime cutoffs to automatically disable Wi-Fi access during night hours.
              </p>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Nightly Curfew Assignment</span>
                <Badge variant="neutral">Configured in Rules & Bedtime Tab</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-Time Diagnostic Terminal Drawer */}
      <SystemLoggerDrawer isOpen={isLoggerOpen} onClose={() => setIsLoggerOpen(false)} />
    </div>
  );
};
