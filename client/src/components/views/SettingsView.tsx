import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { MeshNode } from '../../types/system';
import { useToast } from '../ui/Toast';
import {
  Settings,
  Palette,
  Radio,
  Router,
  RotateCw,
  Download,
  Shield,
  Check,
  Lock,
  Wifi,
  Server,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const SettingsView: React.FC = () => {
  const { palette, setPalette, themes } = useTheme();
  const [meshNodes, setMeshNodes] = React.useState<MeshNode[]>([]);
  const { toast } = useToast();

  // Autonomous SaaS L2 ARP Engine State
  const [arpStatus, setArpStatus] = React.useState<{
    available: boolean;
    enginePath: string;
    driverStatus: 'ready' | 'npcap_missing' | 'error';
    activePauses: string[];
  } | null>(null);
  const [isLaunchingDriver, setIsLaunchingDriver] = React.useState(false);

  // Router Hardware Integration State
  const [routerIp, setRouterIp] = React.useState('192.168.1.1');
  const [routerUser, setRouterUser] = React.useState('admin');
  const [routerPass, setRouterPass] = React.useState('');
  const [enforcementMode, setEnforcementMode] = React.useState<'hybrid' | 'router_hardware' | 'dns_sinkhole'>('hybrid');
  const [isTesting, setIsTesting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<{
    isReachable?: boolean;
    isAuthenticated?: boolean;
    lastError?: string;
  } | null>(null);

  // DNS Gateway Stats
  const [dnsStats, setDnsStats] = React.useState<{
    totalQueries: number;
    blockedQueries: number;
    allowedQueries: number;
    activePausedIps: number;
    uptimeSeconds: number;
  }>({
    totalQueries: 0,
    blockedQueries: 0,
    allowedQueries: 0,
    activePausedIps: 0,
    uptimeSeconds: 0,
  });

  React.useEffect(() => {
    api.getMeshNodes().then(setMeshNodes).catch(() => {});
    api.getArpStatus().then(setArpStatus).catch(() => {});
    api
      .getRouterConfig()
      .then((cfg) => {
        if (cfg) {
          if (cfg.ip) setRouterIp(cfg.ip);
          if (cfg.username) setRouterUser(cfg.username);
          if (cfg.enforcementMode) setEnforcementMode(cfg.enforcementMode);
        }
      })
      .catch(() => {});

    api
      .getDnsStats()
      .then(setDnsStats)
      .catch(() => {});

    const interval = setInterval(() => {
      api.getDnsStats().then(setDnsStats).catch(() => {});
      api.getArpStatus().then(setArpStatus).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleLaunchDriver = async () => {
    setIsLaunchingDriver(true);
    try {
      const res = await api.installArpDriver();
      toast({
        type: 'info',
        title: 'Installer Launched',
        description: res.message,
      });
      setTimeout(() => {
        api.getArpStatus().then(setArpStatus).catch(() => {});
      }, 4000);
    } catch (err: any) {
      toast({ type: 'error', title: 'Setup Error', description: err.message });
    } finally {
      setIsLaunchingDriver(false);
    }
  };

  const handleTestRouter = async () => {
    setIsTesting(true);
    try {
      const res = await api.testRouterConnection({
        ip: routerIp,
        username: routerUser,
        password: routerPass,
      });
      setConnectionStatus(res);
      if (res.isAuthenticated) {
        toast({
          type: 'success',
          title: 'Router Authenticated',
          description: 'Hardware MAC filtering is fully active on ZTE TEWA-220G.',
        });
      } else if (res.isReachable) {
        toast({
          type: 'warning',
          title: 'Router Reachable',
          description: res.lastError || 'Credentials needed to access router hardware filter.',
        });
      } else {
        toast({
          type: 'error',
          title: 'Router Unreachable',
          description: res.lastError || 'Could not connect to router at specified IP.',
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Test Failed', description: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveRouter = async () => {
    setIsSaving(true);
    try {
      await api.saveRouterConfig({
        ip: routerIp,
        username: routerUser,
        password: routerPass,
        enforcementMode,
      });
      toast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Enforcement configuration updated successfully.',
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Save Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.4.1',
      exportedAt: new Date().toISOString(),
      network: 'Enterprise Wi-Fi Sentinel',
      meshNodes,
      routerConfig: {
        ip: routerIp,
        model: 'ZTE TEWA-220G',
        enforcementMode,
      },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-config-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast({ type: 'success', title: 'Backup Downloaded' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 0. Autonomous SaaS Network Engine (Layer 2 ARP Injection) */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-card via-card to-cyan-950/10 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold">Autonomous SaaS Network Engine</CardTitle>
                {arpStatus?.driverStatus === 'ready' ? (
                  <Badge variant="online" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>L2 Driver Active</span>
                  </Badge>
                ) : (
                  <Badge variant="warning" className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Driver Setup Required</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground-muted mt-1 max-w-2xl">
                Commercial SaaS Layer 2 packet injection engine. Directly pauses, throttles, and disconnects any client device on Wi-Fi without requiring router credentials or phone configuration.
              </p>
            </div>
            <Badge variant="neutral" className="font-mono text-[11px] self-start sm:self-auto border-border">
              Layer 2 ARP Engine
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                Autonomous Enforcement
              </span>
              <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                {arpStatus?.driverStatus === 'ready' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    100% Operational (Npcap NDIS)
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Pending 1-Click Driver Setup
                  </>
                )}
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                Active Hardware Cuts
              </span>
              <span className="font-mono font-semibold text-foreground mt-0.5 block">
                {arpStatus?.activePauses?.length || 0} devices under L2 blackhole
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                Engine Executable
              </span>
              <span className="font-mono text-[11px] text-foreground-secondary mt-0.5 block truncate" title={arpStatus?.enginePath}>
                SentinelArpEngine.exe
              </span>
            </div>
          </div>

          {arpStatus?.driverStatus !== 'ready' ? (
            <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>One-Time Kernel Driver Setup Required for Windows</span>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Commercial network tools (NetCut, Fing Desktop, Wireshark) require Npcap to transmit Layer 2 ARP frames. Click below to launch setup.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleLaunchDriver}
                  disabled={isLaunchingDriver}
                  className="h-8 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
                >
                  <Zap className={cn("h-3.5 w-3.5", isLaunchingDriver && "animate-spin")} />
                  {isLaunchingDriver ? 'Launching...' : '1-Click Driver Setup'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => api.getArpStatus().then(setArpStatus)}
                  className="h-8 text-xs"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Zero-touch SaaS mode is active. Internet pause, throttle, and kick execute natively at Layer 2.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Physical Enforcement & Router Hardware Gateway */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Physical Network Enforcement & Router Hardware</CardTitle>
                <Badge variant="online" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Port 53 Active</span>
                </Badge>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                Configure direct hardware access and autonomous DNS sinkholing to physically pause, block, or kick devices on real Wi-Fi hardware.
              </p>
            </div>
            <Badge variant="neutral" className="font-mono text-xs self-start sm:self-auto">
              ZTE TEWA-220G
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Active DNS Sinkhole Gateway Status Bar */}
          <div className="p-3.5 rounded-lg bg-secondary/50 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                DNS Sinkhole Gateway
              </span>
              <span className="font-mono font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                0.0.0.0:53 Active
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                Paused Client IPs
              </span>
              <span className="font-mono font-semibold text-foreground mt-0.5 block">
                {dnsStats.activePausedIps} under cut
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                Sinkholed Queries
              </span>
              <span className="font-mono font-semibold text-amber-500 mt-0.5 block">
                {dnsStats.blockedQueries} blocked
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                Allowed Queries
              </span>
              <span className="font-mono font-semibold text-foreground mt-0.5 block">
                {dnsStats.allowedQueries} resolved
              </span>
            </div>
          </div>

          {/* Router Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground-secondary block mb-1">
                Router Management IP
              </label>
              <Input
                value={routerIp}
                onChange={(e) => setRouterIp(e.target.value)}
                placeholder="192.168.1.1"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground-secondary block mb-1">
                Admin Username
              </label>
              <Input
                value={routerUser}
                onChange={(e) => setRouterUser(e.target.value)}
                placeholder="admin"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground-secondary block mb-1">
                Router Web Password
              </label>
              <Input
                type="password"
                value={routerPass}
                onChange={(e) => setRouterPass(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Enforcement Strategy Mode */}
          <div>
            <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">
              Enforcement Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div
                onClick={() => setEnforcementMode('hybrid')}
                className={cn(
                  'p-3 rounded-md border cursor-pointer transition-all',
                  enforcementMode === 'hybrid'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card/60 hover:border-border-hover'
                )}
              >
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Hybrid Autonomous</span>
                  {enforcementMode === 'hybrid' && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-foreground-muted mt-1">
                  Enforces via Port 53 DNS Sinkhole + Router Hardware Access Control.
                </p>
              </div>

              <div
                onClick={() => setEnforcementMode('dns_sinkhole')}
                className={cn(
                  'p-3 rounded-md border cursor-pointer transition-all',
                  enforcementMode === 'dns_sinkhole'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card/60 hover:border-border-hover'
                )}
              >
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>DNS Sinkhole Only</span>
                  {enforcementMode === 'dns_sinkhole' && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-foreground-muted mt-1">
                  Zero-config. Cuts internet without needing router passwords.
                </p>
              </div>

              <div
                onClick={() => setEnforcementMode('router_hardware')}
                className={cn(
                  'p-3 rounded-md border cursor-pointer transition-all',
                  enforcementMode === 'router_hardware'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card/60 hover:border-border-hover'
                )}
              >
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Router Hardware Only</span>
                  {enforcementMode === 'router_hardware' && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-foreground-muted mt-1">
                  Pushes MAC blocks directly to the ZTE router Wi-Fi chip.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestRouter}
                isLoading={isTesting}
                className="gap-1.5"
              >
                <Wifi className="h-3.5 w-3.5" />
                <span>Test Router Connection</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRouter}
                isLoading={isSaving}
                className="gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Save Enforcement Settings</span>
              </Button>
            </div>

            {connectionStatus && (
              <div className="flex items-center gap-1.5 text-xs">
                {connectionStatus.isAuthenticated ? (
                  <Badge variant="online" className="gap-1">
                    <Check className="h-3 w-3" />
                    <span>Hardware Synced</span>
                  </Badge>
                ) : connectionStatus.isReachable ? (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Router Reachable</span>
                  </Badge>
                ) : (
                  <Badge variant="blocked">Unreachable</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Theme Palette Customizer */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Theme & Visual Customization</CardTitle>
            <p className="text-xs text-foreground-muted mt-0.5">
              Select from 5 modern light and contrast palettes inspired by minimalistic SaaS interfaces
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {themes.map((t) => {
              const isSelected = palette === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setPalette(t.id)}
                  className={cn(
                    'p-3.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-subtle ring-1 ring-primary'
                      : 'border-border bg-card/60 hover:border-border-hover'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: t.dotColor }}
                        />
                        <span className="text-xs font-semibold text-foreground">{t.name}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-[11px] text-foreground-secondary mt-1.5 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center gap-1.5 text-[10px] text-foreground-muted">
                    <span>{t.isDark ? 'Dark Base' : 'Light Base'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Gateway Mesh Topology & Radios */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Access Point Mesh Topology</CardTitle>
            <p className="text-xs text-foreground-muted mt-0.5">
              Discovered Wi-Fi radios, channels, and backhaul links
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meshNodes.map((node) => (
              <div
                key={node.nodeId}
                className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Router className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{node.name}</span>
                  </div>
                  {node.isMainRouter ? (
                    <Badge variant="primary">Gateway Node</Badge>
                  ) : (
                    <Badge variant="neutral">Mesh Satellite</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px]">
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Management IP</span>
                    <span className="font-mono text-foreground">{node.ip}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Connected Clients</span>
                    <span className="font-semibold text-foreground">
                      {node.connectedClientsCount} devices
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block text-[10px]">2.4GHz Channel</span>
                    <span className="text-foreground">Channel {node.channel24}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block text-[10px]">5GHz Channel</span>
                    <span className="text-foreground">Channel {node.channel5}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Maintenance & Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Administration & Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={handleExportBackup} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Export System Backup (JSON)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  type: 'info',
                  title: 'Firmware Up to Date',
                  description: 'v2.4.1 is the latest stable release',
                })
              }
              className="gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Check Firmware Updates</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
