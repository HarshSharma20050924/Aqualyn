import prisma from '../../config/prisma';
import crypto from 'crypto';

/**
 * GroupService manages the professional lifecycle of groups,
 * including roles, settings, and invite-link joining.
 */
export class GroupService {
    
    /**
     * Create a new professional group.
     */
    static async createGroup(ownerId: string, name: string, participantIds: string[], description?: string) {
        if (!ownerId || !name) throw new Error('Owner ID and Group Name are required');
        try {
            // Find owner's followings to see who is automatically joined
            const owner = await (prisma as any).user.findUnique({
                where: { id: ownerId },
                include: { following: true }
            });
            const followingIds = owner?.following.map((f: any) => f.followingId) || [];

            const inviteToken = crypto.randomBytes(8).toString('hex');
            return await (prisma as any).chat.create({
                data: {
                    name,
                    description,
                    isGroup: true,
                    inviteToken,
                    settings: { canMessage: 'everyone', canInvite: 'all' },
                    participants: {
                        create: [
                            { userId: ownerId, role: 'OWNER', status: 'JOINED' },
                            ...participantIds.filter(id => id !== ownerId).map(id => {
                                const isFollowing = followingIds.includes(id);
                                return {
                                    userId: id,
                                    role: 'MEMBER',
                                    status: isFollowing ? 'JOINED' : 'INVITED'
                                };
                            })
                        ]
                    }
                },
                include: { participants: true }
            });
        } catch (error) {
            console.error('[GroupService] createGroup failed:', error);
            throw new Error('Failed to create group');
        }
    }

    /**
     * Handle group invitation (accept or decline).
     */
    static async handleInvitation(userId: string, chatId: string, action: 'accept' | 'decline') {
        if (!userId || !chatId) throw new Error('Missing fields');
        try {
            if (action === 'accept') {
                return await (prisma as any).chatParticipant.update({
                    where: { chatId_userId: { chatId, userId } },
                    data: { status: 'JOINED' }
                });
            } else {
                return await (prisma as any).chatParticipant.delete({
                    where: { chatId_userId: { chatId, userId } }
                });
            }
        } catch (error) {
            console.error('[GroupService] handleInvitation failed:', error);
            throw error;
        }
    }

    static async joinByToken(userId: string, token: string) {
        if (!userId || !token) throw new Error('Missing user or token');
        try {
            const group = await (prisma as any).chat.findUnique({ where: { inviteToken: token } });
            if (!group) throw new Error('Invalid invite link');
            if (!group.isGroup) throw new Error('This link is not for a group');

            return await (prisma as any).chatParticipant.upsert({
                where: { chatId_userId: { chatId: group.id, userId } },
                update: {},
                create: { chatId: group.id, userId, role: 'MEMBER' }
            });
        } catch (error) {
            console.error('[GroupService] joinByToken failed:', error);
            throw error;
        }
    }

    static async updateSettings(userId: string, chatId: string, settings: any) {
        if (!userId || !chatId) throw new Error('Missing fields');
        try {
            const participant = await (prisma as any).chatParticipant.findUnique({
                where: { chatId_userId: { chatId, userId } }
            });
            if (!participant || (participant.role !== 'ADMIN' && participant.role !== 'OWNER')) {
                throw new Error('Unauthorized');
            }
            return await (prisma as any).chat.update({
                where: { id: chatId },
                data: { settings }
            });
        } catch (error) {
            console.error('[GroupService] updateSettings failed:', error);
            throw error;
        }
    }

    static async updateMemberRole(adminId: string, chatId: string, targetUserId: string, newRole: 'ADMIN' | 'MEMBER') {
        if (!adminId || !chatId || !targetUserId) throw new Error('Missing fields');
        try {
            const admin = await (prisma as any).chatParticipant.findUnique({
                where: { chatId_userId: { chatId, userId: adminId } }
            });
            if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'OWNER')) {
                throw new Error('Unauthorized');
            }
            return await (prisma as any).chatParticipant.update({
                where: { chatId_userId: { chatId, userId: targetUserId } },
                data: { role: newRole }
            });
        } catch (error) {
            console.error('[GroupService] updateMemberRole failed:', error);
            throw error;
        }
    }

    static async getFullGroupInfo(chatId: string) {
        const chat = await (prisma as any).chat.findUnique({
            where: { id: chatId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, displayName: true, avatar: true, bio: true }
                        }
                    }
                }
            }
        });
        if (!chat) throw new Error('Group not found');

        const messages = await (prisma as any).message.findMany({
            where: { chatId },
            select: { imageUrl: true, videoUrl: true, audioUrl: true, fileUrl: true, document: true }
        });
        
        let images = 0, videos = 0, docs = 0;
        for (const m of messages) {
            if (m.imageUrl) images++;
            if (m.videoUrl) videos++;
            if (m.fileUrl || m.document) docs++;
        }

        const admins = chat.participants.filter((p: any) => p.role === 'ADMIN' || p.role === 'OWNER');

        return {
            ...chat,
            settings: chat.settings || {},
            mediaCount: { images, videos, docs, total: images + videos + docs },
            adminCount: admins.length,
            participantCount: chat.participants.length
        };
    }

    static async leaveGroup(userId: string, chatId: string) {
        await (prisma as any).chatParticipant.deleteMany({
            where: { chatId, userId }
        });
        return { success: true };
    }
}
