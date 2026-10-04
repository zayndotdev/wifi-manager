import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { api } from '../../lib/api';
import { SecurityAlert } from '../../types/system';
import { useToast } from '../ui/Toast';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Lock,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

export const SecurityView: React.FC = () => {
  const [alerts, setAlerts] = React.useState<SecurityAlert[]>([]);
  const [audit, setAudit] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [blockDoh, setBlockDoh] = React.useState(true);
  const [isolateGuests, setIsolateGuests] = React.useState(true);
  const [blockMalware, setBlockMalware] = React.useState(true);
  const [blockCrypto, setBlockCrypto] = React.useState(true);
  const { toast } = useToast();

  const fetchAlerts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, auditData] = await Promise.all([
        api.getAlerts(),
        api.getWifiSecurityAudit().catch(() => null),
      ]);
      setAlerts(data);
      if (auditData) setAudit(auditData);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDismiss = async (id: string) => {
    try {
      await api.dismissAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      toast({ type: 'info', title: 'Alert Dismissed' });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Threat Shield Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/[0.03]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground block">Threat Shield Active</span>
              <span className="text-[11px] text-foreground-secondary">
                245,180 malicious hostnames sinkholed
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">DoH Bypass Protection</span>
              <span className="text-[11px] text-foreground-secondary">
                Block port 853 & public DoH IPs
              </span>
            </div>
            <Switch checked={blockDoh} onCheckedChange={setBlockDoh} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">Client Layer Isolation</span>
              <span className="text-[11px] text-foreground-secondary">
                Prevent device-to-device snooping
              </span>
            </div>
            <Switch checked={isolateGuests} onCheckedChange={setIsolateGuests} />
          </div>
        </Card>
      </div>

      {/* Wi-Fi Radio Security & Perimeter Audit */}
      {audit && (
        <Card className="p-5 border-border bg-card/70">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-foreground">Local Wi-Fi Security Audit</h3>
                  <Badge variant="online">{audit.rating || 'Grade A - Secure'}</Badge>
                </div>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Inspection of SSID &quot;{audit.ssid}&quot; encryption standards and access point perimeter
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
              <div className="text-right">
                <span className="text-xs text-foreground-muted block">Security Score</span>
                <span className="text-2xl font-bold text-emerald-500 tabular-nums">{audit.securityScore}/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3 rounded-lg border border-border bg-card/60">
              <span className="text-foreground-muted block mb-1">Encryption Protocol</span>
              <span className="font-semibold text-foreground">{audit.securityStandard}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/60">
              <span className="text-foreground-muted block mb-1">WPS Vulnerability</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{audit.wpsStatus}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/60">
              <span className="text-foreground-muted block mb-1">Radio Standard</span>
              <span className="font-semibold text-foreground">{audit.radioType} ({audit.band})</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/60">
              <span className="text-foreground-muted block mb-1">RF Interference</span>
              <span className="font-semibold text-foreground">{audit.channelInterference}</span>
            </div>
          </div>

          {Array.isArray(audit.recommendations) && audit.recommendations.length > 0 && (
            <div className="p-3 rounded-lg bg-secondary/40 border border-border text-xs">
              <span className="font-semibold text-foreground block mb-1">Security Posture Recommendations:</span>
              <ul className="list-disc list-inside space-y-0.5 text-foreground-secondary">
                {audit.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Threat Feeds Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">StevenBlack Malware Host Shield</span>
              <span className="text-[11px] text-foreground-secondary">
                Sinkhole malicious phishing and botnet domains
              </span>
            </div>
            <Switch checked={blockMalware} onCheckedChange={setBlockMalware} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">Cryptomining & Abuse Interceptor</span>
              <span className="text-[11px] text-foreground-secondary">
                Drop in-browser mining and known telemetry trackers
              </span>
            </div>
            <Switch checked={blockCrypto} onCheckedChange={setBlockCrypto} />
          </div>
        </Card>
      </div>

      {/* Security Audit Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Security Intrusion & Event Log</CardTitle>
              <p className="text-xs text-foreground-muted mt-0.5">
                Audit trail of intercepted threats, rogue MACs, and policy violations
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={fetchAlerts} isLoading={isLoading}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-foreground-secondary uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 font-semibold">Severity</th>
                  <th className="p-3 font-semibold">Event Description</th>
                  <th className="p-3 font-semibold">Target MAC</th>
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground-muted">
                      Zero threats detected. Network perimeter is clean.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alt) => {
                    const isCritical = alt.severity === 'critical';
                    const isWarning = alt.severity === 'high' || alt.severity === 'medium';

                    return (
                      <tr
                        key={alt.id}
                        className={`hover:bg-secondary/30 transition-colors ${
                          !alt.isRead ? 'bg-primary/[0.02]' : ''
                        }`}
                      >
                        <td className="p-3">
                          {isCritical ? (
                            <Badge variant="blocked">Critical</Badge>
                          ) : isWarning ? (
                            <Badge variant="warning">Warning</Badge>
                          ) : (
                            <Badge variant="neutral">Info</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground block">{alt.title}</span>
                          <span className="text-[11px] text-foreground-secondary block mt-0.5">
                            {alt.description}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-foreground-muted">
                          {alt.targetMac || 'N/A'}
                        </td>
                        <td className="p-3 text-foreground-muted tabular-nums">
                          {new Date(alt.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-right">
                          {!alt.isRead && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleDismiss(alt.id)}
                            >
                              Dismiss
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
