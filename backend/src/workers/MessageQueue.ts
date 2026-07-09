import { Queue, Worker } from 'bullmq';
import { pubClient } from '../config/redis';
import prisma from '../config/prisma';

// 1. Create the Queue
export const messageQueue = new Queue('chat-messages', { 
    connection: pubClient as any,
    defaultJobOptions: {
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false,    // Keep failed jobs for debugging
    }
});

// 2. Create the Background Worker
// It pulls multiple messages (batching) to avoid hitting Postgres 1-by-1
const messageWorker = new Worker('chat-messages', async (job) => {
    try {
        const messageData = job.data;
        
        // Save to Postgres
        await (prisma as any).message.create({
            data: messageData
        });

        // NOTE: For extreme scale (300k users), you can configure BullMQ 
        // to process in batches here using createMany, but for now 
        // shifting the async work to the background Queue prevents the Event Loop from blocking.
        
    } catch (error) {
        console.error('[MessageWorker] Failed to save message:', error);
        throw error;
    }
}, { 
    connection: pubClient as any, 
    concurrency: 50 // Can process 50 background saves simultaneously
});

messageWorker.on('failed', (job, err) => {
    console.error(`[MessageWorker] Job ${job?.id} failed:`, err);
});

console.log('[BullMQ] Message Worker started successfully.');
