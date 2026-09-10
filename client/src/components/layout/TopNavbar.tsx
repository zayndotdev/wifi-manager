import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, ArrowDown, ArrowUp, Pause, Play, Bell, Shield } from 'lucide-react';
import { useWebSocket } from '../../context/WebSocketContext';
import { useDevices } from '../../context/DeviceContext';
import { formatSpeed } from '../../lib/formatters';
import { ThemePicker } from '../common/ThemePicker';
import { Button } from '../ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/Popover';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import { SecurityAlert } from '../../types/system';

export const TopNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, latestTick } = useWebSocket();
  const { devices, pauseAllDevices, resumeAllDevices } = useDevices();
  const [alerts, setAlerts] = React.useState<SecurityAlert[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = React.useState(false);

  const activeCount = devices.filter((d) => d.status === 'active').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const pausedCount = devices.filter((d) => d.status === 'paused').length;
  const totalCount = devices.length;
  const isAnyPaused = pausedCount > 0;

  // Poll alerts
  React.useEffect(() => {
    api.getAlerts().then(setAlerts).catch(() => {});
    const interval = setInterval(() => {
      api.getAlerts().then(setAlerts).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  const handleDismissAlert = async (id: string) => {
    try {
      await api.dismissAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand + Network Status */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
          >
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-subtle">
              <Wifi className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                Wi-Fi Sentinel
              </span>
              <span className="text-[10px] text-foreground-muted -mt-0.5">Enterprise Gateway</span>
            </div>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Live Status Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/60 text-xs font-medium cursor-default">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse-subtle' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[11px] text-foreground-secondary">
                  {isConnected ? 'Gateway Active' : 'Connecting...'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>{isConnected ? 'WebSocket link synchronized (1s telemetry)' : 'Reconnecting to local router daemon'}</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Center: Live WAN Speed Ticker */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-md border border-border/80 bg-background/80 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <ArrowDown className="h-3 w-3" />
            <span>{formatSpeed(latestTick?.wanDownloadBps ?? 0)}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1 text-primary">
            <ArrowUp className="h-3 w-3" />
            <span>{formatSpeed(latestTick?.wanUploadBps ?? 0)}</span>
          </div>
        </div>

        {/* Right: Actions, Toggles, Alert Bell, Theme Picker */}
        <div className="flex items-center gap-2">
          {/* Active vs Offline Count Pill */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={() => navigate('/devices')}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary-hover border border-border text-xs font-medium text-foreground cursor-pointer transition-colors select-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/devices')}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{activeCount} Active</span>
                </div>
                {offlineCount > 0 && (
                  <>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-1 text-foreground-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{offlineCount} Offline</span>
                    </div>
                  </>
                )}
                <span className="text-foreground-muted text-[11px]">({totalCount} Total)</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>{activeCount} live reachable devices, {offlineCount} offline/disconnected from {totalCount} discovered</span>
            </TooltipContent>
          </Tooltip>

          {/* Quick Pause All / Resume Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAnyPaused ? 'destructive' : 'secondary'}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={isAnyPaused ? resumeAllDevices : pauseAllDevices}
              >
                {isAnyPaused ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
                <span className="hidden lg:inline">{isAnyPaused ? 'Resume Network' : 'Pause All'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{isAnyPaused ? 'Restore internet to paused devices' : 'Freeze WAN internet on all non-exempt devices'}</span>
            </TooltipContent>
          </Tooltip>

          {/* Security Alert Popover */}
          <Popover open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-foreground-secondary hover:text-foreground">
                <Bell className="h-4 w-4" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-popover">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Security & Activity Feed</span>
                </div>
                {unreadAlerts.length > 0 && (
                  <Badge variant="primary">{unreadAlerts.length} new</Badge>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-foreground-muted">
                    No active alerts. Network secure.
                  </div>
                ) : (
                  alerts.slice(0, 6).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 text-xs transition-colors hover:bg-secondary/40 ${
                        !alert.isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">{alert.title}</span>
                        {!alert.isRead && (
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            className="text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground-secondary mt-0.5 leading-relaxed">
                        {alert.description}
                      </p>
                      <span className="text-[10px] text-foreground-muted block mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-border bg-secondary/30 text-center">
                <button
                  onClick={() => {
                    setIsAlertsOpen(false);
                    navigate('/security');
                  }}
                  className="text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  View All Security Logs →
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme Palette Switcher */}
          <ThemePicker />
        </div>
      </div>
    </header>
  );
};
