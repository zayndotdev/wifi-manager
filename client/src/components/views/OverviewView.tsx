import * as React from 'react';
import { StatCard } from '../ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DeviceIcon } from '../ui/DeviceIcon';
import { RssiIndicator } from '../ui/RssiIndicator';
import { useDevices } from '../../context/DeviceContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { formatBytes, formatSpeed } from '../../lib/formatters';
import { api } from '../../lib/api';
import { DomainEvent } from '../../types/traffic';
import {
  Wifi,
  ArrowDown,
  ArrowUp,
  HardDrive,
  ShieldCheck,
  Pause,
  Play,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface OverviewViewProps {
  onSelectDevice: (deviceId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onSelectDevice,
  onNavigateTab,
}) => {
  const { devices, pauseDevice, resumeDevice, isScanning, scanNetwork } = useDevices();
  const { latestTick, addListener } = useWebSocket();
  const [recentDomains, setRecentDomains] = React.useState<DomainEvent[]>([]);

  // Fetch recent domains
  React.useEffect(() => {
    const isNoise = (dom: string) => {
      const d = dom.toLowerCase();
      return (
        d.includes('mongodb.net') ||
        d.includes('mongodb.com') ||
        d.includes('compute.amazonaws.com') ||
        d.includes('prod.do.dsp.mp.microsoft.com') ||
        d.includes('trafficmanager.net') ||
        d.includes('events.data.microsoft.com') ||
        d.includes('edgekey.net') ||
        d.includes('edgesuite.net') ||
        d.includes('delivery.mp.microsoft.com')
      );
    };

    api
      .getRecentDomains('all')
      .then((res) => {
        const clean = (res?.domains || []).filter((d) => !isNoise(d.domain));
        setRecentDomains(clean.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  // Real-time DNS live telemetry listener
  React.useEffect(() => {
    const isNoise = (dom: string) => {
      const d = dom.toLowerCase();
      return (
        d.includes('mongodb.net') ||
        d.includes('mongodb.com') ||
        d.includes('compute.amazonaws.com') ||
        d.includes('prod.do.dsp.mp.microsoft.com') ||
        d.includes('trafficmanager.net') ||
        d.includes('events.data.microsoft.com') ||
        d.includes('edgekey.net') ||
        d.includes('edgesuite.net') ||
        d.includes('delivery.mp.microsoft.com')
      );
    };

    const unsubscribe = addListener('dns_activity', (payload: any) => {
      if (!payload?.event || isNoise(payload.event.domain)) return;
      const newEvent: DomainEvent = payload.event;
      setRecentDomains((prev) => {
        const filtered = prev.filter(
          (d) => d.domain.toLowerCase() !== newEvent.domain.toLowerCase() && !isNoise(d.domain)
        );
        return [newEvent, ...filtered.slice(0, 4)];
      });
    });
    return unsubscribe;
  }, [addListener]);

  const activeDevices = devices.filter((d) => d.status === 'active');
  const pausedDevices = devices.filter((d) => d.status === 'paused');
  const totalTodayBytes = devices.reduce((sum, d) => sum + (d.todayBytesTotal || 0), 0);

  // Top 4 devices sorted by data consumption
  const topConsumers = [...devices]
    .sort((a, b) => b.todayBytesTotal - a.todayBytesTotal)
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Subnet Banner & Scan Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-card/60">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Wifi className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Active Wi-Fi Subnet</span>
              <Badge variant="online" className="text-[10px] px-1.5 py-0">
                Real Hardware Interface
              </Badge>
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Live physical device discovery & telemetry via ARP and hardware counters
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={scanNetwork}
          disabled={isScanning}
          className="h-8 gap-1.5 text-xs border-border bg-card hover:bg-secondary/60 w-full sm:w-auto"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isScanning && 'animate-spin text-primary')} />
          {isScanning ? 'Scanning Wi-Fi...' : 'Scan Subnet'}
        </Button>
      </div>

      {/* 4 Primary Metric StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Connected Devices"
          value={activeDevices.length}
          subtext={`${pausedDevices.length} paused • ${devices.length} real devices discovered`}
          icon={<Wifi className="h-4 w-4" />}
          trend={{ value: `${devices.filter(d => d.isNew).length} new`, isPositive: true }}
        />
        <StatCard
          label="WAN Ingress (Download)"
          value={formatSpeed(latestTick?.wanDownloadBps ?? 0)}
          subtext="Physical Wi-Fi hardware Rx rate"
          icon={<ArrowDown className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="WAN Egress (Upload)"
          value={formatSpeed(latestTick?.wanUploadBps ?? 0)}
          subtext="Physical Wi-Fi hardware Tx rate"
          icon={<ArrowUp className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Total Data Consumed Today"
          value={formatBytes(totalTodayBytes)}
          subtext="Live network byte counter"
          icon={<HardDrive className="h-4 w-4" />}
        />
      </div>

      {/* Two Column Section: Live Top Consumers & Real-Time Visited Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Top Bandwidth Consumers */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top Bandwidth Consumers</CardTitle>
                <p className="text-xs text-foreground-muted mt-0.5">Live upload/download rate and data usage today</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigateTab('devices')}
              >
                View all devices →
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {topConsumers.map((dev) => {
                const isPaused = dev.status === 'paused';
                const percentOfMax = Math.min(
                  100,
                  Math.round((dev.todayBytesTotal / (topConsumers[0]?.todayBytesTotal || 1)) * 100)
                );

                return (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60 hover:bg-secondary/40 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => onSelectDevice(dev.id)}
                    >
                      <DeviceIcon category={dev.category} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {dev.nickname || dev.hostname}
                          </span>
                          {dev.isThrottled && <Badge variant="throttled">Throttled</Badge>}
                          {isPaused && <Badge variant="paused">Paused</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-foreground-muted mt-0.5">
                          <span>{dev.ip}</span>
                          <span>•</span>
                          <RssiIndicator dbm={dev.signalDbm} showDbmText={false} />
                          <span>•</span>
                          <span>{formatBytes(dev.todayBytesTotal)} used today</span>
                        </div>
                        {/* Mini visual usage bar */}
                        <div className="w-full bg-secondary h-1 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-300"
                            style={{ width: `${percentOfMax}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right font-mono text-xs tabular-nums">
                        <div className="text-emerald-600 dark:text-emerald-400">
                          {formatSpeed(dev.currentDownloadBps)}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          {formatSpeed(dev.currentUploadBps)} ↑
                        </div>
                      </div>

                      <Button
                        variant={isPaused ? 'subtle' : 'secondary'}
                        size="icon-sm"
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
                        <span className="sr-only">Toggle pause</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: Live Visited Domains Snippet */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Visited Domains</CardTitle>
                <p className="text-xs text-foreground-muted mt-0.5">Live DNS query stream from all devices</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigateTab('activity')}
              >
                Full stream →
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recentDomains.length === 0 ? (
                <div className="text-center py-6 text-xs text-foreground-muted">
                  Listening for network DNS queries...
                </div>
              ) : (
                recentDomains.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-md border border-border/70 bg-card/40 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-medium text-foreground truncate">{item.domain}</span>
                        <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                          {item.category}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-foreground-muted block truncate mt-0.5">
                        by {item.deviceNickname}
                      </span>
                    </div>

                    <div className="text-right ml-2 shrink-0">
                      {item.status === 'blocked' ? (
                        <Badge variant="blocked">Blocked</Badge>
                      ) : (
                        <span className="text-[10px] text-foreground-muted">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Security Status Card */}
          <Card className="p-4 bg-card/60">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Threat Shield & SafeSearch Active</h4>
                <p className="text-[11px] text-foreground-secondary mt-0.5">
                  Blocking malicious domains, DoH bypasses, and enforcing family DNS filters.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
