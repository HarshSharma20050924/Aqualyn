import { Queue } from 'bullmq';
import { redis } from './redis';

/**
 * QueueService is the central place to register and manage distributed task queues.
 * All background work (Push Notifications, Media Resizing, Emails) must go through here.
 */
export const notificationQueue = new Queue('notification-queue', { 
    connection: redis.duplicate(), // Create a dedicated Redis connection for the Queue
    defaultJobOptions: {
        attempts: 3, // Retry failed notifications 3 times automatically
        backoff: {
            type: 'exponential',
            delay: 1000, // Wait 1s, then 2s, then 4s...
        },
        removeOnComplete: true, // Cleanup Redis memory once done
    }
});

console.log('[BullMQ] Notification Queue Initialized');
