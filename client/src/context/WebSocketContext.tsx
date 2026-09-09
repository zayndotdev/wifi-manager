import * as React from 'react';

export interface TelemetryTick {
  wanDownloadBps: number;
  wanUploadBps: number;
  deviceSpeeds: Record<string, { downBps: number; upBps: number }>;
  timestamp: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  latestTick: TelemetryTick | null;
  addListener: (event: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = React.createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [latestTick, setLatestTick] = React.useState<TelemetryTick | null>(null);
  const listenersRef = React.useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const socketRef = React.useRef<WebSocket | null>(null);

  const addListener = React.useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);
    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  React.useEffect(() => {
    let reconnectTimeout: any = null;
    let isUnmounted = false;

    function connect() {
      const isDev = window.location.port.startsWith('51');
      const wsUrl = isDev
        ? 'ws://127.0.0.1:5080/ws/telemetry'
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/telemetry`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmounted) return;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'speed_tick') {
            setLatestTick(payload);
          }
          const callbacks = listenersRef.current.get(payload.type);
          if (callbacks) {
            callbacks.forEach((cb) => cb(payload));
          }
        } catch {
          // ignore malformed websocket messages
        }
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, latestTick, addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const ctx = React.useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
};
