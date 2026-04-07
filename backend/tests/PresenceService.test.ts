import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { PresenceService } from '../src/services/PresenceService';

// Mock Redis for the test
vi.mock('../src/config/redis', () => {
    const mockData: Record<string, string> = {};
    return {
        redis: {
            set: vi.fn(async (key: string, val: string) => { mockData[key] = val; }),
            get: vi.fn(async (key: string) => mockData[key] || null),
            del: vi.fn(async (key: string) => { delete mockData[key]; }),
            expire: vi.fn(async () => {}),
        },
    };
});

describe('PresenceService', () => {
    const userId = 'user-123';

    it('should set the user as online in Redis', async () => {
        await PresenceService.setUserOnline(userId);
        const status = await PresenceService.getUserStatus(userId);
        expect(status).toBe('online');
    });

    it('should set the user as offline in Redis', async () => {
        await PresenceService.setUserOnline(userId);
        await PresenceService.setUserOffline(userId);
        const status = await PresenceService.getUserStatus(userId);
        expect(status).toBe('offline');
    });

    it('should return offline for unknown user', async () => {
        const status = await PresenceService.getUserStatus('unknown');
        expect(status).toBe('offline');
    });
});
