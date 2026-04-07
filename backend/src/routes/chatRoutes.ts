import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

router.use(verifyFirebaseToken);

// Get user chats
router.get('/', async (req: any, res: any) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const chats = await (prisma as any).chat.findMany({
            where: {
                participants: { some: { userId: user.id } }
            },
            select: {
                id: true, name: true, isGroup: true, isSecret: true,
                avatar: true, deletedFor: true, updatedAt: true,
                selfDestructTimer: true,
                participants: {
                    select: {
                        userId: true,
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
                senderId: { not: user.id }
            },
            _count: { id: true }
        });

        const countsMap = new Map(unreadCounts.map((item: any) => [item.chatId, item._count.id]));

        // Filter and Map
        const activeChats = chats.filter((c: any) => {
            const deletedFor = c.deletedFor as any || [];
            return !deletedFor.includes(user.id);
        });

        const mappedChats = activeChats.map((c: any) => {
            const otherParticipant = c.participants.find((p: any) => p.userId !== user.id);
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
                participantIds: c.participants.map((p: any) => p.userId)
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
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

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
                return !deletedFor.includes(user.id);
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

export default router;
