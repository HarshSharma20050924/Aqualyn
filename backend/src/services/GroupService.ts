import prisma from '../config/prisma';
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
                        // Create the owner first
                        { userId: ownerId, role: 'OWNER' },
                        // Add invited participants
                        ...participantIds.map(id => ({ userId: id, role: 'MEMBER' }))
                    ]
                }
            },
            include: {
                participants: true
            }
        });
    }

    /**
     * Join a group using an invite token.
     */
    static async joinByToken(userId: string, token: string) {
        const group = await (prisma as any).chat.findUnique({
            where: { inviteToken: token }
        });

        if (!group) throw new Error('Invalid invite link');
        if (!group.isGroup) throw new Error('This link is not for a group');

        return await (prisma as any).chatParticipant.upsert({
            where: { chatId_userId: { chatId: group.id, userId } },
            update: {}, // Already in? Do nothing
            create: { chatId: group.id, userId, role: 'MEMBER' }
        });
    }

    /**
     * Update Group Settings (RBAC Enforced).
     */
    static async updateSettings(userId: string, chatId: string, settings: any) {
        const participant = await (prisma as any).chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId } }
        });

        // 1. Permission Guard: Only Admins or Owners can update group info
        if (!participant || (participant.role !== 'ADMIN' && participant.role !== 'OWNER')) {
            throw new Error('Unauthorized: Only Admins can change group settings');
        }

        return await (prisma as any).chat.update({
            where: { id: chatId },
            data: { settings }
        });
    }

    /**
     * Role Management (Promote/Demote)
     */
    static async updateMemberRole(adminId: string, chatId: string, targetUserId: string, newRole: 'ADMIN' | 'MEMBER') {
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
    }
}
