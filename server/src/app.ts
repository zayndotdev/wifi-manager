import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { ENV } from './config/env.js';
import { swaggerDocument } from './docs/swaggerSpec.js';

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

  // API router
  app.use('/api', apiRouter);

  // 404 & Error Handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
