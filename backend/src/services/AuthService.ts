import { redis, pubClient } from '../config/redis';
import admin from '../config/firebaseAdmin';

/**
 * AuthService handles distributed token lifecycle and session invalidation.
 * In a 100k+ system, we use a Redis Denylist to revoke stateless JWTs.
 */
export class AuthService {
    private static REVOKE_PREFIX = 'revoked:token:';

    /**
     * Revoke a token globally. We store it in Redis until its natural expiry.
     * This ensures the token cannot be used again on any node in the cluster.
     */
    static async logout(userId: string, token: string): Promise<void> {
        try {
            // 1. Decode token to find its expiry
            const decodedToken = await admin.auth().verifyIdToken(token, true);
            const expiry = decodedToken.exp - Math.floor(Date.now() / 1000);

            if (expiry > 0) {
                // 2. Add to Redis Denylist with TTL
                const key = `${this.REVOKE_PREFIX}${token}`;
                await redis.set(key, '1', 'EX', expiry);
            }

            // 3. Global Kill Signal (Socket Disconnect)
            // Broadcast to all backend servers via Redis Pub/Sub
            await pubClient.publish('GLOBAL_LOGOUT', JSON.stringify({ userId, token }));
            
            console.log(`[Auth] Global Logout for User ${userId}`);
        } catch (e) {
            console.error('[AuthService] Logout Error:', e);
        }
    }

    /**
     * Check if a token has been revoked by any server in the cluster.
     */
    static async isRevoked(token: string): Promise<boolean> {
        const key = `${this.REVOKE_PREFIX}${token}`;
        const result = await redis.get(key);
        return result === '1';
    }
}
