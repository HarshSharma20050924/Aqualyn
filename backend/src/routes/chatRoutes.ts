import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

router.use(verifyFirebaseToken);

// Get user chats
router.get('/', async (req: any, res: any) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const chats = await (prisma as any).chat.findMany({
            where: {
                participants: {
                    some: { userId: user.id }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatar: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Filter out chats deleted oleh user
        const activeChats = chats.filter((c: any) => {
            const deletedFor = c.deletedFor as any || [];
            return !deletedFor.includes(user.id);
        });

        // Map it to frontend expectations
        const mappedChats = await Promise.all(activeChats.map(async (c: any) => {
            const otherParticipant = c.participants.find((p: any) => p.userId !== user.id);
            const unreadCount = await (prisma as any).message.count({
                where: {
                    chatId: c.id,
                    isRead: false,
                    senderId: { not: user.id }
                }
            });

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
                unreadCount,
                selfDestructTimer: c.selfDestructTimer,
                participantIds: c.participants.map((p: any) => p.userId)
            };
        }));

        res.json(mappedChats);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get chat messages
router.get('/:chatId/messages', async (req: any, res: any) => {
    try {
        const { chatId } = req.params;
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const messages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            take: 100
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
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

export default router;
