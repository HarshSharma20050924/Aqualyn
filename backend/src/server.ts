import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { createServer } from 'http';
import prisma from './config/prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const server = createServer(app);
export const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
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

app.get('/api/health', (req, res) => {
    res.json({ status: 'Aqualyn server is running' });
});

    io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        console.log(`[Socket] User ${userId} joined room`);
        socket.join(userId);
    });

    socket.on('send_message', async (data) => {
        // data: { senderId, receiverId, chatId, text, imageUrl, videoUrl, document }
        const { senderId, receiverId, chatId, text, imageUrl, videoUrl } = data;
        console.log(`[Socket] SendMessage attempt: From ${senderId} to ${receiverId} in chat ${chatId}`);
        
        try {
            // Ensure the chat exists in the database first
            let chat = await (prisma as any).chat.findUnique({
                where: { id: chatId }
            });

            if (!chat) {
                console.log(`[Socket] Chat ${chatId} not found, creating...`);
                // Create the chat and add both participants
                chat = await (prisma as any).chat.create({
                    data: {
                        id: chatId,
                        isSecret: data.isSecret || false,
                        participants: {
                            create: [
                                { userId: senderId },
                                { userId: receiverId }
                            ]
                        }
                    }
                });
                console.log(`[Socket] Chat ${chatId} created successfully.`);
            } else {
                // If chat exists but was 'deleted for me' by the sender, clear it from deletedFor
                let deletedFor = [ ...(chat.deletedFor as any || []) ];
                if (deletedFor.includes(senderId)) {
                    deletedFor = deletedFor.filter((id: string) => id !== senderId);
                    await (prisma as any).chat.update({
                        where: { id: chatId },
                        data: { deletedFor }
                    });
                }
            }

            // Save to DB
            const message = await (prisma as any).message.create({
                data: {
                    senderId,
                    chatId,
                    text,
                    imageUrl,
                    videoUrl,
                    fileUrl: data.fileUrl,
                    audioUrl: data.audioUrl,
                    document: data.document,
                    location: data.location,
                    contact: data.contact,
                    payment: data.payment,
                    schedule: data.schedule,
                    wallet: data.wallet,
                    replyToId: data.replyToId,
                    status: 'sent',
                    isRead: false
                }
            });

            // Fetch sender info for better UI experience on the recipient side
            const sender = await (prisma as any).user.findUnique({
                where: { id: senderId },
                select: { displayName: true, avatar: true, username: true }
            });

            // Emit to recipient
            const recipientSocket = io.sockets.adapter.rooms.get(receiverId);
            const isDelivered = recipientSocket && recipientSocket.size > 0;

            if (isDelivered) {
                // Update to delivered if recipient is online
                await (prisma as any).message.update({
                    where: { id: message.id },
                    data: { status: 'delivered' }
                });
                message.status = 'delivered';
            }

            io.to(receiverId).emit('receive_message', {
                ...message,
                sender: sender,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            // Quick ack to sender too
            socket.emit('message_sent_ack', {
                ...message,
                sender: sender,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        } catch (e: any) {
            console.error('[Socket] ERROR in send_message:', e.message || e);
        }
    });

    socket.on('react_message', async (data) => {
        const { messageId, emoji, userId, receiverId } = data;
        
        try {
            // Persist in DB
            const message = await (prisma as any).message.findUnique({ where: { id: messageId } });
            if (message) {
                const reactions = { ...(message.reactions as any || {}) };
                const userReactions = reactions[emoji] || [];
                
                if (userReactions.includes(userId)) {
                    reactions[emoji] = userReactions.filter((id: string) => id !== userId);
                    if (reactions[emoji].length === 0) delete reactions[emoji];
                } else {
                    reactions[emoji] = [...userReactions, userId];
                }

                await (prisma as any).message.update({
                    where: { id: messageId },
                    data: { reactions }
                });

                // Broadcast
                io.to(receiverId).emit('message_reacted', { chatId: message.chatId, messageId, emoji, userId });
            }
        } catch (e) {
            console.error('Reaction error:', e);
        }
    });

    socket.on('edit_message', async (data) => {
        const { messageId, newText, receiverId } = data;
        try {
            const message = await (prisma as any).message.update({
                where: { id: messageId },
                data: { text: newText }
            });
            io.to(receiverId).emit('message_edited', { chatId: message.chatId, messageId, newText });
        } catch (e) {
            console.error('Edit error:', e);
        }
    });

    socket.on('delete_message_for_everyone', async (data) => {
        const { chatId, messageId, receiverId } = data;
        try {
            await (prisma as any).message.delete({
                where: { id: messageId }
            });
            io.to(receiverId).emit('message_deleted', { chatId, messageId });
        } catch (e) {
            console.error('Delete error:', e);
        }
    });

    socket.on('delete_chat_for_me', async (data) => {
        const { chatId, userId } = data;
        try {
            const chat = await (prisma as any).chat.findUnique({ where: { id: chatId } });
            if (chat) {
                const deletedFor = [ ...(chat.deletedFor as any || []) ];
                if (!deletedFor.includes(userId)) {
                    deletedFor.push(userId);
                }
                await (prisma as any).chat.update({
                    where: { id: chatId },
                    data: { deletedFor }
                });
            }
        } catch (e) {
            console.error('Delete chat error:', e);
        }
    });

    socket.on('delete_message_for_me', async (data) => {
        const { messageId, userId } = data;
        try {
            const message = await (prisma as any).message.findUnique({ where: { id: messageId } });
            if (message) {
                const deletedFor = [ ...(message.deletedFor as any || []) ];
                if (!deletedFor.includes(userId)) {
                    deletedFor.push(userId);
                }
                await (prisma as any).message.update({
                    where: { id: messageId },
                    data: { deletedFor }
                });
            }
        } catch (e) {
            console.error('Delete for me error:', e);
        }
    });

    socket.on('delete_chat_for_everyone', async (data) => {
        const { chatId, receiverId } = data;
        try {
            // Delete from database completely (this deletes participants and messages too due to cascade or logic)
            await (prisma as any).chat.delete({
                where: { id: chatId }
            });
            // Inform both parties so the UI clears immediately
            io.to(receiverId).emit('chat_deleted', { chatId });
        } catch (e) {
            console.error('Delete for everyone error:', e);
        }
    });

    socket.on('mark_as_read', async (data) => {
        const { chatId, userId } = data;
        try {
            await (prisma as any).message.updateMany({
                where: {
                    chatId,
                    senderId: { not: userId },
                    status: { not: 'seen' }
                },
                data: { 
                    isRead: true,
                    status: 'seen'
                }
            });
            
            // Notify the sender that messages were seen
            const chat = await (prisma as any).chat.findUnique({
                where: { id: chatId },
                include: { participants: true }
            });
            const otherParticipant = chat?.participants.find((p: any) => p.userId !== userId);
            if (otherParticipant) {
                io.to(otherParticipant.userId).emit('messages_seen', { chatId, userId });
            }
        } catch (e) {
            console.error('Mark as read error:', e);
        }
    });

    socket.on('invite_to_chat', async (data) => {
        const { chatId, targetUserId, inviterId } = data;
        try {
            const inviter = await (prisma as any).user.findUnique({ where: { id: inviterId } });
            io.to(targetUserId).emit('chat_invitation', { 
                chatId, 
                inviterId, 
                inviterName: inviter?.displayName || inviter?.username || 'Someone' 
            });
        } catch (e) {
            console.error('Invite error:', e);
        }
    });

    socket.on('typing', (data) => {
        // data: { chatId, userId, userName, isTyping, receiverId }
        io.to(data.receiverId).emit('user_typing', data);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
