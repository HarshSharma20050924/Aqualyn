import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocketService } from '../src/services/SocketService';
import { PresenceService } from '../src/services/PresenceService';
import prisma from '../src/config/prisma';
import { notificationQueue } from '../src/config/queues';

// Mock dependencies
vi.mock('../src/config/prisma', () => ({
    default: {
        chat: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        message: { create: vi.fn(), update: vi.fn() },
        user: { findUnique: vi.fn() }
    }
}));

vi.mock('../src/services/PresenceService', () => ({
    PresenceService: {
        setUserOnline: vi.fn(),
        getUserStatus: vi.fn(),
        setUserOffline: vi.fn()
    }
}));

vi.mock('../src/config/queues', () => ({
    notificationQueue: { add: vi.fn() }
}));

describe('Distributed Chat Pipeline', () => {
    const mockSocket: any = {
        id: 'socket-1',
        join: vi.fn(),
        emit: vi.fn(),
        rooms: new Set(['user-1']),
        on: vi.fn()
    };
    
    const mockIo: any = {
        on: vi.fn(),
        to: vi.fn(() => ({ emit: vi.fn() }))
    };

    beforeEach(() => {
        vi.clearAllMocks();
        SocketService.init(mockIo);
    });

    it('should complete the full message pipeline (DB -> Redis -> Queue)', async () => {
        const messageData = {
            senderId: 'user-1',
            receiverId: 'user-2',
            chatId: 'chat-abc',
            text: 'Hello Cloud!'
        };

        // Mock return values
        (prisma as any).chat.findUnique.mockResolvedValue({ id: 'chat-abc' });
        (prisma as any).message.create.mockResolvedValue({ id: 'msg-99', ...messageData });
        (prisma as any).user.findUnique.mockResolvedValue({ displayName: 'Test User' });
        (PresenceService.getUserStatus as any).mockResolvedValue('online');

        // Execute the handler (manually triggering the private method logic for testing)
        await (SocketService as any).handleSendMessage(mockSocket, messageData);

        // VERIFICATION 1: Database Persistence
        expect(prisma.message.create).toHaveBeenCalled();
        
        // VERIFICATION 2: Distributed Presence Check
        expect(PresenceService.getUserStatus).toHaveBeenCalledWith('user-2');

        // VERIFICATION 3: Distributed Emit (to whole cluster)
        expect(mockIo.to).toHaveBeenCalledWith('user-2');

        // VERIFICATION 4: Background Worker Dispatch
        expect(notificationQueue.add).toHaveBeenCalledWith('send-push', expect.objectContaining({
            userId: 'user-2',
            text: 'Hello Cloud!'
        }));
    });
});
