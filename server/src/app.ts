import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { swaggerDocument } from './docs/swaggerSpec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));

  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Raw OpenAPI 3.0 specification endpoints
  app.get('/api-docs/swagger.json', (req, res) => {
    res.json(swaggerDocument);
  });
  app.get('/api/docs/swagger.json', (req, res) => {
    res.json(swaggerDocument);
  });

  // Interactive Swagger UI documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // REST API router
  app.use('/api', apiRouter);

  // Unified Production Delivery: Serve static frontend files if client/dist exists
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    // SPA catch-all fallback for client-side HTML5 routing
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/api-docs') ||
        req.path.startsWith('/health')
      ) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // 404 & Error Handlers for unhandled API routes
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
