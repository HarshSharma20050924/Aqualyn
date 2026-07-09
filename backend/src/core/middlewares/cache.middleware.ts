import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis';

/**
 * Redis Cache Middleware for API routes.
 * 
 * @param duration TTL in seconds (How long to cache the response)
 * @param isPersonalized If true, appends the userId to the cache key so users don't see each other's data
 */
export const cacheResponse = (duration: number = 60, isPersonalized: boolean = true) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate a unique cache key based on the URL and User ID
            let key = `cache:${req.originalUrl}`;
            if (isPersonalized) {
                const userId = (req as any).user?.id || 'anonymous';
                key = `cache:${userId}:${req.originalUrl}`;
            }

            // Check if we have a cached response in Redis
            const cachedBody = await redis.get(key);
            
            if (cachedBody) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.parse(cachedBody));
                return;
            }

            // If not cached, we hijack the res.send method to intercept the response body
            // before it is sent to the client, so we can save it to Redis.
            const originalSend = res.send;
            res.send = function (body: any): Response {
                // Restore original send function
                res.send = originalSend;

                // Only cache successful JSON responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Fire-and-forget: Save to Redis in the background
                    redis.set(key, body, 'EX', duration).catch(err => 
                        console.error('[Cache] Failed to set redis cache:', err)
                    );
                }
                
                res.setHeader('X-Cache', 'MISS');
                return originalSend.call(this, body);
            };

            next();
        } catch (error) {
            console.error('[Cache Middleware Error]', error);
            next(); // If Redis fails, gracefully fallback to fetching from DB
        }
    };
};
