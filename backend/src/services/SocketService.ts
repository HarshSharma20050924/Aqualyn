import { Server, Socket } from 'socket.io';
import { PresenceService } from './PresenceService';
import prisma from '../config/prisma';
import { notificationQueue } from '../config/queues';
import { subClient, pubClient } from '../config/redis';
import { ActivityService } from './ActivityService';
import { ContentService } from './ContentService';
import { AIService } from '../modules/ai/ai.service';

/**
 * SocketService handles the distributed real-time communication for Aqualyn.
 * It is responsible for message delivery, user presence, and real-time state sync.
 */
export class SocketService {
    private static io: Server;

    static emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
        }
    }

    /**
     * Initializes the Socket.io instance with the provided server.
     */
    static init(io: Server) {
        this.io = io;
        this.io.on('connection', (socket: Socket) => this.handleConnection(socket));
        
        // Listen for Global Distributed Logout events
        this.setupAuthSubscriptions();
        
        console.log('[Socket] SocketService Initialized');
    }

    /**
     * Listens for distributed logout signals across all server nodes.
     */
    private static setupAuthSubscriptions() {
        subClient.subscribe('GLOBAL_LOGOUT', (err: any) => {
            if (err) console.error('[Socket] Redis Global Logout Sub Error:', err);
        });

        subClient.subscribe('SOCIAL_STORY_UPDATE', (err: any) => {
            if (err) console.error('[Socket] Redis Social Sub Error:', err);
        });

        subClient.subscribe('BROADCAST_ACTIVITY', (err: any) => {
            if (err) console.error('[Socket] Redis Broadcast Activity Error:', err);
        });

        subClient.subscribe('SOCIAL_POST_UPDATE', (err: any) => {
            if (err) console.error('[Socket] Redis Social Post Sub Error:', err);
        });

        subClient.subscribe('SOCIAL_LIKE_UPDATE', (err: any) => {
            if (err) console.error('[Socket] Redis Social Like Sub Error:', err);
        });

        subClient.subscribe('SOCIAL_COMMENT_UPDATE', (err: any) => {
            if (err) console.error('[Socket] Redis Social Comment Sub Error:', err);
        });

        subClient.on('message', (channel: string, message: string) => {
            if (channel === 'GLOBAL_LOGOUT') {
                const { userId } = JSON.parse(message);
                this.disconnectUser(userId);
            }

            if (channel === 'SOCIAL_STORY_UPDATE') {
                const { userId, storyId, story, followerIds } = JSON.parse(message);
                // Broadcast to every follower's room on this specific node
                for (const followerId of followerIds) {
                    this.io.to(followerId).emit('receive_new_story', { 
                        userId, 
                        storyId,
                        story,
                        timestamp: new Date()
                    });
                }
            }

            if (channel === 'SOCIAL_POST_UPDATE') {
                const { userId, postId, post, followerIds } = JSON.parse(message);
                for (const followerId of followerIds) {
                    this.io.to(followerId).emit('receive_new_post', { 
                        userId, 
                        postId,
                        post,
                        timestamp: new Date()
                    });
                }
            }

            if (channel === 'BROADCAST_ACTIVITY') {
                const { userId, activity } = JSON.parse(message);
                this.io.to(userId).emit('new_notification', activity);
            }

            if (channel === 'SOCIAL_LIKE_UPDATE') {
                const { userId, postId, liked } = JSON.parse(message);
                // In production, we'd typically broadcast this to all online followers or just the author
                // For simplicity, we broadcast to the author's room which everyone interested in their feed should listen to?
                // Actually, emitting specifically to followers or the target post's room is better.
                // For now, let's broadcast globally or to people currently viewed room.
                this.io.emit('receive_post_like', { userId, postId, liked });
            }

            if (channel === 'SOCIAL_COMMENT_UPDATE') {
                const { userId, postId, comment } = JSON.parse(message);
                this.io.emit('receive_post_comment', { userId, postId, comment });
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
            if (!userId || userId === 'null' || userId === 'undefined') {
                console.warn(`[Socket] Attempted join with invalid userId: ${userId}`);
                return;
            }
            socket.data.userId = userId;
            socket.join(userId);
            console.log(`[Socket] User ${userId} joined room`);

            // Presence management
            await PresenceService.setUserOnline(userId);
            try {
                await (prisma as any).user.update({ where: { id: userId }, data: { lastLogin: new Date() } });
                // Mark undelivered messages as delivered since user is now online
                const undeliveredMessages = await (prisma as any).message.findMany({
                    where: { 
                        chat: {
                            participants: {
                                some: { userId: userId }
                            }
                        },
                        senderId: { not: userId },
                        status: 'sent' 
                    },
                    select: { id: true, senderId: true, chatId: true }
                });
                
                if (undeliveredMessages.length > 0) {
                    await (prisma as any).message.updateMany({
                        where: { id: { in: undeliveredMessages.map((m: any) => m.id) } },
                        data: { status: 'delivered' }
                    });
                    
                    // Notify senders
                    for (const msg of undeliveredMessages) {
                        SocketService.emitToUser(msg.senderId, 'message_delivered', { messageId: msg.id, chatId: msg.chatId });
                    }
                }
            } catch (e) {
                console.error(`[Socket] Failed to update presence/delivery for ${userId}:`, e);
            }
        });

        socket.on('heartbeat', async (userId: string) => {
            // Regularly update Redis TTL to keep user "Online"
            await PresenceService.heartbeat(userId);
        });

        socket.on('disconnecting', async () => {
            const userId = socket.data.userId;
            if (userId && userId !== 'null' && userId !== 'undefined') {
                await PresenceService.setUserOffline(userId);
                // Last Seen persistence
                try {
                    await (prisma as any).user.update({ where: { id: userId }, data: { lastLogin: new Date() } });
                    console.log(`[Socket] User ${userId} disconnected. Presence saved.`);
                } catch (e) {
                    console.error(`[Socket] Failed to update disconnect presence for ${userId}:`, e);
                }
            }
        });

        // Delegate specific events to handlers
        socket.on('send_message', (data: any) => this.handleSendMessage(socket, data));
        socket.on('typing', (data: any) => this.handleTyping(socket, data));
        socket.on('mark_as_read', (data: any) => this.handleMarkAsRead(socket, data));
        socket.on('react_message', (data: any) => this.handleReactMessage(socket, data));
        socket.on('edit_message', (data: any) => this.handleEditMessage(socket, data));
        socket.on('delete_message_for_everyone', (data: any) => this.handleDeleteMessageForEveryone(socket, data));
        socket.on('delete_chat_for_me', (data: any) => this.handleDeleteChatForMe(socket, data));
        socket.on('delete_message_for_me', (data: any) => this.handleDeleteMessageForMe(socket, data));
        socket.on('delete_chat_for_everyone', (data: any) => this.handleDeleteChatForEveryone(socket, data));
        socket.on('invite_to_chat', (data: any) => this.handleInviteToChat(socket, data));

        // --- WebRTC Signaling with CallLog Persistence ---
        socket.on('call_user', async (data: any) => {
            try {
                // Create a CallLog entry when call is initiated
                const callLog = await (prisma as any).callLog.create({
                    data: {
                        callerId: data.from,
                        calleeId: data.to,
                        type: data.type || 'VOICE',
                        status: 'ringing'
                    }
                });
                // Forward call request to target user
                this.io.to(data.to).emit('incoming_call', {
                    from: data.from,
                    callerName: data.callerName,
                    callerAvatar: data.callerAvatar,
                    type: data.type,
                    signal: data.signal,
                    callLogId: callLog.id
                });
                // Also send the callLogId back to the caller
                socket.emit('call_log_created', { callLogId: callLog.id });
            } catch (e) {
                console.error('[Socket] call_user error:', e);
                this.io.to(data.to).emit('incoming_call', {
                    from: data.from,
                    callerName: data.callerName,
                    callerAvatar: data.callerAvatar,
                    type: data.type,
                    signal: data.signal
                });
            }
        });

        socket.on('call_accepted', async (data: any) => {
            this.io.to(data.to).emit('call_accepted', { signal: data.signal, answer: data.answer });
            // Update CallLog to active
            if (data.callLogId) {
                try {
                    await (prisma as any).callLog.update({
                        where: { id: data.callLogId },
                        data: { status: 'active' }
                    });
                } catch (e) { console.error('[Socket] call_accepted log error:', e); }
            }
        });

        socket.on('call_rejected', async (data: any) => {
            this.io.to(data.to).emit('call_rejected', { reason: data.reason });
            // Update CallLog to rejected
            if (data.callLogId) {
                try {
                    await (prisma as any).callLog.update({
                        where: { id: data.callLogId },
                        data: { status: 'rejected', endedAt: new Date() }
                    });
                } catch (e) { console.error('[Socket] call_rejected log error:', e); }
            }
        });

        socket.on('webrtc_signal', (data: any) => {
            this.io.to(data.to).emit('webrtc_signal', { signal: data.signal, from: data.from });
        });

        socket.on('end_call', async (data: any) => {
            this.io.to(data.to).emit('call_ended');
            // Update CallLog to ended with duration
            if (data.callLogId) {
                try {
                    const callLog = await (prisma as any).callLog.findUnique({ where: { id: data.callLogId } });
                    if (callLog) {
                        const duration = Math.floor((Date.now() - new Date(callLog.startedAt).getTime()) / 1000);
                        await (prisma as any).callLog.update({
                            where: { id: data.callLogId },
                            data: { status: 'ended', endedAt: new Date(), duration }
                        });
                    }
                } catch (e) { console.error('[Socket] end_call log error:', e); }
            }
        });
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
                ContentService.handleChatMentions(senderId, chatId, text).catch((e: any) => 
                    console.error('[SocketService] Mention Error:', e)
                );
            }

            // 🤖 LYN AI INTERCEPT — pass aiSettings (personality, enabled flag) from client
            if (text) {
                const aiSettings = data.aiSettings as { enabled?: boolean; personality?: string } | undefined;
                AIService.handleMessageAdded(chatId, senderId, text, aiSettings).catch((e: any) =>
                    console.error('[SocketService] Lyn AI Error:', e)
                );
            }

            const sender = await (prisma as any).user.findUnique({
                where: { id: senderId },
                select: { displayName: true, avatar: true, username: true }
            });

            const chatPayload = {
                id: chat.id,
                name: chat.name,
                avatar: chat.avatar,
                isGroup: chat.isGroup,
                isSecret: chat.isSecret
            };

            if (chat.isGroup) {
                const participants = await (prisma as any).chatParticipant.findMany({
                    where: { chatId },
                    select: { userId: true }
                });
                for (const p of participants) {
                    if (p.userId !== senderId) {
                        this.io.to(p.userId).emit('receive_message', {
                            ...message,
                            sender: sender,
                            chat: chatPayload,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        });
                    }
                }
            } else {
                const recipientStatus = await PresenceService.getUserStatus(receiverId);
                if (recipientStatus === 'online') {
                    await (prisma as any).message.update({ where: { id: message.id }, data: { status: 'delivered' } });
                    message.status = 'delivered';
                }

                this.io.to(receiverId).emit('receive_message', {
                    ...message,
                    sender: sender,
                    chat: chatPayload,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            }

            socket.emit('message_sent_ack', {
                ...message,
                sender: sender,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            // 🔵 Create Activity Notification
            const activity = await ActivityService.createActivity({
                userId: receiverId,
                actorId: senderId,
                type: 'direct_message',
                text: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'Sent a media file'
            });

            if (activity) {
                const activityWithActor = {
                    ...activity,
                    actor: sender
                };
                pubClient.publish('BROADCAST_ACTIVITY', JSON.stringify({ userId: receiverId, activity: activityWithActor }));
            }

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
