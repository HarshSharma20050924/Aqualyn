import prisma from '../../config/prisma';
import { io } from '../../server';
import { AppError } from '../../core/exceptions/AppError';

export class UserService {
    static async getProfile(userId: string) {
        const profile = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { 
                id: true, username: true, displayName: true,
                avatar: true, largeAvatar: true, bio: true, 
                isPrivate: true, lastLogin: true,
                invitationSettings: true,
                _count: { select: { followers: true, following: true } },
                followers: { select: { followerId: true } },
                following: { select: { followingId: true } }
            }
        });
        if (!profile) throw new AppError('Profile not found', 404);
        return profile;
    }

    static async blockUser(userId: string, targetUserId: string) {
        if (!targetUserId) throw new AppError('targetUserId required', 400);
        const existing = await (prisma as any).blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } }
        });
        if (existing) {
            await (prisma as any).blockedUser.delete({ where: { id: existing.id } });
            return { blocked: false, message: 'User unblocked' };
        } else {
            await (prisma as any).blockedUser.create({
                data: { blockerId: userId, blockedId: targetUserId }
            });
            return { blocked: true, message: 'User blocked' };
        }
    }

    static async reportUser(userId: string, targetUserId: string, reason: string) {
        if (!targetUserId) throw new AppError('targetUserId required', 400);
        await (prisma as any).report.create({
            data: { reporterId: userId, reportedId: targetUserId, reason: reason || null }
        });
        return { success: true, message: 'Report submitted' };
    }

    static async getBlockedUsers(userId: string) {
        const blocked = await (prisma as any).blockedUser.findMany({
            where: { blockerId: userId },
            select: { blockedId: true }
        });
        return blocked.map((b: any) => b.blockedId);
    }

    static async updatePrivacy(userId: string, data: any) {
        return await (prisma as any).user.update({
            where: { id: userId },
            data: {
                invitationSettings: data.invitationSettings !== undefined ? data.invitationSettings : undefined,
                showPhoneTo: data.showPhoneTo !== undefined ? data.showPhoneTo : undefined,
                searchByPhone: data.searchByPhone !== undefined ? data.searchByPhone : undefined,
                isPrivate: data.isPrivate !== undefined ? data.isPrivate : undefined
            }
        });
    }

    static async uploadAvatar(userId: string, avatar: string) {
        if (!avatar) throw new AppError('Avatar data required', 400);
        const updated = await (prisma as any).user.update({
            where: { id: userId },
            data: { avatar }
        });
        return { success: true, avatar: updated.avatar };
    }

    static async syncContacts(userId: string, phones: string[]) {
        if (!phones || !Array.isArray(phones)) throw new AppError('Phones array required', 400);
        return await (prisma as any).user.findMany({
            where: {
                phone: { in: phones },
                searchByPhone: true,
                ...(userId ? { NOT: { id: userId } } : {})
            },
            select: {
                id: true, username: true, displayName: true,
                avatar: true, phone: true
            }
        });
    }

    static async getCallHistory(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const calls = await (prisma as any).callLog.findMany({
            where: { OR: [{ callerId: userId }, { calleeId: userId }] },
            orderBy: { startedAt: 'desc' },
            skip,
            take: limit,
            include: {
                caller: { select: { id: true, displayName: true, username: true, avatar: true } },
                callee: { select: { id: true, displayName: true, username: true, avatar: true } }
            }
        });
        const total = await (prisma as any).callLog.count({
            where: { OR: [{ callerId: userId }, { calleeId: userId }] }
        });
        return { calls, total, page, limit };
    }

    static async setPin(userId: string, pin: string) {
        if (!pin) throw new AppError('PIN required', 400);
        await (prisma as any).user.update({
            where: { id: userId },
            data: { appLockPin: pin }
        });
        return { success: true, message: 'PIN set successfully' };
    }

    static async verifyPin(userId: string, pin: string) {
        if (!pin) throw new AppError('PIN required', 400);
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { appLockPin: true }
        });
        if (!user || user.appLockPin !== pin) {
            throw new AppError('Invalid PIN', 401);
        }
        return { success: true, message: 'PIN verified' };
    }

    static async followUser(currentUserId: string, targetUserId: string) {
        if (!targetUserId) throw new AppError('targetUserId required', 400);
        if (currentUserId === targetUserId) throw new AppError('Cannot follow yourself', 400);

        const currentUser = await (prisma as any).user.findUnique({ where: { id: currentUserId } });
        if (!currentUser) throw new AppError('User not found', 404);

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new AppError('Target user not found', 404);

        if (targetUser.isPrivate) {
            await (prisma as any).followRequest.upsert({
                where: { senderId_receiverId: { senderId: currentUserId, receiverId: targetUserId } },
                update: { status: 'pending' },
                create: { senderId: currentUserId, receiverId: targetUserId }
            });
            const notification = await (prisma as any).notification.create({
                data: {
                    userId: targetUserId,
                    actorId: currentUserId,
                    type: 'follow_request',
                    text: `${currentUser.displayName || (currentUser as any).username} requested to follow you.`
                },
                include: { actor: true }
            });
            io.to(targetUserId).emit('new_notification', notification);
            return { status: 'requested' };
        } else {
            await (prisma as any).userFollows.upsert({
                where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
                update: {},
                create: { followerId: currentUserId, followingId: targetUserId }
            });
            const notification = await (prisma as any).notification.create({
                data: {
                    userId: targetUserId,
                    actorId: currentUserId,
                    type: 'follow',
                    text: `${currentUser.displayName || (currentUser as any).username} started following you.`
                },
                include: { actor: true }
            });
            io.to(targetUserId).emit('new_notification', notification);
            return { status: 'following' };
        }
    }

    static async unfollowUser(currentUserId: string, targetUserId: string) {
        if (!targetUserId) throw new AppError('targetUserId required', 400);
        await (prisma as any).userFollows.deleteMany({
            where: { followerId: currentUserId, followingId: targetUserId }
        });
        await (prisma as any).followRequest.deleteMany({
            where: { senderId: currentUserId, receiverId: targetUserId }
        });
        return { status: 'unfollowed' };
    }

    static async handleFollowRequest(currentUserId: string, requestId?: string, senderId?: string, action?: string) {
        if (!action) throw new AppError('action required', 400);
        const currentUser = await (prisma as any).user.findUnique({ where: { id: currentUserId } });
        if (!currentUser) throw new AppError('User not found', 404);

        let request;
        if (requestId) {
            request = await (prisma as any).followRequest.findUnique({ where: { id: requestId } });
        } else if (senderId) {
            request = await (prisma as any).followRequest.findFirst({
                where: { senderId: senderId, receiverId: currentUserId, status: 'pending' }
            });
        }

        if (!request || request.receiverId !== currentUserId) {
            throw new AppError('Follow request not found', 404);
        }

        if (action === 'accept') {
            await (prisma as any).userFollows.upsert({
                where: { followerId_followingId: { followerId: request.senderId, followingId: currentUserId } },
                update: {},
                create: { followerId: request.senderId, followingId: currentUserId }
            });
            await (prisma as any).followRequest.update({
                where: { id: request.id },
                data: { status: 'accepted' }
            });
            const notification = await (prisma as any).notification.create({
                data: {
                    userId: request.senderId,
                    actorId: currentUserId,
                    type: 'follow_accept',
                    text: `${currentUser.displayName || (currentUser as any).username} accepted your follow request.`
                },
                include: { actor: true }
            });
            io.to(request.senderId).emit('new_notification', notification);
        } else {
            await (prisma as any).followRequest.update({
                where: { id: request.id },
                data: { status: 'rejected' }
            });
        }
        return { status: action + 'ed' };
    }

    static async getNotifications(userId: string) {
        return await (prisma as any).notification.findMany({
            where: { userId },
            include: {
                actor: { select: { id: true, username: true, displayName: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    static async markNotificationsRead(userId: string) {
        await (prisma as any).notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        return { status: 'success' };
    }

    static async getFollowersList(userId: string) {
        const followers = await (prisma as any).userFollows.findMany({
            where: { followingId: userId },
            include: {
                follower: { select: { id: true, username: true, displayName: true, avatar: true, bio: true } }
            }
        });
        return followers.map((f: any) => f.follower);
    }

    static async getFollowingList(userId: string) {
        const following = await (prisma as any).userFollows.findMany({
            where: { followerId: userId },
            include: {
                following: { select: { id: true, username: true, displayName: true, avatar: true, bio: true } }
            }
        });
        return following.map((f: any) => f.following);
    }

    static async startCall(callerId: string, calleeId: string, type: string) {
        if (!calleeId) throw new AppError('calleeId required', 400);
        if (!type || !['VOICE', 'VIDEO'].includes(type)) throw new AppError('type must be VOICE or VIDEO', 400);

        const callee = await prisma.user.findUnique({ where: { id: calleeId } });
        if (!callee) throw new AppError('Callee not found', 404);

        const roomId = `call_${callerId}_${calleeId}_${Date.now()}`;

        const call = await (prisma as any).callLog.create({
            data: {
                callerId,
                calleeId,
                type,
                status: 'initiated',
                roomId
            },
            include: {
                caller: { select: { id: true, displayName: true, username: true, avatar: true } },
                callee: { select: { id: true, displayName: true, username: true, avatar: true } }
            }
        });

        // Notify the callee via Socket
        io.to(calleeId).emit('incoming_call', call);

        return call;
    }

    static async endCall(userId: string, callId: string, status?: string) {
        if (!callId) throw new AppError('callId required', 400);

        const call = await (prisma as any).callLog.findUnique({ where: { id: callId } });
        if (!call) throw new AppError('Call not found', 404);
        if (call.callerId !== userId && call.calleeId !== userId) {
            throw new AppError('Not a participant in this call', 403);
        }

        const endedAt = new Date();
        const duration = Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000);

        const updated = await (prisma as any).callLog.update({
            where: { id: callId },
            data: {
                status: status || 'ended',
                endedAt,
                duration
            },
            include: {
                caller: { select: { id: true, displayName: true, username: true, avatar: true } },
                callee: { select: { id: true, displayName: true, username: true, avatar: true } }
            }
        });

        // Notify the other participant
        const otherUserId = userId === call.callerId ? call.calleeId : call.callerId;
        io.to(otherUserId).emit('call_ended', updated);

        return updated;
    }

    static async getActivityFeed(userId: string, cursor?: string, limit: number = 20) {
        return await (prisma as any).activity.findMany({
            where: { userId },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                actor: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        });
    }

    static async markActivityRead(userId: string, activityIds: string[]) {
        if (!activityIds || !activityIds.length) throw new AppError('activityIds required', 400);
        await (prisma as any).activity.updateMany({
            where: { id: { in: activityIds }, userId },
            data: { isRead: true }
        });
        return { success: true };
    }
}
