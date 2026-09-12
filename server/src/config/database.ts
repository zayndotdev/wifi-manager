import mongoose from 'mongoose';
import { ENV } from './env.js';

export let isConnectedToMongo = false;

// Attach persistent connection lifecycle listeners
mongoose.connection.on('connected', () => {
  isConnectedToMongo = true;
  console.log('[Database] MongoDB connection established.');
});

mongoose.connection.on('disconnected', () => {
  isConnectedToMongo = false;
  console.warn('[Database] MongoDB connection lost (reconnecting automatically in background)...');
});

mongoose.connection.on('reconnected', () => {
  isConnectedToMongo = true;
  console.log('[Database] MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err: any) => {
  console.warn(`[Database] MongoDB connection warning: ${err.message}`);
});

export async function connectDatabase(): Promise<boolean> {
  if (ENV.MONGODB_URI) {
    try {
      console.log(`[Database] Connecting to MongoDB at ${ENV.MONGODB_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@')}...`);
      await mongoose.connect(ENV.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        heartbeatFrequencyMS: 10000,
      });
      isConnectedToMongo = true;
      console.log('[Database] MongoDB connected successfully.');
      return true;
    } catch (err: any) {
      console.warn(`[Database] Failed to connect to external MongoDB: ${err.message}`);
      console.log('[Database] Activating high-performance Embedded Data Store for seamless local operation.');
      isConnectedToMongo = false;
      return false;
    }
  } else {
    console.log('[Database] No MONGODB_URI configured. Running with embedded in-memory persistence store.');
    isConnectedToMongo = false;
    return false;
  }
}
