import prisma from '../config/prisma';

/**
 * ActivityService handles the retrieval and management of social notifications
 * and interactions (Likes, Mentions, Follows).
 */
export class ActivityService {
    
    /**
     * Get the activity tab data for a user.
     * High-scale Ready: Uses Cursor Pagination.
     */
    static async getActivities(userId: string, cursor?: string, limit: number = 20) {
        if (!userId) return [];
        try {
            return await (prisma as any).activity.findMany({
                where: { userId },
                take: limit,
                ...(cursor && { skip: 1, cursor: { id: cursor } }),
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: { select: { id: true, username: true, displayName: true, avatar: true } }
                }
            });
        } catch (error) {
            console.error('[ActivityService] getActivities failed:', error);
            return [];
        }
    }

    static async markRead(userId: string, activityIds: string[]) {
        if (!userId || !activityIds.length) return;
        try {
            return await (prisma as any).activity.updateMany({
                where: { id: { in: activityIds }, userId },
                data: { isRead: true }
            });
        } catch (error) {
            console.error('[ActivityService] markRead failed:', error);
        }
    }

    static async createActivity(data: { userId: string, actorId: string, type: string, postId?: string, storyId?: string, text?: string }) {
        if (!data.userId || !data.actorId || data.userId === data.actorId) return;
        try {
            return await (prisma as any).activity.create({ data });
        } catch (error) {
            console.error('[ActivityService] createActivity failed:', error);
        }
    }
}

export class ForwardService {
    static async sharePostToChat(senderId: string, postId: string, chatId: string) {
        if (!senderId || !postId || !chatId) throw new Error('Missing sharing params');
        try {
            return await (prisma as any).message.create({
                data: { chatId, senderId, sharedPostId: postId, text: "Shared a post." }
            });
        } catch (error) {
            console.error('[ForwardService] sharePostToChat failed:', error);
            throw new Error('Failed to share post');
        }
    }

    static async shareStoryToChat(senderId: string, storyId: string, chatId: string) {
        if (!senderId || !storyId || !chatId) throw new Error('Missing sharing params');
        try {
            return await (prisma as any).message.create({
                data: { chatId, senderId, sharedStoryId: storyId, text: "Shared a story." }
            });
        } catch (error) {
            console.error('[ForwardService] shareStoryToChat failed:', error);
            throw new Error('Failed to share story');
        }
    }

    static async reactToStory(userId: string, storyId: string, emoji: string) {
        if (!userId || !storyId || !emoji) throw new Error('Missing reaction params');
        try {
            const story = await (prisma as any).story.findUnique({
                where: { id: storyId },
                select: { reactions: true }
            });
            if (!story) throw new Error('Story not found');

            const reactions = (story.reactions as any) || {};
            const currentEmojiUsers = reactions[emoji] || [];

            let newUsers;
            if (currentEmojiUsers.includes(userId)) {
                newUsers = currentEmojiUsers.filter((id: string) => id !== userId);
            } else {
                newUsers = [...currentEmojiUsers, userId];
            }

            return await (prisma as any).story.update({
                where: { id: storyId },
                data: { reactions: { ...reactions, [emoji]: newUsers } }
            });
        } catch (error) {
            console.error('[ForwardService] reactToStory failed:', error);
            throw new Error('Reaction failed');
        }
    }
}
