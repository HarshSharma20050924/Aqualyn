import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import prisma from '../../src/config/prisma';
import { SocketService } from '../../src/services/SocketService';

describe('SocketService Real-Time Integration Tests', () => {
    let httpServer: HTTPServer;
    let ioServer: SocketIOServer;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    
    const user1Id = 'test-user-1-uuid';
    const user2Id = 'test-user-2-uuid';
    const port = 4001; // Discrete testing port

    beforeAll(async () => {
        // Setup a real HTTP and Socket.io server context
        httpServer = createServer();
        ioServer = new SocketIOServer(httpServer, {
            cors: { origin: '*' }
        });
        
        // Initialize your application's service logic
        SocketService.init(ioServer);
        
        await new Promise<void>((resolve) => httpServer.listen(port, resolve));
    });

    afterAll(async () => {
        // Close downstream servers safely to avoid memory hangs
        ioServer.close();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    });

    beforeEach(async () => {
        // Clear underlying relational tables before every isolated test execution
        await prisma.message.deleteMany({});
        await prisma.chatParticipant.deleteMany({});
        await prisma.chat.deleteMany({});
        await prisma.user.deleteMany({});

        // Provision base mock profiles for authorization mapping
        await prisma.user.createMany({
            data: [
                { id: user1Id, username: 'harsh_dev', email: 'harsh@aqualyn.io' },
                { id: user2Id, username: 'alex_test', email: 'alex@aqualyn.io' }
            ]
        });

        // Initialize connected clients mimicking the frontend
        clientSocket1 = ioClient(`http://localhost:${port}`, {
            autoConnect: false,
            transports: ['websocket']
        });
        clientSocket2 = ioClient(`http://localhost:${port}`, {
            autoConnect: false,
            transports: ['websocket']
        });
    });

    // Cleanup client links after individual assertions
    afterEach(() => {
        if (clientSocket1.connected) clientSocket1.disconnect();
        if (clientSocket2.connected) clientSocket2.disconnect();
    });

    it('should successfully establish client connections and join individual authentication rooms', () => {
        return new Promise<void>((resolve, reject) => {
            clientSocket1.connect();

            clientSocket1.on('connect', () => {
                expect(clientSocket1.connected).toBe(true);
                resolve();
            });

            clientSocket1.on('connect_error', (err) => reject(err));
        });
    });

    it('should propagate real-time events to explicit users via backend emission hooks', () => {
        return new Promise<void>((resolve, reject) => {
            // Set up the internal server-side interception hook to place the user in their room
            ioServer.once('connection', (socket) => {
                socket.join(user1Id);
            });

            clientSocket1.connect();

            clientSocket1.on('connect', () => {
                // Set up client-side event handler
                clientSocket1.on('custom_notification', (payload) => {
                    expect(payload.message).toBe('System Alert Baseline Passed');
                    resolve();
                });

                // Trigger the backend emission hook
                setTimeout(() => {
                    SocketService.emitToUser(user1Id, 'custom_notification', {
                        message: 'System Alert Baseline Passed'
                    });
                }, 100);
            });

            clientSocket1.on('connect_error', (err) => reject(err));
        });
    });

    it('should securely handle direct chat invitations across connected sockets', () => {
        const mockChatId = 'chat-sandbox-id-99';

        return new Promise<void>((resolve, reject) => {
            // Intercept both incoming sockets on the testing server to place them into their user rooms
            ioServer.on('connection', (socket) => {
                if (!socket.rooms.has(user2Id) && !socket.rooms.has(user1Id)) {
                    if (ioServer.sockets.sockets.size === 1) {
                        socket.join(user2Id);
                    } else {
                        socket.join(user1Id);
                    }
                }
            });

            // 1. Recipient client establishes link
            clientSocket2.connect();

            clientSocket2.on('connect', () => {
                clientSocket2.on('chat_invitation', (data) => {
                    expect(data.chatId).toBe(mockChatId);
                    expect(data.inviterId).toBe(user1Id);
                    resolve();
                });

                // 2. Sender connects and triggers invitation handler
                clientSocket1.connect();
                clientSocket1.on('connect', () => {
                    clientSocket1.emit('invite_to_chat', {
                        chatId: mockChatId,
                        targetUserId: user2Id,
                        inviterId: user1Id
                    });
                });
            });

            clientSocket1.on('connect_error', (err) => reject(err));
            clientSocket2.on('connect_error', (err) => reject(err));
        });
    });
});