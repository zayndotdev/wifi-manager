import { EventEmitter } from 'events';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'HARDWARE' | 'NETWORK';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: 'ROUTER' | 'DNS' | 'DEVICE' | 'AUTH' | 'THROTTLE' | 'SYSTEM' | 'ARP' | 'SAAS';
  message: string;
  details?: any;
}

class SystemLoggerService extends EventEmitter {
  private logs: SystemLogEntry[] = [];
  private readonly maxLogs: number = 500;
  private wsBroadcaster: ((log: SystemLogEntry) => void) | null = null;

  constructor() {
    super();
    this.log('INFO', 'SYSTEM', 'Wi-Fi Sentinel Real-Time Diagnostic Logger initialized.');
  }

  public setBroadcaster(broadcaster: (log: SystemLogEntry) => void) {
    this.wsBroadcaster = broadcaster;
  }

  public log(level: LogLevel, category: SystemLogEntry['category'], message: string, details?: any): SystemLogEntry {
    const entry: SystemLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for terminal debugging
    const color =
      level === 'ERROR'
        ? '\x1b[31m'
        : level === 'WARN'
        ? '\x1b[33m'
        : level === 'HARDWARE'
        ? '\x1b[35m'
        : level === 'NETWORK'
        ? '\x1b[36m'
        : '\x1b[32m';
    console.log(`${color}[${entry.timestamp}] [${level}] [${category}]\x1b[0m ${message}`);

    // Emit event for internal subscribers
    this.emit('log', entry);

    // Broadcast over WebSocket if registered
    if (this.wsBroadcaster) {
      try {
        this.wsBroadcaster(entry);
      } catch (err) {
        // Silently ignore broadcast failure
      }
    }

    return entry;
  }

  public info(category: SystemLogEntry['category'], message: string, details?: any) {
    return this.log('INFO', category, message, details);
  }

  public warn(category: SystemLogEntry['category'], message: string, details?: any) {
    return this.log('WARN', category, message, details);
  }

  public error(category: SystemLogEntry['category'], message: string, details?: any) {
    return this.log('ERROR', category, message, details);
  }

  public hardware(category: SystemLogEntry['category'], message: string, details?: any) {
    return this.log('HARDWARE', category, message, details);
  }

  public network(category: SystemLogEntry['category'], message: string, details?: any) {
    return this.log('NETWORK', category, message, details);
  }

  public getRecentLogs(limit: number = 100): SystemLogEntry[] {
    return this.logs.slice(-limit);
  }

  public clearLogs() {
    this.logs = [];
    this.info('SYSTEM', 'Diagnostic logs cleared by administrator.');
  }
}

export const systemLogger = new SystemLoggerService();
