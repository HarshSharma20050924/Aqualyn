import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../../config/redis';

// Helper to create a fresh RedisStore instance with a unique prefix.
// express-rate-limit v7+ requires each limiter to have its OWN store instance.
const makeStore = (prefix: string) =>
    new RedisStore({
        prefix,
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
    });

// 1. Global API Limiter (Standard Traffic)
// Allows 150 requests per minute per IP
export const globalLimiter = rateLimit({
    store: makeStore('rl:global:'),
    windowMs: 60 * 1000, // 1 minute
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

// 2. Strict Auth Limiter (Prevents Brute Force Attacks on Login/Signup)
// Allows only 100 requests every 15 minutes per IP
export const authLimiter = rateLimit({
    store: makeStore('rl:auth:'),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again after 15 minutes.' },
});

// 3. Media Upload Limiter (Prevents Storage Spam)
// Allows 30 uploads per hour per IP
export const uploadLimiter = rateLimit({
    store: makeStore('rl:upload:'),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Upload limit reached, please try again later.' },
});
