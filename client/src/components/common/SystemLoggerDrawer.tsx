import * as React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import {
  Terminal,
  X,
  Trash2,
  Copy,
  Check,
  Pause,
  Play,
  Shield,
  Search,
  Filter,
  ArrowDownCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export interface SystemLogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'HARDWARE' | 'NETWORK';
  category: 'ROUTER' | 'DNS' | 'DEVICE' | 'AUTH' | 'THROTTLE' | 'SYSTEM';
  message: string;
  details?: any;
}

interface SystemLoggerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemLoggerDrawer: React.FC<SystemLoggerDrawerProps> = ({ isOpen, onClose }) => {
  const { isConnected, addListener } = useWebSocket();
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<SystemLogItem[]>([]);
  const [isPaused, setIsPaused] = React.useState(false);
  const [filterLevel, setFilterLevel] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Initial fetch from REST API
  React.useEffect(() => {
    if (!isOpen) return;
    api
      .getSystemLogs(100)
      .then((res) => {
        if (res && Array.isArray(res.logs)) {
          setLogs(res.logs);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Subscribe to live WebSocket logs
  React.useEffect(() => {
    const unsubLog = addListener('system_log', (payload: any) => {
      if (isPaused) return;
      if (payload && payload.log) {
        setLogs((prev) => [...prev.slice(-400), payload.log]);
      }
    });

    const unsubRecent = addListener('recent_logs', (payload: any) => {
      if (payload && Array.isArray(payload.logs)) {
        setLogs(payload.logs);
      }
    });

    return () => {
      unsubLog();
      unsubRecent();
    };
  }, [addListener, isPaused]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = async () => {
    try {
      await api.clearSystemLogs();
      setLogs([]);
      toast({ type: 'info', title: 'Logs Cleared', description: 'Diagnostic log buffer cleared.' });
    } catch {
      setLogs([]);
    }
  };

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${
            l.details ? JSON.stringify(l.details) : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ type: 'success', title: 'Logs Copied', description: 'Diagnostic logs copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border-t border-slate-800 shadow-2xl flex flex-col h-[70vh] max-h-[850px] w-full">
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                  LIVE DIAGNOSTIC LOGGER & HARDWARE MONITOR
                </h3>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  )}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Streaming live execution logs, router commands, and port 53 traffic
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter logs..."
                className="h-8 text-xs bg-slate-900 border border-slate-700 rounded-md pl-7 pr-2 text-slate-200 focus:outline-none focus:border-primary w-36 sm:w-48 font-mono"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5 text-xs font-mono">
              {['ALL', 'HARDWARE', 'NETWORK', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer',
                    filterLevel === lvl
                      ? 'bg-primary text-primary-foreground'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Pause / Resume Stream */}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsPaused(!isPaused)}
              className="text-xs gap-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
            >
              {isPaused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3 text-amber-400" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </Button>

            {/* Copy Logs */}
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopy}
              className="text-xs gap-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>Copy</span>
            </Button>

            {/* Clear Logs */}
            <Button
              variant="outline"
              size="xs"
              onClick={handleClear}
              className="text-xs gap-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-rose-400"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </Button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Terminal Screen */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 bg-slate-950 text-slate-300 selection:bg-primary/30"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <Terminal className="h-8 w-8 opacity-40" />
              <p>No diagnostic log events matching filter</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const levelColor =
                log.level === 'ERROR'
                  ? 'text-rose-400 border-rose-900/50 bg-rose-950/30'
                  : log.level === 'WARN'
                  ? 'text-amber-400 border-amber-900/50 bg-amber-950/30'
                  : log.level === 'HARDWARE'
                  ? 'text-fuchsia-400 border-fuchsia-900/50 bg-fuchsia-950/30'
                  : log.level === 'NETWORK'
                  ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30'
                  : 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30';

              const timeStr = log.timestamp ? log.timestamp.split('T')[1]?.replace('Z', '') : '';

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-0.5 px-1.5 rounded hover:bg-slate-900/60 transition-colors"
                >
                  <span className="text-slate-600 select-none text-[11px] shrink-0 font-mono">
                    {timeStr}
                  </span>

                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border shrink-0',
                      levelColor
                    )}
                  >
                    {log.level}
                  </span>

                  <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                    [{log.category}]
                  </span>

                  <span className="text-slate-200 break-all leading-relaxed flex-1">
                    {log.message}
                    {log.details && (
                      <pre className="text-[10px] text-slate-400 mt-0.5 bg-slate-900 p-1.5 rounded overflow-x-auto border border-slate-800">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span>Buffer: {logs.length} / 500 events</span>
            <span>•</span>
            <span className="text-slate-300">
              Gateway Target: <strong className="text-primary">192.168.1.1 (ZTE TEWA-220G)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(
                'flex items-center gap-1 cursor-pointer transition-colors',
                autoScroll ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <ArrowDownCircle className="h-3 w-3" />
              <span>Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
