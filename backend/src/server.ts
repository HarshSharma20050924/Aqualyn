import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import socialRoutes from './routes/socialRoutes';
import groupRoutes from './routes/groupRoutes';
import uploadRoutes from './routes/uploadRoutes';
import path from 'path';
import { Server } from 'socket.io';
import { createServer } from 'http';
import prisma from './config/prisma';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './config/redis';
import { SocketService } from './services/SocketService';

const app = express();
const port = process.env.PORT || 5000;
const server = createServer(app);
const allowedOrigins = [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:3000'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

export const io = new Server(server, {
    cors: { 
        origin: allowedOrigins,
        credentials: true
    }
});

// Setup Distributed Redis Adapter
io.adapter(createAdapter(pubClient, subClient));
// Initialize our clean SocketService
SocketService.init(io);

app.use(cookieParser());


app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'Aqualyn server is running' });
});

// All Socket.io logic has been moved to SocketService.ts
// to support a high-concurrency distributed architecture.

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
