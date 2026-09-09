import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5080', 10),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SIMULATE_GATEWAY: process.env.SIMULATE_GATEWAY !== 'false',
};
