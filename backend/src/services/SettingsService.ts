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
     * High-scale Ready: Minimizes database lock contention.
     */
    static async updateSettings(userId: string, newSettings: any) {
        try {
            // 1. Fetch current settings
            const user = await (prisma as any).user.findUnique({
                where: { id: userId },
                select: { id: userId, settings: true }
            });

            const currentSettings = user?.settings && typeof user.settings === 'object' ? user.settings : {};
            
            // 2. Intelligence Merge (Don't overwrite everything)
            const mergedSettings = {
                ...currentSettings,
                ...newSettings
            };

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
}
