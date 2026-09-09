import http from 'http';
import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { telemetryBroadcaster } from './websocket/telemetryServer.js';
import { telemetryService } from './services/telemetry.service.js';

async function bootstrap() {
  console.log('====================================================');
  console.log('       WI-FI SENTINEL — GATEWAY ENGINE SERVER       ');
  console.log('====================================================');

  // 1. Connect to Database (Mongoose or fallback embedded)
  await connectDatabase();

  // 2. Create Express app and HTTP server
  const app = createApp();
  const server = http.createServer(app);

  // 3. Initialize WebSocket Telemetry Gateway
  telemetryBroadcaster.initialize(server);

  // 4. Start 1-second Telemetry Loop
  telemetryService.start();

  // 5. Start listening
  server.listen(ENV.PORT, ENV.HOST, () => {
    console.log(`[Server] REST API listening on http://${ENV.HOST}:${ENV.PORT}`);
    console.log(`[Server] WebSockets listening on ws://${ENV.HOST}:${ENV.PORT}/ws/telemetry`);
    console.log(`[Server] Ready for client connections.`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    telemetryService.stop();
    telemetryBroadcaster.close();
    server.close(() => {
      console.log('[Server] HTTP and WebSocket listeners closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 300);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Fatal] Failed to bootstrap server:', err);
  process.exit(1);
});
