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
} from 'lucide-react';
import { cn } from '../../lib/utils';

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
  const { devices, pauseDevice, resumeDevice, blockDevice, updateNickname, isScanning, scanNetwork } = useDevices();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editNameValue, setEditNameValue] = React.useState('');

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
            {['all', 'active', 'paused', 'blocked', 'iot'].map((st) => (
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
        </div>
      </div>

      {/* Device Count Summary & Action */}
      <div className="flex items-center justify-between text-xs text-foreground-secondary px-1">
        <span>Showing <strong className="text-foreground font-medium">{filteredDevices.length}</strong> real network devices</span>
        <Button
          variant="outline"
          size="sm"
          onClick={scanNetwork}
          disabled={isScanning}
          className="h-8 gap-1.5 text-xs border-border bg-card hover:bg-secondary/60"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isScanning && 'animate-spin text-primary')} />
          {isScanning ? 'Scanning Wi-Fi...' : 'Scan Network'}
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
            const isEditing = editingId === dev.id;

            return (
              <Card
                key={dev.id}
                onClick={() => onSelectDevice(dev.id)}
                className={cn(
                  'p-4 transition-all flex flex-col justify-between hover:border-primary/50 hover:shadow-subtle cursor-pointer select-none',
                  isPaused && 'border-rose-500/30 bg-rose-500/[0.02]',
                  isBlocked && 'border-red-500/40 opacity-75'
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
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isPaused ? (
                        <Badge variant="paused">Paused</Badge>
                      ) : isBlocked ? (
                        <Badge variant="blocked">Banned</Badge>
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
                            <DropdownMenuItem onClick={() => handleStartRename(dev)}>
                              Rename Device
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onOpenThrottleModal(dev)}>
                              <Sliders className="h-3 w-3 mr-2" /> Speed Limit
                            </DropdownMenuItem>
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
                        <RssiIndicator dbm={dev.signalDbm} />
                        <span className="text-[10px] text-foreground-muted">({dev.band})</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-foreground-muted block text-[10px]">Node AP</span>
                      <span className="text-foreground truncate block">{dev.meshNodeName}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted block text-[10px]">Today's Usage</span>
                      <span className="text-foreground font-medium">{formatBytes(dev.todayBytesTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Live Speed + Pause Action Button */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                  <div className="font-mono text-xs tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatSpeed(dev.currentDownloadBps)}
                    </span>
                    <span className="text-foreground-muted text-[10px] ml-1.5">
                      {formatSpeed(dev.currentUploadBps)} ↑
                    </span>
                  </div>

                  <Button
                    variant={isPaused ? 'subtle' : 'secondary'}
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPaused) {
                        resumeDevice(dev.id);
                      } else {
                        pauseDevice(dev.id);
                      }
                    }}
                  >
                    {isPaused ? <Play className="h-3 w-3 fill-current text-primary" /> : <Pause className="h-3 w-3" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
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
                  <th className="p-3 font-semibold">Signal</th>
                  <th className="p-3 font-semibold">AP Node</th>
                  <th className="p-3 font-semibold">Current Speed</th>
                  <th className="p-3 font-semibold">Today's Data</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDevices.map((dev) => {
                  const isPaused = dev.status === 'paused';
                  return (
                    <tr
                      key={dev.id}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
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
                              {dev.vendor}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <span className="block text-foreground">{dev.ip}</span>
                        <span className="block text-[10px] text-foreground-muted">{dev.mac}</span>
                      </td>
                      <td className="p-3">
                        <RssiIndicator dbm={dev.signalDbm} />
                      </td>
                      <td className="p-3 text-foreground-secondary truncate max-w-[120px]">
                        {dev.meshNodeName}
                      </td>
                      <td className="p-3 font-mono tabular-nums">
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatSpeed(dev.currentDownloadBps)}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          {formatSpeed(dev.currentUploadBps)} ↑
                        </div>
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {formatBytes(dev.todayBytesTotal)}
                      </td>
                      <td className="p-3">
                        {isPaused ? (
                          <Badge variant="paused">Paused</Badge>
                        ) : dev.status === 'blocked' ? (
                          <Badge variant="blocked">Banned</Badge>
                        ) : (
                          <Badge variant="online" dot>Active</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={isPaused ? 'subtle' : 'secondary'}
                            size="icon-sm"
                            onClick={() => {
                              if (isPaused) resumeDevice(dev.id);
                              else pauseDevice(dev.id);
                            }}
                          >
                            {isPaused ? <Play className="h-3 w-3 fill-current text-primary" /> : <Pause className="h-3 w-3" />}
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
