import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { DomainEvent, DomainCategory } from '../../types/traffic';
import { useToast } from '../ui/Toast';
import { useWebSocket } from '../../context/WebSocketContext';
import {
  Search,
  Shield,
  Ban,
  CheckCircle,
  RefreshCw,
  Globe,
  Info,
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const isSystemNoiseDomain = (domain: string) => {
  const d = domain.toLowerCase();
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

export const ActivityView: React.FC = () => {
  const [domains, setDomains] = React.useState<DomainEvent[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const { addListener } = useWebSocket();

  const fetchDomains = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getRecentDomains(categoryFilter);
      const clean = (res?.domains || []).filter((d) => !isSystemNoiseDomain(d.domain));
      setDomains(clean);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  React.useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Real-time DNS live telemetry listener
  React.useEffect(() => {
    const unsubscribe = addListener('dns_activity', (payload: any) => {
      if (!payload?.event || isSystemNoiseDomain(payload.event.domain)) return;
      const newEvent: DomainEvent = payload.event;
      if (categoryFilter !== 'all' && newEvent.category !== categoryFilter) return;
      setDomains((prev) => {
        const filtered = prev.filter(
          (d) => d.domain.toLowerCase() !== newEvent.domain.toLowerCase() && !isSystemNoiseDomain(d.domain)
        );
        return [newEvent, ...filtered.slice(0, 99)];
      });
    });
    return unsubscribe;
  }, [addListener, categoryFilter]);

  const handleToggleBlock = async (domain: string, currentStatus: string) => {
    try {
      if (currentStatus === 'blocked') {
        await api.unblockDomain(domain);
        setDomains((prev) =>
          prev.map((d) => (d.domain === domain ? { ...d, status: 'allowed' } : d))
        );
        toast({ type: 'success', title: 'Domain Unblocked', description: `${domain} restored` });
      } else {
        await api.blockDomain(domain);
        setDomains((prev) =>
          prev.map((d) => (d.domain === domain ? { ...d, status: 'blocked' } : d))
        );
        toast({
          type: 'warning',
          title: 'Domain Blocked',
          description: `${domain} will now be intercepted network-wide`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', description: err.message });
    }
  };

  const filteredDomains = domains.filter((d) => {
    if (!searchQuery) return true;
    return (
      d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deviceNickname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'social', label: 'Social Media' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'work', label: 'Work & Tools' },
    { id: 'ad_tracker', label: 'Ads & Trackers' },
    { id: 'shopping', label: 'Shopping' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Privacy & Technical Clarity Notice */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="text-xs">
            <h4 className="font-semibold text-foreground">
              Network-Level Traffic Inspection & SafeSearch
            </h4>
            <p className="text-foreground-secondary mt-0.5 leading-relaxed">
              Wi-Fi Sentinel intercepts visited domain names, category classifications, and DNS lookups.
              Because modern internet traffic is protected by end-to-end HTTPS (TLS 1.3), search query
              safety is enforced through <strong>SafeSearch CNAME redirection</strong> and automated category
              filtering rather than invasive cleartext packet tampering.
            </p>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            icon={<Search className="h-3.5 w-3.5" />}
            placeholder="Search domain or client device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
          <div className="flex items-center gap-1 bg-secondary/70 p-0.5 rounded-md border border-border">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded transition-colors cursor-pointer whitespace-nowrap',
                  categoryFilter === c.id
                    ? 'bg-card text-foreground font-medium shadow-subtle'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchDomains}
            isLoading={isLoading}
            className="shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Domain Stream Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-foreground-secondary uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Domain / Host</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Requesting Client</th>
                <th className="p-3 font-semibold">Time</th>
                <th className="p-3 font-semibold">Gateway Action</th>
                <th className="p-3 font-semibold text-right">Block Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-foreground-muted">
                    No domain events logged matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDomains.map((item) => {
                  const isBlocked = item.status === 'blocked';
                  return (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-foreground-muted" />
                          <span className="font-mono text-xs">{item.domain}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="neutral">{item.category}</Badge>
                      </td>
                      <td className="p-3 text-foreground-secondary">{item.deviceNickname}</td>
                      <td className="p-3 text-foreground-muted tabular-nums">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        {isBlocked ? (
                          <Badge variant="blocked">DNS Sinkholed</Badge>
                        ) : (
                          <Badge variant="online">Forwarded</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant={isBlocked ? 'subtle' : 'outline'}
                          size="xs"
                          onClick={() => handleToggleBlock(item.domain, item.status)}
                          className="h-6"
                        >
                          {isBlocked ? 'Unblock' : 'Block Domain'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
