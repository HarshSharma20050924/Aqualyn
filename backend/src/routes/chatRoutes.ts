import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import prisma from '../config/prisma';
import { SocketService } from '../services/SocketService';

const router = Router();

router.use(verifyToken);

// Get user chats
router.get('/', async (req: any, res: any) => {
    try {
        const userId = req.user.id;

        const chats = await (prisma as any).chat.findMany({
            where: {
                participants: { some: { userId } }
            },
            select: {
                id: true, name: true, isGroup: true, isSecret: true,
                avatar: true, deletedFor: true, updatedAt: true,
                selfDestructTimer: true,
                participants: {
                    select: {
                        userId: true,
                        role: true,
                        status: true,
                        user: {
                            select: { id: true, username: true, displayName: true, avatar: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { text: true, createdAt: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Optimization: Fetch all unread counts in one single query (Avoid N+1)
        const unreadCounts = await (prisma as any).message.groupBy({
            by: ['chatId'],
            where: {
                chatId: { in: chats.map((c: any) => c.id) },
                isRead: false,
                senderId: { not: userId }
            },
            _count: { id: true }
        });

        const countsMap = new Map(unreadCounts.map((item: any) => [item.chatId, item._count.id]));

        // Fetch muted chats for this user
        const mutedChats = await (prisma as any).mutedChat.findMany({
            where: { userId, chatId: { in: chats.map((c: any) => c.id) } },
            select: { chatId: true }
        });
        const mutedSet = new Set(mutedChats.map((m: any) => m.chatId));

        // Filter and Map
        const activeChats = chats.filter((c: any) => {
            const deletedFor = c.deletedFor as any || [];
            return !deletedFor.includes(userId);
        });

        const mappedChats = activeChats.map((c: any) => {
            const myParticipant = c.participants.find((p: any) => p.userId === userId);
            const otherParticipant = c.participants.find((p: any) => p.userId !== userId);
            return {
                id: c.id,
                name: c.name || otherParticipant?.user.displayName || otherParticipant?.user.username || 'User',
                avatar: c.isGroup ? c.avatar : otherParticipant?.user.avatar,
                lastMessage: c.messages[0]?.text || '',
                lastMessageTime: c.messages[0]?.createdAt 
                    ? new Date(c.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Recent',
                isGroup: c.isGroup,
                isSecret: c.isSecret,
                unreadCount: countsMap.get(c.id) || 0,
                selfDestructTimer: c.selfDestructTimer,
                participantIds: c.participants.map((p: any) => p.userId),
                isMuted: mutedSet.has(c.id),
                myStatus: myParticipant?.status || 'JOINED',
                myRole: myParticipant?.role || 'MEMBER'
            };
        });

        res.json(mappedChats);
    } catch (e) {
        console.error('[ChatRoutes] Failed to fetch chats:', e);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get chat messages
router.get('/:chatId/messages', async (req: any, res: any) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const messages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            take: 100,
            select: {
                id: true, chatId: true, senderId: true, text: true, 
                imageUrl: true, videoUrl: true, fileUrl: true, 
                audioUrl: true, document: true, location: true,
                contact: true, payment: true, schedule: true,
                wallet: true, replyToId: true, status: true,
                isEdited: true, isRead: true, reactions: true,
                deletedFor: true, createdAt: true
            }
        });
        
        // Filter out deleted messages and Map Prisma messages to frontend type
        const mappedMsgs = messages
            .filter((m: any) => {
                const deletedFor = m.deletedFor as any || [];
                return !deletedFor.includes(userId);
            })
            .map((m: any) => ({
                ...m,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

        res.json(mappedMsgs);
    } catch (e) {
        console.error('[ChatRoutes] Failed to fetch messages:', e);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Toggle mute chat
router.post('/:chatId/mute', async (req: any, res: any) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    try {
        const existing = await (prisma as any).mutedChat.findUnique({
            where: { userId_chatId: { userId, chatId } }
        });
        if (existing) {
            await (prisma as any).mutedChat.delete({ where: { id: existing.id } });
            return res.json({ muted: false });
        } else {
            await (prisma as any).mutedChat.create({
                data: { userId, chatId }
            });
            return res.json({ muted: true });
        }
    } catch (e) {
        console.error('[ChatRoutes] Mute error:', e);
        res.status(500).json({ error: 'Mute operation failed' });
    }
});

// Update chat settings
router.patch('/:chatId/settings', async (req: any, res: any) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { settings, selfDestructTimer } = req.body;
    try {
        const chat = await (prisma as any).chat.findUnique({ 
            where: { id: chatId },
            include: { participants: true }
        });
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        const updatedChat = await (prisma as any).chat.update({
            where: { id: chatId },
            data: {
                ...(settings !== undefined && { settings: { ...(chat.settings as object || {}), ...settings } }),
                ...(selfDestructTimer !== undefined && { selfDestructTimer })
            }
        });

        // Notify participants
        chat.participants.forEach((p: any) => {
            SocketService.emitToUser(p.userId, 'chat_updated', updatedChat);
        });

        res.json({ success: true, chat: updatedChat });
    } catch (e) {
        console.error('[ChatRoutes] Settings update error:', e);
        res.status(500).json({ error: 'Failed to update chat settings' });
    }
});

// Get media counts for a chat
router.get('/:chatId/media', async (req: any, res: any) => {
    const { chatId } = req.params;
    try {
        const messages = await (prisma as any).message.findMany({
            where: { chatId },
            select: { imageUrl: true, videoUrl: true, audioUrl: true, fileUrl: true, document: true }
        });
        
        let images = 0, videos = 0, docs = 0, audio = 0;
        for (const m of messages) {
            if (m.imageUrl) images++;
            if (m.videoUrl) videos++;
            if (m.audioUrl) audio++;
            if (m.fileUrl || m.document) docs++;
        }
        
        res.json({ images, videos, docs, audio, total: images + videos + docs + audio });
    } catch (e) {
        console.error('[ChatRoutes] Media count error:', e);
        res.status(500).json({ error: 'Media count failed' });
    }
});

// Request a secret chat with another user
router.post('/secret/request', async (req: any, res: any) => {
    const userId = req.user.id;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });

    try {
        // Check if a secret chat already exists between these two users
        const existingSecret = await (prisma as any).chat.findFirst({
            where: {
                isSecret: true,
                isGroup: false,
                AND: [
                    { participants: { some: { userId: userId } } },
                    { participants: { some: { userId: targetUserId } } }
                ]
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, displayName: true, avatar: true }
                        }
                    }
                }
            }
        });

        if (existingSecret) {
            const mappedChat = {
                id: existingSecret.id,
                name: existingSecret.name || existingSecret.participants.find((p: any) => p.userId !== userId)?.user.displayName || 'Secret Chat',
                avatar: existingSecret.participants.find((p: any) => p.userId !== userId)?.user.avatar,
                lastMessage: '',
                lastMessageTime: 'Recent',
                isGroup: false,
                isSecret: true,
                unreadCount: 0,
                selfDestructTimer: existingSecret.selfDestructTimer,
                participantIds: existingSecret.participants.map((p: any) => p.userId),
                isMuted: false,
                myStatus: existingSecret.participants.find((p: any) => p.userId === userId)?.status || 'JOINED',
                myRole: existingSecret.participants.find((p: any) => p.userId === userId)?.role || 'MEMBER'
            };
            return res.json({ success: true, chat: mappedChat, alreadyExists: true });
        }

        // Create new secret chat
        const chat = await (prisma as any).chat.create({
            data: {
                isSecret: true,
                isGroup: false,
                settings: { secure: true },
                participants: {
                    create: [
                        { userId: userId, role: 'MEMBER', status: 'JOINED' },
                        { userId: targetUserId, role: 'MEMBER', status: 'INVITED' }
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, displayName: true, avatar: true }
                        }
                    }
                }
            }
        });

        const mappedChat = {
            id: chat.id,
            name: chat.name || chat.participants.find((p: any) => p.userId !== userId)?.user.displayName || 'Secret Chat',
            avatar: chat.participants.find((p: any) => p.userId !== userId)?.user.avatar,
            lastMessage: '',
            lastMessageTime: 'Recent',
            isGroup: false,
            isSecret: true,
            unreadCount: 0,
            selfDestructTimer: chat.selfDestructTimer,
            participantIds: chat.participants.map((p: any) => p.userId),
            isMuted: false,
            myStatus: 'JOINED',
            myRole: 'MEMBER'
        };

        res.json({ success: true, chat: mappedChat });
    } catch (e: any) {
        console.error('[ChatRoutes] Secret Chat Request Error:', e);
        res.status(500).json({ error: e.message || 'Secret chat request failed' });
    }
});

// Accept or Decline a Secret Chat request
router.post('/secret/handle', async (req: any, res: any) => {
    const userId = req.user.id;
    const { chatId, action } = req.body; // action: 'accept' or 'decline'
    if (!chatId || !action) return res.status(400).json({ error: 'chatId and action required' });

    try {
        const participant = await (prisma as any).chatParticipant.findFirst({
            where: { chatId, userId }
        });

        if (!participant) {
            return res.status(404).json({ error: 'Secret chat invitation not found' });
        }

        if (action === 'accept') {
            await (prisma as any).chatParticipant.update({
                where: { id: participant.id },
                data: { status: 'JOINED' }
            });
            return res.json({ success: true, status: 'JOINED' });
        } else {
            // Delete the chat entirely since a secret chat request was declined
            await (prisma as any).chat.delete({
                where: { id: chatId }
            });
            return res.json({ success: true, status: 'DECLINED' });
        }
    } catch (e: any) {
        console.error('[ChatRoutes] Secret Chat Handle Error:', e);
        res.status(500).json({ error: e.message || 'Failed to handle secret chat request' });
    }
});

export default router;
