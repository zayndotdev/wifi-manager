import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { ENV } from './config/env.js';

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

  // API router
  app.use('/api', apiRouter);

  // 404 & Error Handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
