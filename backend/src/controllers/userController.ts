import { Request, Response } from 'express';
import { io } from '../server';
import prisma from '../config/prisma';

export const followUser = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        const { targetUserId } = req.body;

        const currentUser = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!currentUser) return res.status(404).json({ error: 'User not found' });
        if (currentUser.id === targetUserId) return res.status(400).json({ error: 'Cannot follow yourself' });

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });

        if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

        if (targetUser.isPrivate) {
            // Create follow request
            await (prisma as any).followRequest.upsert({
                where: {
                    senderId_receiverId: {
                        senderId: currentUser.id,
                        receiverId: targetUserId
                    }
                },
                update: { status: 'pending' },
                create: {
                    senderId: currentUser.id,
                    receiverId: targetUserId
                }
            });

            // Create notification for target user
            const notification = await (prisma as any).notification.create({
                data: {
                    userId: targetUserId,
                    actorId: currentUser.id,
                    type: 'follow_request',
                    text: `${currentUser.displayName || (currentUser as any).username} requested to follow you.`
                },
                include: { actor: true }
            });

            // Real-time emit
            io.to(targetUserId).emit('new_notification', notification);

            return res.json({ status: 'requested' });
        } else {
            // Direct follow
            await (prisma as any).userFollows.upsert({
                where: {
                    followerId_followingId: {
                        followerId: currentUser.id,
                        followingId: targetUserId
                    }
                },
                update: {},
                create: {
                    followerId: currentUser.id,
                    followingId: targetUserId
                }
            });

             // Create notification for target user
             const notification = await (prisma as any).notification.create({
                data: {
                    userId: targetUserId,
                    actorId: currentUser.id,
                    type: 'follow',
                    text: `${currentUser.displayName || (currentUser as any).username} started following you.`
                },
                include: { actor: true }
            });

            // Real-time emit
            io.to(targetUserId).emit('new_notification', notification);

            return res.json({ status: 'following' });
        }
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const unfollowUser = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        const { targetUserId } = req.body;

        const currentUser = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        await (prisma as any).userFollows.deleteMany({
            where: {
                followerId: currentUser.id,
                followingId: targetUserId
            }
        });

        // Also delete any pending follow requests
        await (prisma as any).followRequest.deleteMany({
            where: {
                senderId: currentUser.id,
                receiverId: targetUserId
            }
        });

        res.json({ status: 'unfollowed' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const handleFollowRequest = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        const { requestId, senderId, action } = req.body; // action: 'accept' or 'reject'

        const currentUser = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        let request;
        if (requestId) {
            request = await (prisma as any).followRequest.findUnique({
                where: { id: requestId }
            });
        } else if (senderId) {
            request = await (prisma as any).followRequest.findFirst({
                where: { 
                    senderId: senderId, 
                    receiverId: currentUser.id,
                    status: 'pending'
                }
            });
        }

        if (!request || request.receiverId !== currentUser.id) {
            return res.status(404).json({ error: 'Follow request not found' });
        }

        if (action === 'accept') {
            await (prisma as any).userFollows.upsert({
                where: {
                    followerId_followingId: {
                        followerId: request.senderId,
                        followingId: currentUser.id
                    }
                },
                update: {},
                create: {
                    followerId: request.senderId,
                    followingId: currentUser.id
                }
            });

            await (prisma as any).followRequest.update({
                where: { id: requestId },
                data: { status: 'accepted' }
            });

            // Notify the sender
            const notification = await (prisma as any).notification.create({
                data: {
                    userId: request.senderId,
                    actorId: currentUser.id,
                    type: 'follow_accept',
                    text: `${currentUser.displayName || (currentUser as any).username} accepted your follow request.`
                },
                include: { actor: true }
            });

            // Real-time emit
            io.to(request.senderId).emit('new_notification', notification);
        } else {
            await (prisma as any).followRequest.update({
                where: { id: requestId },
                data: { status: 'rejected' }
            });
        }

        res.json({ status: action + 'ed' });
    } catch (error) {
        console.error('Handle follow request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        
        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const notifications = await (prisma as any).notification.findMany({
            where: { userId: user.id },
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        await (prisma as any).notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true }
        });

        res.json({ status: 'success' });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
