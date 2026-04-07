import { Server, Socket } from 'socket.io';
import { PresenceService } from './PresenceService';
import prisma from '../config/prisma';
import { notificationQueue } from '../config/queues';

/**
 * SocketService handles the distributed real-time communication for Aqualyn.
 * It is responsible for message delivery, user presence, and real-time state sync.
 */
export class SocketService {
    private static io: Server;

    /**
     * Initializes the Socket.io instance with the provided server.
     */
    static init(io: Server) {
        this.io = io;
        this.io.on('connection', (socket) => this.handleConnection(socket));
        
        // Listen for Global Distributed Logout events
        this.setupAuthSubscriptions();
        
        console.log('[Socket] SocketService Initialized');
    }

    /**
     * Listens for distributed logout signals across all server nodes.
     */
    private static setupAuthSubscriptions() {
        const { subClient } = require('../config/redis');
        subClient.subscribe('GLOBAL_LOGOUT', (err: any) => {
            if (err) console.error('[Socket] Redis Global Logout Sub Error:', err);
        });

        subClient.subscribe('SOCIAL_STORY_UPDATE', (err: any) => {
            if (err) console.error('[Socket] Redis Social Sub Error:', err);
        });

        subClient.on('message', (channel: string, message: string) => {
            if (channel === 'GLOBAL_LOGOUT') {
                const { userId } = JSON.parse(message);
                this.disconnectUser(userId);
            }

            if (channel === 'SOCIAL_STORY_UPDATE') {
                const { userId, storyId, followerIds } = JSON.parse(message);
                // Broadcast to every follower's room on this specific node
                for (const followerId of followerIds) {
                    this.io.to(followerId).emit('receive_new_story', { 
                        userId, 
                        storyId,
                        timestamp: new Date()
                    });
                }
            }
        });
    }

    /**
     * Finds and kills all active socket connections for a specific user.
     */
    private static disconnectUser(userId: string) {
        const userRoom = this.io.sockets.adapter.rooms.get(userId);
        if (userRoom) {
            for (const socketId of userRoom) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    console.log(`[Socket] Killing session for user: ${userId}`);
                    socket.emit('force_logout', { message: 'Session revoked globally' });
                    socket.disconnect(true);
                }
            }
        }
    }

    /**
     * Entry point for every new socket connection.
     */
    private static handleConnection(socket: Socket) {
        console.log(`[Socket] Connection established: ${socket.id}`);

        socket.on('join', async (userId: string) => {
            console.log(`[Socket] User ${userId} joined room`);
            socket.join(userId);
            // Mark online and update the DB timestamp
            await PresenceService.setUserOnline(userId);
            await prisma.user.update({ where: { id: userId }, data: { lastLogin: new Date() } });
        });

        socket.on('heartbeat', async (userId: string) => {
            // Regularly update Redis TTL to keep user "Online"
            await PresenceService.heartbeat(userId);
        });

        socket.on('disconnecting', async () => {
            const userRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
            for (const userId of userRooms) {
                await PresenceService.setUserOffline(userId);
                // Last Seen persistence
                await prisma.user.update({ where: { id: userId }, data: { lastLogin: new Date() } });
                console.log(`[Socket] User ${userId} disconnected. Presence saved.`);
            }
        });

        // Delegate specific events to handlers
        socket.on('send_message', (data) => this.handleSendMessage(socket, data));
        socket.on('typing', (data) => this.handleTyping(socket, data));
        socket.on('mark_as_read', (data) => this.handleMarkAsRead(socket, data));
        socket.on('react_message', (data) => this.handleReactMessage(socket, data));
        socket.on('edit_message', (data) => this.handleEditMessage(socket, data));
        socket.on('delete_message_for_everyone', (data) => this.handleDeleteMessageForEveryone(socket, data));
        socket.on('delete_chat_for_me', (data) => this.handleDeleteChatForMe(socket, data));
        socket.on('delete_message_for_me', (data) => this.handleDeleteMessageForMe(socket, data));
        socket.on('delete_chat_for_everyone', (data) => this.handleDeleteChatForEveryone(socket, data));
        socket.on('invite_to_chat', (data) => this.handleInviteToChat(socket, data));
    }

    private static async handleSendMessage(socket: Socket, data: any) {
        const { senderId, receiverId, chatId, text, imageUrl, videoUrl } = data;
        
        try {
            let chat = await (prisma as any).chat.findUnique({ where: { id: chatId } });
            if (!chat) {
                chat = await (prisma as any).chat.create({
                    data: {
                        id: chatId,
                        isSecret: data.isSecret || false,
                        participants: { create: [{ userId: senderId }, { userId: receiverId }] }
                    }
                });
            } else {
                let deletedFor = [ ...(chat.deletedFor as any || []) ];
                if (deletedFor.includes(senderId)) {
                    deletedFor = deletedFor.filter((id: string) => id !== senderId);
                    await (prisma as any).chat.update({ where: { id: chatId }, data: { deletedFor } });
                }
            }

            const message = await (prisma as any).message.create({
                data: {
                    senderId, chatId, text,
                    imageUrl: data.imageUrl || null,
                    videoUrl: data.videoUrl || null,
                    fileUrl: data.fileUrl || null,
                    audioUrl: data.audioUrl || null,
                    gifUrl: data.gifUrl || null,
                    sharedPostId: data.sharedPostId || null,
                    sharedStoryId: data.sharedStoryId || null,
                    isForwarded: data.isForwarded || false,
                    isHD: data.isHD || false,
                    fileName: data.fileName || null,
                    fileSize: data.fileSize || null,
                    mimeType: data.mimeType || null,
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

            // 🟢 DISTRIBUTED MENTION LOGIC (Run in background)
            if (text) {
                const { ContentService } = require('./ContentService');
                ContentService.handleChatMentions(senderId, chatId, text).catch((e: any) => 
                    console.error('[SocketService] Mention Error:', e)
                );
            }

            const sender = await (prisma as any).user.findUnique({
                where: { id: senderId },
                select: { displayName: true, avatar: true, username: true }
            });

            const recipientStatus = await PresenceService.getUserStatus(receiverId);
            if (recipientStatus === 'online') {
                await (prisma as any).message.update({ where: { id: message.id }, data: { status: 'delivered' } });
                message.status = 'delivered';
            }

            this.io.to(receiverId).emit('receive_message', {
                ...message,
                sender: sender,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            socket.emit('message_sent_ack', {
                ...message,
                sender: sender,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            // 5. Distributed Push Notification (Background)
            // We offload this to the Queue so the Socket response is instant
            await notificationQueue.add('send-push', { 
                userId: receiverId, 
                senderId, 
                chatId, 
                text: text || 'Sent a media file' 
            });

        } catch (e: any) {
            console.error('[SocketService] ERROR in send_message:', e.message || e);
        }
    }

    private static handleTyping(socket: Socket, data: any) {
        this.io.to(data.receiverId).emit('user_typing', data);
    }

    private static async handleMarkAsRead(socket: Socket, data: any) {
        const { chatId, userId } = data;
        try {
            await (prisma as any).message.updateMany({
                where: { chatId, senderId: { not: userId }, status: { not: 'seen' } },
                data: { isRead: true, status: 'seen' }
            });
            
            const chat = await (prisma as any).chat.findUnique({
                where: { id: chatId },
                include: { participants: true }
            });
            const otherParticipant = chat?.participants.find((p: any) => p.userId !== userId);
            if (otherParticipant) {
                this.io.to(otherParticipant.userId).emit('messages_seen', { chatId, userId });
            }
        } catch (e) {
            console.error('[SocketService] Mark as read error:', e);
        }
    }

    private static async handleReactMessage(socket: Socket, data: any) {
        const { messageId, emoji, userId, receiverId } = data;
        try {
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
                await (prisma as any).message.update({ where: { id: messageId }, data: { reactions } });
                this.io.to(receiverId).emit('message_reacted', { chatId: message.chatId, messageId, emoji, userId });
            }
        } catch (e) { console.error('Reaction error:', e); }
    }

    private static async handleEditMessage(socket: Socket, data: any) {
        const { messageId, newText, receiverId } = data;
        try {
            const message = await (prisma as any).message.update({ where: { id: messageId }, data: { text: newText, isEdited: true } });
            this.io.to(receiverId).emit('message_edited', { chatId: message.chatId, messageId, newText });
        } catch (e) { console.error('Edit error:', e); }
    }

    private static async handleDeleteMessageForEveryone(socket: Socket, data: any) {
        const { chatId, messageId, receiverId } = data;
        try {
            await (prisma as any).message.delete({ where: { id: messageId } });
            this.io.to(receiverId).emit('message_deleted', { chatId, messageId });
        } catch (e) { console.error('Delete error:', e); }
    }

    private static async handleDeleteChatForMe(socket: Socket, data: any) {
        const { chatId, userId } = data;
        try {
            const chat = await (prisma as any).chat.findUnique({ where: { id: chatId } });
            if (chat) {
                const deletedFor = [ ...(chat.deletedFor as any || []) ];
                if (!deletedFor.includes(userId)) deletedFor.push(userId);
                await (prisma as any).chat.update({ where: { id: chatId }, data: { deletedFor } });
            }
        } catch (e) { console.error('Delete chat error:', e); }
    }

    private static async handleDeleteMessageForMe(socket: Socket, data: any) {
        const { messageId, userId } = data;
        try {
            const message = await (prisma as any).message.findUnique({ where: { id: messageId } });
            if (message) {
                const deletedFor = [ ...(message.deletedFor as any || []) ];
                if (!deletedFor.includes(userId)) deletedFor.push(userId);
                await (prisma as any).message.update({ where: { id: messageId }, data: { deletedFor } });
            }
        } catch (e) { console.error('Delete for me error:', e); }
    }

    private static async handleDeleteChatForEveryone(socket: Socket, data: any) {
        const { chatId, receiverId } = data;
        try {
            await (prisma as any).chat.delete({ where: { id: chatId } });
            this.io.to(receiverId).emit('chat_deleted', { chatId });
        } catch (e) { console.error('Delete for everyone error:', e); }
    }

    private static async handleInviteToChat(socket: Socket, data: any) {
        const { chatId, targetUserId, inviterId } = data;
        try {
            const inviter = await (prisma as any).user.findUnique({ where: { id: inviterId } });
            this.io.to(targetUserId).emit('chat_invitation', { 
                chatId, inviterId, inviterName: inviter?.displayName || inviter?.username || 'Someone' 
            });
        } catch (e) { console.error('Invite error:', e); }
    }
}
