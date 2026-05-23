import prisma from '../config/prisma';
import { pubClient } from '../config/redis';

/**
 * SettingsService handles the persistence and sync of user preferences.
 * Uses a JSON merge strategy to ensure non-destructive updates.
 */
export class SettingsService {
    
    /**
     * Get the current settings for a user.
     */
    static async getSettings(userId: string) {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { settings: true }
        });
        return user?.settings || {};
    }

    /**
     * Update user settings with a partial object (Deep Merge).
     */
    static async updateSettings(userId: string, newSettings: any) {
        try {
            // 1. Fetch current settings
            const user = await (prisma as any).user.findUnique({
                where: { id: userId },
                select: { settings: true }
            });

            const currentSettings = user?.settings && typeof user.settings === 'object' ? user.settings : {};
            
            // 2. Deep Merge logic
            const mergedSettings = this.deepMerge(currentSettings, newSettings);

            // 3. Persist
            const updatedUser = await (prisma as any).user.update({
                where: { id: userId },
                data: { settings: mergedSettings },
                select: { settings: true }
            });

            // 4. Global Broadcast (Sync with all devices)
            await pubClient.publish('SETTINGS_SYNC', JSON.stringify({ userId, settings: mergedSettings }));

            return updatedUser.settings;
        } catch (e) {
            console.error('[SettingsService] Sync error:', e);
            throw new Error('Failed to update settings');
        }
    }

    /**
     * Simple deep merge helper
     */
    private static deepMerge(target: any, source: any) {
        const output = { ...target };
        if (typeof source === 'object' && source !== null) {
            Object.keys(source).forEach(key => {
                if (typeof source[key] === 'object' && source[key] !== null && target[key]) {
                    output[key] = this.deepMerge(target[key], source[key]);
                } else {
                    output[key] = source[key];
                }
            });
        }
        return output;
    }

    /**
     * Calculate storage usage breakdown for a user.
     */
    static async getStorageUsage(userId: string) {
        const messages = await (prisma as any).message.findMany({
            where: { senderId: userId, NOT: { fileSize: null } },
            select: { fileSize: true, mimeType: true }
        });

        const breakdown = {
            images: 0,
            videos: 0,
            audio: 0,
            documents: 0,
            total: 0
        };

        messages.forEach((msg: any) => {
            const size = msg.fileSize || 0;
            breakdown.total += size;
            
            if (msg.mimeType?.startsWith('image/')) breakdown.images += size;
            else if (msg.mimeType?.startsWith('video/')) breakdown.videos += size;
            else if (msg.mimeType?.startsWith('audio/')) breakdown.audio += size;
            else breakdown.documents += size;
        });

        return breakdown;
    }

    /**
     * List active sessions for a user.
     */
    static async getActiveSessions(userId: string) {
        return await (prisma as any).session.findMany({
            where: { userId },
            select: { id: true, device: true, createdAt: true, expiresAt: true }
        });
    }

    /**
     * Revoke a specific session.
     */
    static async revokeSession(userId: string, sessionId: string) {
        return await (prisma as any).session.deleteMany({
            where: { id: sessionId, userId }
        });
    }
}
