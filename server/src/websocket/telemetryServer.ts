import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

class TelemetryBroadcaster {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial acknowledgement
      ws.send(
        JSON.stringify({
          type: 'connection_ack',
          timestamp: Date.now(),
          status: 'connected',
        })
      );

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    console.log('[WebSocket] Telemetry gateway listening on /ws/telemetry');
  }

  public broadcast(type: string, data: any) {
    if (!this.wss || this.clients.size === 0) return;
    const message = JSON.stringify({ type, ...data });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  public close() {
    for (const client of this.clients) {
      try {
        client.terminate();
      } catch {
        // ignore
      }
    }
    this.clients.clear();
    if (this.wss) {
      try {
        this.wss.close();
      } catch {
        // ignore
      }
      this.wss = null;
    }
  }
}

export const telemetryBroadcaster = new TelemetryBroadcaster();
