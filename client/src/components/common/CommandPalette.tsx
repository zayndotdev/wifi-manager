import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDevices } from '../../context/DeviceContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../ui/Toast';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import {
  Search,
  Laptop,
  Smartphone,
  Tv,
  Activity,
  Sliders,
  Radio,
  Shield,
  Download,
  Moon,
  Sun,
  X,
  Gauge,
  Zap,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpeedtest?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenSpeedtest }) => {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const navigate = useNavigate();
  const { devices, pauseAllDevices, resumeAllDevices, scanNetwork, setSelectedDevice } = useDevices();
  const { isDark, setPalette } = useTheme();
  const toggleDarkMode = () => setPalette(isDark ? 'clean-slate' : 'onyx-contrast');
  const { toast } = useToast();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredDevices = React.useMemo(() => {
    if (!query.trim()) return devices.slice(0, 5);
    const q = query.toLowerCase();
    return devices.filter(
      (d) =>
        (d.nickname && d.nickname.toLowerCase().includes(q)) ||
        d.hostname.toLowerCase().includes(q) ||
        d.ip.includes(q) ||
        d.mac.toLowerCase().includes(q) ||
        d.vendor.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [devices, query]);

  const staticActions = React.useMemo(() => [
    {
      id: 'nav_overview',
      title: 'Go to Overview',
      subtitle: 'Live WAN bandwidth and network health',
      icon: Activity,
      category: 'Navigation',
      action: () => { navigate('/'); onClose(); },
    },
    {
      id: 'nav_devices',
      title: 'Go to Devices',
      subtitle: `View all ${devices.length} connected hosts and controls`,
      icon: Laptop,
      category: 'Navigation',
      action: () => { navigate('/devices'); onClose(); },
    },
    {
      id: 'nav_activity',
      title: 'Go to Activity & DNS',
      subtitle: 'DNS query logs and browsing telemetry',
      icon: Radio,
      category: 'Navigation',
      action: () => { navigate('/activity'); onClose(); },
    },
    {
      id: 'nav_rules',
      title: 'Go to Rules & Schedules',
      subtitle: 'Manage bedtime curfews and filters',
      icon: Sliders,
      category: 'Navigation',
      action: () => { navigate('/rules'); onClose(); },
    },
    {
      id: 'nav_security',
      title: 'Go to Security & Threats',
      subtitle: 'View security alerts and threat feeds',
      icon: Shield,
      category: 'Navigation',
      action: () => { navigate('/security'); onClose(); },
    },
    {
      id: 'action_rescan',
      title: 'Trigger Subnet Rescan',
      subtitle: 'Immediate ARP sweep across active subnet',
      icon: Zap,
      category: 'Actions',
      action: async () => {
        onClose();
        toast({ title: 'Scanning Network', description: 'Broadcasting fast subnet probes...', type: 'info' });
        await scanNetwork();
        toast({ title: 'Scan Complete', description: 'Network inventory refreshed.', type: 'success' });
      },
    },
    {
      id: 'action_speedtest',
      title: 'Run Diagnostic Speedtest',
      subtitle: 'Measure hardware latency and throughput',
      icon: Gauge,
      category: 'Actions',
      action: () => {
        onClose();
        if (onOpenSpeedtest) onOpenSpeedtest();
        else navigate('/settings');
      },
    },
    {
      id: 'action_pause_all',
      title: 'Pause All Devices',
      subtitle: 'Emergency Family Dinner mode (freeze WAN access)',
      icon: PauseCircle,
      category: 'Actions',
      action: async () => {
        onClose();
        await pauseAllDevices();
        toast({ title: 'Network Paused', description: 'Internet paused on non-essential devices.', type: 'warning' });
      },
    },
    {
      id: 'action_resume_all',
      title: 'Resume All Devices',
      subtitle: 'Restore full WAN internet access',
      icon: PlayCircle,
      category: 'Actions',
      action: async () => {
        onClose();
        await resumeAllDevices();
        toast({ title: 'Network Restored', description: 'All paused devices re-enabled.', type: 'success' });
      },
    },
    {
      id: 'action_theme',
      title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle theme display mode',
      icon: isDark ? Sun : Moon,
      category: 'Preferences',
      action: () => { toggleDarkMode(); onClose(); },
    },
    {
      id: 'action_backup',
      title: 'Download Configuration Backup',
      subtitle: 'Export devices, schedules, and blacklists to JSON',
      icon: Download,
      category: 'Preferences',
      action: async () => {
        onClose();
        try {
          const bundle = await api.exportBackup();
          const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `wifi-sentinel-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast({ title: 'Backup Downloaded', description: 'Configuration exported successfully.', type: 'success' });
        } catch (err: any) {
          toast({ title: 'Export Failed', description: err.message, type: 'error' });
        }
      },
    },
  ], [devices.length, isDark, navigate, onClose, onOpenSpeedtest, pauseAllDevices, resumeAllDevices, scanNetwork, toast]);

  const filteredActions = React.useMemo(() => {
    if (!query.trim()) return staticActions;
    const q = query.toLowerCase();
    return staticActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [staticActions, query]);

  const totalItems = filteredDevices.length + filteredActions.length;

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (index: number) => {
    if (index < filteredDevices.length) {
      const dev = filteredDevices[index];
      setSelectedDevice(dev);
      onClose();
    } else {
      const actionIdx = index - filteredDevices.length;
      if (filteredActions[actionIdx]) {
        filteredActions[actionIdx].action();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-popover overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-secondary/30">
          <Search className="w-5 h-5 text-foreground-muted shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search devices, IP, MAC..."
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-foreground-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-foreground-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted bg-secondary border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-border/40">
          {/* Devices Section */}
          {filteredDevices.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-foreground-muted">
                Discovered Devices ({filteredDevices.length})
              </div>
              {filteredDevices.map((dev, idx) => {
                const isSelected = selectedIndex === idx;
                const Icon = dev.category === 'phone' ? Smartphone : dev.category === 'tv' ? Tv : Laptop;
                return (
                  <button
                    key={dev.id}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/60 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-secondary text-foreground-muted shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-foreground">{dev.nickname || dev.hostname}</div>
                        <div className="text-[11px] text-foreground-muted truncate font-mono">
                          {dev.ip} • {dev.mac} • {dev.vendor}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={dev.status === 'active' ? 'online' : dev.status === 'paused' ? 'paused' : 'offline'}
                      className="ml-2 shrink-0"
                    >
                      {dev.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions & Navigation Section */}
          {filteredActions.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-foreground-muted">
                Commands & Shortcuts
              </div>
              {filteredActions.map((item, idx) => {
                const itemIndex = filteredDevices.length + idx;
                const isSelected = selectedIndex === itemIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(itemIndex)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/60 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-secondary text-foreground-muted shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate text-foreground">{item.title}</div>
                        <div className="text-[11px] text-foreground-muted truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-foreground-muted bg-secondary px-1.5 py-0.5 rounded border border-border shrink-0 ml-2 font-mono">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="py-8 text-center text-sm text-foreground-muted">
              No devices or commands matching "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-secondary/40 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
          <div className="flex items-center gap-3 font-mono">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc dismiss</span>
          </div>
          <span className="font-mono text-[10px]">Wi-Fi Sentinel ⌘K</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
