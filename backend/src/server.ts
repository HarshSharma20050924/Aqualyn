import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import socialRoutes from './routes/socialRoutes';
import groupRoutes from './routes/groupRoutes';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { createServer } from 'http';
import prisma from './config/prisma';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './config/redis';
import { SocketService } from './services/SocketService';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const server = createServer(app);
export const io = new Server(server, {
    cors: { origin: '*' }
});

// Setup Distributed Redis Adapter
io.adapter(createAdapter(pubClient, subClient));
// Initialize our clean SocketService
SocketService.init(io);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Users Search API
app.get('/api/users/search', async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    try {
        const users = await (prisma as any).user.findMany({
            where: {
                OR: [
                    { username: { contains: q, mode: 'insensitive' } },
                    { displayName: { contains: q, mode: 'insensitive' } },
                    { 
                      AND: [
                        { phone: { contains: q } },
                        { searchByPhone: true }
                      ]
                    }
                ]
            },
            select: { 
                id: true, 
                displayName: true, 
                username: true, 
                phone: true, 
                avatar: true, 
                bio: true, 
                isPrivate: true,
                receivedFollowReqs: {
                    select: { senderId: true }
                }
            }
        });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/groups', groupRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'Aqualyn server is running' });
});

// All Socket.io logic has been moved to SocketService.ts
// to support a high-concurrency distributed architecture.

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
