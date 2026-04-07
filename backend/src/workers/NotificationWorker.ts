import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';

/**
 * The NotificationWorker is responsible for processing background push notification jobs.
 * This runs on its own thread and does not block the main Socket/API thread.
 */
export const notificationWorker = new Worker('notification-queue', async (job: Job) => {
    const { userId, text, chatId, senderId } = job.data;
    
    // Logic for Firebase / FCM (Firebase Cloud Messaging) integration goes here
    console.log(`[Worker] Sending notification to User ${userId} for message from ${senderId}: "${text}"`);
    
    // Simulation:
    // await fcm.send({ token: userToken, notification: { body: text }, data: { chatId } });
    
    return { success: true, timestamp: new Date() };

}, { 
    connection: redis.duplicate(), // Use a dedicated connection for the worker
    concurrency: 5 // Process 5 notifications simultaneously per worker instance
});

notificationWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
});

notificationWorker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
    // BullMQ will automatically retry this based on the retry strategy in queues.ts
});

console.log('[BullMQ] Notification Worker Started');
