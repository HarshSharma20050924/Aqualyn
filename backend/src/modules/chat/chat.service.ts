import prisma from '../../config/prisma';
import { SocketService } from '../../services/SocketService';
import { AppError } from '../../core/exceptions/AppError';

export class ChatService {
    static async getChats(userId: string) {
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
                        userId: true, role: true, status: true,
                        isArchived: true, isPinned: true,
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

        const mutedChats = await (prisma as any).mutedChat.findMany({
            where: { userId, chatId: { in: chats.map((c: any) => c.id) } },
            select: { chatId: true }
        });
        const mutedSet = new Set(mutedChats.map((m: any) => m.chatId));

        const activeChats = chats.filter((c: any) => {
            const deletedFor = c.deletedFor as any || [];
            return !deletedFor.includes(userId);
        });

        return activeChats.map((c: any) => {
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
                myRole: myParticipant?.role || 'MEMBER',
                isArchived: myParticipant?.isArchived || false,
                isPinned: myParticipant?.isPinned || false
            };
        });
    }

    static async getMessages(chatId: string, userId: string) {
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
                isEdited: true, isRead: true, isPinned: true, reactions: true,
                deletedFor: true, createdAt: true
            }
        });
        
        return messages
            .filter((m: any) => {
                const deletedFor = m.deletedFor as any || [];
                return !deletedFor.includes(userId);
            })
            .map((m: any) => ({
                ...m,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
    }

    static async sendMessage(userId: string, chatId: string, content: string, replyToId?: string) {
        const message = await (prisma as any).message.create({
            data: {
                text: content,
                senderId: userId,
                chatId: chatId,
                replyToId: replyToId
            }
        });
        
        return {
            ...message,
            timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }

    static async deleteMessage(userId: string, messageId: string) {
        const message = await (prisma as any).message.findUnique({
            where: { id: messageId }
        });
        
        if (!message) throw new AppError('Message not found', 404);
        
        const deletedFor = message.deletedFor || [];
        if (!deletedFor.includes(userId)) {
            deletedFor.push(userId);
            await (prisma as any).message.update({
                where: { id: messageId },
                data: { deletedFor }
            });
        }
        return { success: true };
    }

    static async updateReactions(messageId: string, userId: string, emoji: string) {
        const existing = await (prisma as any).messageReaction.findUnique({
            where: { messageId_userId_emoji: { messageId, userId, emoji } }
        });
        if (existing) {
            await (prisma as any).messageReaction.delete({ where: { id: existing.id } });
            return { added: false, emoji };
        } else {
            await (prisma as any).messageReaction.create({
                data: { messageId, userId, emoji }
            });
            return { added: true, emoji };
        }
    }

    static async toggleMuteChat(userId: string, chatId: string) {
        const existing = await (prisma as any).mutedChat.findUnique({
            where: { userId_chatId: { userId, chatId } }
        });
        if (existing) {
            await (prisma as any).mutedChat.delete({ where: { id: existing.id } });
            return { muted: false };
        } else {
            await (prisma as any).mutedChat.create({
                data: { userId, chatId }
            });
            return { muted: true };
        }
    }

    static async updateChatSettings(chatId: string, settings: any, selfDestructTimer?: number) {
        const chat = await (prisma as any).chat.findUnique({ 
            where: { id: chatId },
            include: { participants: true }
        });
        if (!chat) throw new AppError('Chat not found', 404);
        
        const updatedChat = await (prisma as any).chat.update({
            where: { id: chatId },
            data: {
                ...(settings !== undefined && { settings: { ...(chat.settings as object || {}), ...settings } }),
                ...(selfDestructTimer !== undefined && { selfDestructTimer })
            }
        });

        chat.participants.forEach((p: any) => {
            SocketService.emitToUser(p.userId, 'chat_updated', updatedChat);
        });

        return updatedChat;
    }

    static async getChatMedia(chatId: string) {
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
        
        return { images, videos, docs, audio, total: images + videos + docs + audio };
    }

    static async requestSecretChat(userId: string, targetUserId: string) {
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
                        user: { select: { id: true, username: true, displayName: true, avatar: true } }
                    }
                }
            }
        });

        if (existingSecret) {
            return {
                chat: {
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
                },
                alreadyExists: true
            };
        }

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
                        user: { select: { id: true, username: true, displayName: true, avatar: true } }
                    }
                }
            }
        });

        return {
            chat: {
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
            }
        };
    }

    static async handleSecretChat(userId: string, chatId: string, action: string) {
        const participant = await (prisma as any).chatParticipant.findFirst({
            where: { chatId, userId }
        });

        if (!participant) throw new AppError('Secret chat invitation not found', 404);

        if (action === 'accept') {
            await (prisma as any).chatParticipant.update({
                where: { id: participant.id },
                data: { status: 'JOINED' }
            });
            return { status: 'JOINED' };
        } else {
            await (prisma as any).chat.delete({
                where: { id: chatId }
            });
            return { status: 'DECLINED' };
        }
    }

    static async getFolders(userId: string) {
        return await (prisma as any).chatFolder.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
    }

    static async createFolder(userId: string, name: string, chatIds: string[]) {
        return await (prisma as any).chatFolder.create({
            data: { userId, name, chatIds: chatIds || [] }
        });
    }

    static async updateFolder(userId: string, folderId: string, name?: string, chatIds?: string[]) {
        const folder = await (prisma as any).chatFolder.findFirst({
            where: { id: folderId, userId }
        });
        if (!folder) throw new AppError('Folder not found', 404);
        
        return await (prisma as any).chatFolder.update({
            where: { id: folderId },
            data: { 
                name: name !== undefined ? name : folder.name, 
                chatIds: chatIds !== undefined ? chatIds : folder.chatIds 
            }
        });
    }

    static async deleteFolder(userId: string, folderId: string) {
        await (prisma as any).chatFolder.deleteMany({
            where: { id: folderId, userId }
        });
        return { success: true };
    }

    static async archiveChat(userId: string, chatId: string) {
        const participant = await (prisma as any).chatParticipant.findFirst({
            where: { chatId, userId }
        });
        if (!participant) throw new AppError('Chat not found', 404);
        
        const updated = await (prisma as any).chatParticipant.update({
            where: { id: participant.id },
            data: { isArchived: !participant.isArchived }
        });
        return { isArchived: updated.isArchived };
    }

    static async pinChat(userId: string, chatId: string) {
        const participant = await (prisma as any).chatParticipant.findFirst({
            where: { chatId, userId }
        });
        if (!participant) throw new AppError('Chat not found', 404);
        
        const updated = await (prisma as any).chatParticipant.update({
            where: { id: participant.id },
            data: { isPinned: !participant.isPinned }
        });
        return { isPinned: updated.isPinned };
    }

    static async pinMessage(chatId: string, messageId: string) {
        const message = await (prisma as any).message.findUnique({
            where: { id: messageId }
        });
        if (!message) throw new AppError('Message not found', 404);
        
        const updated = await (prisma as any).message.update({
            where: { id: messageId },
            data: { isPinned: !message.isPinned }
        });
        
        (SocketService as any).io.to(chatId).emit('message_pinned', { chatId, messageId, isPinned: updated.isPinned });
        
        return { isPinned: updated.isPinned };
    }
}
