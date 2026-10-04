import * as React from 'react';
import { useDevices } from '../../context/DeviceContext';
import { Device, DeviceCategory } from '../../types/device';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { DeviceIcon } from '../ui/DeviceIcon';
import { RssiIndicator } from '../ui/RssiIndicator';
import { formatBytes, formatSpeed } from '../../lib/formatters';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import {
  Search,
  LayoutGrid,
  List,
  Pause,
  Play,
  MoreVertical,
  Sliders,
  UserX,
  Ban,
  Pencil,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  WifiOff,
  Radio,
  Download,
  Shield,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { exportDevicesToCsv, exportDevicesToJson } from '../../lib/exportUtils';

export interface DevicesViewProps {
  onSelectDevice: (deviceId: string) => void;
  onOpenThrottleModal: (device: Device) => void;
  onOpenKickModal: (device: Device) => void;
  onOpenFullDetails?: (deviceId: string) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  onSelectDevice,
  onOpenThrottleModal,
  onOpenKickModal,
  onOpenFullDetails,
}) => {
  const {
    devices,
    pauseDevice,
    resumeDevice,
    blockDevice,
    updateNickname,
    isScanning,
    scanNetwork,
    probeDevice,
    probeAllDevices,
    throttleUnknownDevices,
    pauseUnknownDevices,
    resumeUnknownDevices,
  } = useDevices();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editNameValue, setEditNameValue] = React.useState('');
  const [isProbingAll, setIsProbingAll] = React.useState(false);

  const activeCount = devices.filter((d) => d.status === 'active').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const unknownCount = devices.filter(
    (d) => (d.isRandomizedMac || d.category === 'unknown' || d.vendor?.includes('Private')) && !d.mac.startsWith('00:00')
  ).length;
  const throttledUnknownCount = devices.filter(
    (d) => (d.isRandomizedMac || d.category === 'unknown' || d.vendor?.includes('Private')) && d.isThrottled
  ).length;

  const handleDeepProbeAll = async () => {
    setIsProbingAll(true);
    await probeAllDevices();
    setIsProbingAll(false);
  };

  // Filter devices
  const filteredDevices = React.useMemo(() => {
    return devices.filter((d) => {
      const matchesSearch =
        d.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.nickname && d.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        d.ip.includes(searchQuery) ||
        d.mac.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.vendor.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return d.status === 'active';
      if (statusFilter === 'offline') return d.status === 'offline';
      if (statusFilter === 'paused') return d.status === 'paused';
      if (statusFilter === 'blocked') return d.status === 'blocked';
      if (statusFilter === 'iot') return d.category === 'iot';
      return true;
    });
  }, [devices, searchQuery, statusFilter]);

  const handleStartRename = (dev: Device) => {
    setEditingId(dev.id);
    setEditNameValue(dev.nickname || dev.hostname);
  };

  const handleSaveRename = async (id: string) => {
    if (editNameValue.trim()) {
      await updateNickname(id, editNameValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full sm:w-72">
          <Input
            icon={<Search className="h-3.5 w-3.5" />}
            placeholder="Search by name, IP, MAC, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills + View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
          <div className="flex items-center gap-1 bg-secondary/70 p-0.5 rounded-md border border-border">
            {['all', 'active', 'offline', 'paused', 'blocked', 'iot'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded capitalize transition-colors cursor-pointer',
                  statusFilter === st
                    ? 'bg-card text-foreground font-medium shadow-subtle'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {st}
                {st === 'active' && ` (${activeCount})`}
                {st === 'offline' && ` (${offlineCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-secondary/70 p-0.5 rounded-md border border-border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportDevicesToCsv(filteredDevices)}>
                Export Table as CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDevicesToJson(filteredDevices)}>
                Export Complete Data as JSON (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Anti-Leech / Bandwidth Guard Bar */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-foreground">Anti-Leech Bandwidth Guard</h4>
              {throttledUnknownCount > 0 ? (
                <Badge variant="warning" className="text-[10px] py-0">
                  {throttledUnknownCount} Active Speed Limits
                </Badge>
              ) : (
                <Badge variant="neutral" className="text-[10px] py-0">
                  {unknownCount} Private/Randomized Devices
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-0.5">
              Prevent unauthorized streaming and bill spikes. Deep fingerprinter automatically unmasks phone brands without device access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeepProbeAll}
            disabled={isProbingAll}
            className="h-7 text-xs gap-1.5 border-border bg-card hover:bg-secondary"
          >
            <Cpu className={cn('h-3.5 w-3.5 text-primary', isProbingAll && 'animate-spin')} />
            <span>{isProbingAll ? 'Probing...' : 'Deep Fingerprint All'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => throttleUnknownDevices(512, 128)}
            disabled={unknownCount === 0}
            className="h-7 text-xs gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Throttle Unknown (512k)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={pauseUnknownDevices}
            disabled={unknownCount === 0}
            className="h-7 text-xs gap-1.5 border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>Freeze Unknown</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resumeUnknownDevices}
            className="h-7 text-xs gap-1.5 text-foreground-secondary hover:text-foreground"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Unfreeze</span>
          </Button>
        </div>
      </div>

      {/* Device Count Summary & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-foreground-secondary px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Showing <strong className="text-foreground font-medium">{filteredDevices.length}</strong> devices
          </span>
          <span className="text-border">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            {activeCount} Live Reachable
          </span>
          <span className="text-border">|</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
            {offlineCount} Offline / Disconnected
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={scanNetwork}
          disabled={isScanning}
          className="h-8 gap-1.5 text-xs border-border bg-card hover:bg-secondary/60 self-start sm:self-auto"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isScanning && 'animate-spin text-primary')} />
          {isScanning ? 'Probing Reachability...' : 'Scan & Probe Network'}
        </Button>
      </div>

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-6 w-6 text-foreground-muted mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No devices found</h3>
          <p className="text-xs text-foreground-secondary mt-1">
            Try adjusting your search query or filter settings.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Clear filters
          </Button>
        </Card>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filteredDevices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => {
            const isPaused = dev.status === 'paused';
            const isBlocked = dev.status === 'blocked';
            const isOffline = dev.status === 'offline';
            const isEditing = editingId === dev.id;

            return (
              <Card
                key={dev.id}
                onClick={() => onSelectDevice(dev.id)}
                className={cn(
                  'p-4 transition-all flex flex-col justify-between hover:border-primary/50 hover:shadow-subtle cursor-pointer select-none',
                  isPaused && 'border-rose-500/30 bg-rose-500/[0.02]',
                  isBlocked && 'border-red-500/40 opacity-75',
                  isOffline && 'border-border/60 bg-secondary/15 opacity-70 hover:opacity-100 hover:border-border'
                )}
              >
                <div>
                  {/* Card Header: Icon, Names, Status Pill, Options Dropdown */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <DeviceIcon category={dev.category} />
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="h-6 text-xs px-1.5 py-0.5 rounded border border-primary bg-background text-foreground w-full"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(dev.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveRename(dev.id)}
                              className="p-1 text-emerald-600 hover:bg-secondary rounded"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-foreground-muted hover:bg-secondary rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group">
                            <h4
                              onClick={() => onSelectDevice(dev.id)}
                              className="text-xs font-semibold text-foreground truncate cursor-pointer hover:underline"
                            >
                              {dev.nickname || dev.hostname}
                            </h4>
                            <button
                              onClick={() => handleStartRename(dev)}
                              className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-foreground transition-opacity"
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-foreground-secondary truncate mt-0.5">
                          {dev.vendor} • {dev.category}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {dev.fingerprint?.os ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                              {dev.fingerprint.os}
                            </span>
                          ) : dev.isRandomizedMac ? (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground-muted border border-border">
                              Private MAC
                            </span>
                          ) : null}

                          {dev.isThrottled && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30">
                              🛡️ 512k Cap
                            </span>
                          )}

                          {dev.fingerprint?.trafficProfile?.includes('Streaming') && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium border border-rose-500/30">
                              ⚠️ Video Stream
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isPaused ? (
                        <Badge variant="paused">Paused</Badge>
                      ) : isBlocked ? (
                        <Badge variant="blocked">Banned</Badge>
                      ) : isOffline ? (
                        <Badge variant="offline" dot>Offline</Badge>
                      ) : (
                        <Badge variant="online" dot>Active</Badge>
                      )}

                      {/* Options Menu */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onOpenFullDetails && (
                              <DropdownMenuItem onClick={() => onOpenFullDetails(dev.id)}>
                                <ExternalLink className="h-3 w-3 mr-2 text-primary" /> Full Details Page
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onSelectDevice(dev.id)}>
                              Quick Inspector (Sidebar)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => probeDevice(dev.id)}>
                              <Cpu className="h-3 w-3 mr-2 text-primary" /> Run Forensics Probe
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartRename(dev)}>
                              Rename Device
                            </DropdownMenuItem>
                            {!isOffline && (
                              <DropdownMenuItem onClick={() => onOpenThrottleModal(dev)}>
                                <Sliders className="h-3 w-3 mr-2" /> Speed Limit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              destructive
                              onClick={() => onOpenKickModal(dev)}
                            >
                              <UserX className="h-3 w-3 mr-2" /> Kick Off Wi-Fi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              destructive
                              onClick={() => blockDevice(dev.id, 'Blocked from device card')}
                            >
                              <Ban className="h-3 w-3 mr-2" /> Ban MAC Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Network Identity Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/60 text-[11px]">
                    <div>
                      <span className="text-foreground-muted block text-[10px]">IP Address</span>
                      <span className="font-mono text-foreground font-medium">{dev.ip}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted block text-[10px]">Signal & Band</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isOffline ? (
                          <span className="text-[10px] text-foreground-muted">Offline</span>
                        ) : (
                          <>
                            <RssiIndicator dbm={dev.signalDbm} />
                            <span className="text-[10px] text-foreground-muted">({dev.band})</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-foreground-muted block text-[10px]">Estimated Distance</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isOffline ? (
                          <span className="text-foreground-muted text-[11px]">—</span>
                        ) : (
                          <>
                            <span className="font-mono text-foreground font-medium text-xs">
                              {dev.estimatedDistanceMeters != null ? `~${dev.estimatedDistanceMeters}m` : 'Local'}
                            </span>
                            {dev.latencyMs != null && (
                              <span className="text-[10px] text-foreground-muted">
                                ({dev.latencyMs}ms)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-foreground-muted block text-[10px]">Today's Usage</span>
                      <span className="text-foreground font-medium">{formatBytes(dev.todayBytesTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Live Speed + Pause Action Button */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                  {isOffline ? (
                    <div className="text-xs text-foreground-muted">
                      <span className="font-mono text-slate-400">0 B/s</span>
                      <span className="text-[10px] ml-1.5 text-foreground-muted">
                        • {dev.lastSeenAt ? `Seen ${new Date(dev.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Disconnected'}
                      </span>
                    </div>
                  ) : (
                    <div className="font-mono text-xs tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatSpeed(dev.currentDownloadBps)}
                      </span>
                      <span className="text-foreground-muted text-[10px] ml-1.5">
                        {formatSpeed(dev.currentUploadBps)} ↑
                      </span>
                    </div>
                  )}

                  <Button
                    variant={isPaused ? 'subtle' : isOffline ? 'ghost' : 'secondary'}
                    size="sm"
                    className={cn('h-7 text-xs gap-1.5', isOffline && 'text-foreground-muted opacity-60')}
                    disabled={isOffline}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPaused) {
                        resumeDevice(dev.id);
                      } else {
                        pauseDevice(dev.id);
                      }
                    }}
                  >
                    {isPaused ? (
                      <Play className="h-3 w-3 fill-current text-primary" />
                    ) : isOffline ? (
                      <WifiOff className="h-3 w-3 text-foreground-muted" />
                    ) : (
                      <Pause className="h-3 w-3" />
                    )}
                    <span>{isPaused ? 'Resume' : isOffline ? 'Offline' : 'Pause'}</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredDevices.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-foreground-secondary uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 font-semibold">Device</th>
                  <th className="p-3 font-semibold">IP & MAC</th>
                  <th className="p-3 font-semibold">Signal & Band</th>
                  <th className="p-3 font-semibold">Distance (RTT)</th>
                  <th className="p-3 font-semibold">Current Speed</th>
                  <th className="p-3 font-semibold">Today's Data</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDevices.map((dev) => {
                  const isPaused = dev.status === 'paused';
                  const isOffline = dev.status === 'offline';
                  return (
                    <tr
                      key={dev.id}
                      className={cn(
                        'hover:bg-secondary/30 transition-colors cursor-pointer',
                        isOffline && 'opacity-65 hover:opacity-100'
                      )}
                      onClick={() => onSelectDevice(dev.id)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <DeviceIcon category={dev.category} size="sm" />
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground block truncate">
                              {dev.nickname || dev.hostname}
                            </span>
                            <span className="text-[10px] text-foreground-muted block truncate">
                              {dev.vendor} • {dev.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <span className="block text-foreground">{dev.ip}</span>
                        <span className="block text-[10px] text-foreground-muted">{dev.mac}</span>
                      </td>
                      <td className="p-3">
                        {isOffline ? (
                          <span className="text-foreground-muted text-[11px]">—</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <RssiIndicator dbm={dev.signalDbm} />
                            <span className="text-[10px] text-foreground-muted">({dev.band})</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isOffline ? (
                          <span className="text-foreground-muted text-[11px]">Offline</span>
                        ) : (
                          <div>
                            <span className="font-mono text-foreground font-medium block">
                              {dev.estimatedDistanceMeters != null ? `~${dev.estimatedDistanceMeters}m` : 'Local'}
                            </span>
                            <span className="text-[10px] text-foreground-muted block">
                              {dev.latencyMs != null ? `${dev.latencyMs}ms RTT` : ''}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono tabular-nums">
                        {isOffline ? (
                          <span className="text-foreground-muted">0 B/s</span>
                        ) : (
                          <>
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {formatSpeed(dev.currentDownloadBps)}
                            </div>
                            <div className="text-[10px] text-foreground-muted">
                              {formatSpeed(dev.currentUploadBps)} ↑
                            </div>
                          </>
                        )}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {formatBytes(dev.todayBytesTotal)}
                      </td>
                      <td className="p-3">
                        {isPaused ? (
                          <Badge variant="paused">Paused</Badge>
                        ) : dev.status === 'blocked' ? (
                          <Badge variant="blocked">Banned</Badge>
                        ) : isOffline ? (
                          <Badge variant="offline" dot>Offline</Badge>
                        ) : (
                          <Badge variant="online" dot>Active</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={isPaused ? 'subtle' : isOffline ? 'ghost' : 'secondary'}
                            size="icon-sm"
                            disabled={isOffline}
                            onClick={() => {
                              if (isPaused) resumeDevice(dev.id);
                              else pauseDevice(dev.id);
                            }}
                          >
                            {isPaused ? (
                              <Play className="h-3 w-3 fill-current text-primary" />
                            ) : isOffline ? (
                              <WifiOff className="h-3 w-3 text-foreground-muted" />
                            ) : (
                              <Pause className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
