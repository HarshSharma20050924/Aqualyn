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
        return await (prisma as any).activity.findMany({
            where: { userId },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                actor: {
                    select: { id: true, username: true, displayName: true, avatar: true }
                }
            }
        });
    }

    /**
     * Bulk mark activities as read.
     */
    static async markRead(userId: string, activityIds: string[]) {
        return await (prisma as any).activity.updateMany({
            where: { 
                id: { in: activityIds },
                userId 
            },
            data: { isRead: true }
        });
    }

    /**
     * Create an activity event (Stateless).
     */
    static async createActivity(data: { userId: string, actorId: string, type: string, postId?: string, storyId?: string, text?: string }) {
        if (data.userId === data.actorId) return; // Don't notify self
        return await (prisma as any).activity.create({ data });
    }
}

/**
 * ForwardService handles cross-entity sharing between Social and Chat.
 */
export class ForwardService {
    
    /**
     * Share a social post into a chat conversation.
     */
    static async sharePostToChat(senderId: string, postId: string, chatId: string) {
        return await (prisma as any).message.create({
            data: {
                chatId,
                senderId,
                sharedPostId: postId,
                text: "Shared a post."
            }
        });
    }

    /**
     * Share a story into a chat conversation.
     */
    static async shareStoryToChat(senderId: string, storyId: string, chatId: string) {
        return await (prisma as any).message.create({
            data: {
                chatId,
                senderId,
                sharedStoryId: storyId,
                text: "Shared a story."
            }
        });
    }

    /**
     * Add or remove a reaction on a story.
     */
    static async reactToStory(userId: string, storyId: string, emoji: string) {
        const story = await (prisma as any).story.findUnique({
            where: { id: storyId },
            select: { reactions: true }
        });
        if (!story) throw new Error('Story not found');

        const reactions = (story.reactions as any) || {};
        const currentEmojiUsers = reactions[emoji] || [];

        // Toggle logic: Add if not there, remove if already there
        let newUsers;
        if (currentEmojiUsers.includes(userId)) {
            newUsers = currentEmojiUsers.filter((id: string) => id !== userId);
        } else {
            newUsers = [...currentEmojiUsers, userId];
        }

        const newReactions = { ...reactions, [emoji]: newUsers };
        
        return await (prisma as any).story.update({
            where: { id: storyId },
            data: { reactions: newReactions }
        });
    }
}
