import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisConfig = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Singleton clients for different concerns
export const redis = new Redis(REDIS_URL, redisConfig);
export const pubClient = new Redis(REDIS_URL, redisConfig);
export const subClient = pubClient.duplicate();

redis.on('error', (err) => console.error('[Redis] Event Error:', err));
pubClient.on('error', (err) => console.error('[Redis] Pub Error:', err));
subClient.on('error', (err) => console.error('[Redis] Sub Error:', err));

redis.on('connect', () => console.log('[Redis] Connected'));
