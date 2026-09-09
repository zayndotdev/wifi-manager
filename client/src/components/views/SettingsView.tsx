import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const SettingsView: React.FC = () => {
  const { palette, setPalette, themes } = useTheme();
  const [meshNodes, setMeshNodes] = React.useState<MeshNode[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    api.getMeshNodes().then(setMeshNodes).catch(() => {});
  }, []);

  const handleExportBackup = () => {
    const backupData = {
      version: '2.4.1',
      exportedAt: new Date().toISOString(),
      network: 'Enterprise Wi-Fi Sentinel',
      meshNodes,
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
      {/* 1. Theme Palette Customizer */}
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

      {/* 2. Gateway Mesh Topology & Radios */}
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

      {/* 3. Maintenance & Backup */}
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
              onClick={() => toast({ type: 'info', title: 'Firmware Up to Date', description: 'v2.4.1 is the latest stable release' })}
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
