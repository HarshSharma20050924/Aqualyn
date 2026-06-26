import prisma from '../../config/prisma';

export class ChannelService {

    static async listChannels(opts: {
        category?: string;
        type?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
        search?: string;
        discoverable?: boolean;
        limit?: number;
        cursor?: string;
    } = {}, userId?: string) {
        const { category, type, search, discoverable, limit = 30, cursor } = opts;

        const where: any = {
            ...(type && { type }),
            // If discoverable is explicitly passed, use it, otherwise don't filter out non-discoverable by default so they all show up
            ...(discoverable !== undefined && { isDiscoverable: discoverable }),
            ...(category && { category }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            }),
        };

        const channels = await (prisma as any).channel.findMany({
            where,
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
            include: {
                _count: { select: { members: true, posts: true } },
                ...(userId ? { members: { where: { userId } } } : {}),
            },
        });

        return channels.map((c: any) => ({
            ...c,
            memberCount: c._count?.members ?? c.memberCount,
            isJoined: userId ? (c.members && c.members.length > 0) : false,
        }));
    }

    static async getChannel(channelId: string, userId?: string) {
        const channel = await (prisma as any).channel.findUnique({
            where: { id: channelId },
            include: {
                _count: { select: { members: true, posts: true } },
                members: userId
                    ? { where: { userId }, select: { userId: true, role: true } }
                    : false,
            },
        });
        if (!channel) throw new Error('Channel not found');
        return {
            ...channel,
            memberCount: channel._count?.members ?? channel.memberCount,
            isJoined: userId ? channel.members?.length > 0 : false,
        };
    }

    static async createChannel(ownerId: string, data: {
        name: string;
        handle: string;
        description?: string;
        category?: string;
        type?: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
        isDiscoverable?: boolean;
    }) {
        if (!data.name || !data.handle) throw new Error('Name and handle are required');

        const existing = await (prisma as any).channel.findUnique({ where: { handle: data.handle } });
        if (existing) throw new Error('Handle already taken');

        const channel = await (prisma as any).channel.create({
            data: {
                ...data,
                ownerId,
                type: data.type ?? 'PUBLIC',
                isDiscoverable: data.isDiscoverable ?? true,
                memberCount: 1,
            },
        });

        // Add owner as first member with OWNER role
        await (prisma as any).channelMember.create({
            data: { channelId: channel.id, userId: ownerId, role: 'OWNER' },
        });

        return channel;
    }

    static async joinChannel(channelId: string, userId: string) {
        const channel = await (prisma as any).channel.findUnique({ where: { id: channelId } });
        if (!channel) throw new Error('Channel not found');
        if (channel.type === 'INVITE_ONLY') throw new Error('This channel is invite-only');

        const existing = await (prisma as any).channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (existing) return { alreadyMember: true };

        await (prisma as any).channelMember.create({
            data: { channelId, userId, role: 'MEMBER' },
        });
        await (prisma as any).channel.update({
            where: { id: channelId },
            data: { memberCount: { increment: 1 } },
        });

        return { joined: true };
    }

    static async leaveChannel(channelId: string, userId: string) {
        const member = await (prisma as any).channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });
        if (!member) throw new Error('Not a member');
        if (member.role === 'OWNER') throw new Error('Owner cannot leave; transfer ownership first');

        await (prisma as any).channelMember.delete({
            where: { channelId_userId: { channelId, userId } },
        });
        await (prisma as any).channel.update({
            where: { id: channelId },
            data: { memberCount: { decrement: 1 } },
        });

        return { left: true };
    }

    static async getChannelPosts(channelId: string, limit = 20, cursor?: string) {
        return (prisma as any).channelPost.findMany({
            where: { channelId },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            include: {
                channel: { select: { id: true, name: true, handle: true } },
            },
        });
    }

    static async createChannelPost(channelId: string, authorId: string, data: {
        content?: string;
        mediaUrl?: string;
        mediaType?: string;
    }) {
        const member = await (prisma as any).channelMember.findUnique({
            where: { channelId_userId: { channelId, userId: authorId } },
        });
        if (!member) throw new Error('Must be a member to post');

        const channel = await (prisma as any).channel.findUnique({
            where: { id: channelId },
            select: { settings: true },
        });
        const settings = (channel?.settings as any) || {};
        if (settings.postPermission === 'ADMIN_ONLY' && !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new Error('Only admins can post in this channel');
        }

        return (prisma as any).channelPost.create({
            data: { channelId, authorId, ...data },
        });
    }

    static async deleteChannel(channelId: string, userId: string) {
        const channel = await (prisma as any).channel.findUnique({ where: { id: channelId } });
        if (!channel) throw new Error('Channel not found');
        if (channel.ownerId !== userId) throw new Error('Only the owner can delete this channel');
        await (prisma as any).channel.delete({ where: { id: channelId } });
        return { deleted: true };
    }
}
