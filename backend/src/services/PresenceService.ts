import { redis } from '../config/redis';

/**
 * PresenceService manages user online/offline status in a distributed way using Redis.
 * This ensures any server node can check if a user is online, regardless of
 * which node they are connected to.
 */
export class PresenceService {
    private static PREFIX = 'user:presence:';
    private static TTL = 60; // 60 seconds (1 minute)

    /**
     * Mark a user as online in the global Redis store.
     */
    static async setUserOnline(userId: string): Promise<void> {
        const key = `${this.PREFIX}${userId}`;
        await redis.set(key, 'online', 'EX', this.TTL);
    }

    /**
     * Mark a user as offline in the global Redis store.
     */
    static async setUserOffline(userId: string): Promise<void> {
        const key = `${this.PREFIX}${userId}`;
        await redis.del(key);
    }

    /**
     * Check if a user is currently online.
     */
    static async getUserStatus(userId: string): Promise<'online' | 'offline'> {
        const key = `${this.PREFIX}${userId}`;
        const status = await redis.get(key);
        return status === 'online' ? 'online' : 'offline';
    }

    /**
     * Batch check online status for multiple users (Optimized for Chat Lists).
     * Returns a Map of userId -> status
     */
    static async getPresenceBatch(userIds: string[]): Promise<Record<string, 'online' | 'offline'>> {
        if (userIds.length === 0) return {};
        
        const keys = userIds.map(id => `${this.PREFIX}${id}`);
        const results = await redis.mget(...keys);
        
        const presenceMap: Record<string, 'online' | 'offline'> = {};
        userIds.forEach((id, index) => {
            presenceMap[id] = results[index] === 'online' ? 'online' : 'offline';
        });
        
        return presenceMap;
    }

    /**
     * Refresh the user's online status (Heartbeat).
     */
    static async heartbeat(userId: string): Promise<void> {
        await this.setUserOnline(userId);
    }
}
