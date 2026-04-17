import prisma from '../config/prisma';

/**
 * SocialService handles the core logical operations for the Social Feed,
 * including Post creation, Feed retrieval, and Story management.
 */
export class SocialService {
    
    /**
     * Create a new post with optional media.
     * High-scale Ready: Uses specific selection on return.
     */
    static async createPost(userId: string, data: { content?: string, mediaUrl?: string, mediaType?: string }) {
        const post = await (prisma as any).post.create({
            data: {
                authorId: userId,
                content: data.content,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType
            },
            select: { id: true, content: true, createdAt: true, mediaUrl: true }
        });

        // 🟢 DISTRIBUTED MENTION LOGIC (Run in background)
        if (data.content) {
            const { ContentService } = require('./ContentService');
            ContentService.handlePostMentions(userId, post.id, data.content).catch((e: any) => 
                console.error('[SocialService] Mention Error:', e)
            );
        }

        return post;
    }

    /**
     * Get the social feed for a user (Posts from people they follow).
     * Uses CURSOR-based pagination for Big Production performance.
     */
    static async getFeed(userId: string, cursor?: string, limit: number = 20) {
        // 1. Get following IDs
        const following = await (prisma as any).userFollows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = following.map((f: any) => f.followingId);
        
        // Include self-posts in the feed
        const authors = [...followingIds, userId];

        // 2. Fetch posts with cursor
        return await (prisma as any).post.findMany({
            where: { authorId: { in: authors } },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, username: true, displayName: true, avatar: true }
                },
                likes: {
                    select: { userId: true }
                },
                comments: {
                    include: {
                        user: {
                            select: { id: true, username: true, displayName: true, avatar: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' },
                    take: 5
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            }
        });
    }

    /**
     * Create a new Story (TTL/Invisible after 24h).
     * High-speed Sync: Notifies all followers and triggers activity feed events.
     */
    static async createStory(userId: string, data: { mediaUrl: string, mediaType: string, content?: string }) {
        // 1. Create Story entry
        const story = await (prisma as any).story.create({
            data: {
                userId,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType,
                content: data.content
            }
        });

        // 🟢 DISTRIBUTED SYNC LOOP (Background)
        // Find followers to trigger social notifications
        const followers = await (prisma as any).userFollows.findMany({
            where: { followingId: userId },
            select: { followerId: true }
        });

        const followerIds = followers.map((f: any) => f.followerId);

        // 1. Activity Tab Population
        const { ActivityService } = require('./ActivityService');
        for (const followerId of followerIds) {
            ActivityService.createActivity({
                userId: followerId,
                actorId: userId,
                type: 'STORY',
                storyId: story.id,
                text: 'published a new story'
            }).catch(() => {});
        }

        // 2. Real-Time Socket Broadcast (Via Redis Cluster)
        const { pubClient } = require('../config/redis');
        pubClient.publish('SOCIAL_STORY_UPDATE', JSON.stringify({ 
            userId, 
            storyId: story.id, 
            followerIds 
        }));

        return story;
    }

    /**
     * Get active stories from the last 24 hours for followed users.
     */
    static async getActiveStories(userId: string) {
        const following = await (prisma as any).userFollows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = following.map((f: any) => f.followingId);

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        return await (prisma as any).story.findMany({
            where: {
                userId: { in: [...followingIds, userId] },
                createdAt: { gte: twentyFourHoursAgo }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, username: true, displayName: true, avatar: true }
                }
            }
        });
    }

    /**
     * Like or unlike a post.
     */
    static async toggleLike(userId: string, postId: string) {
        const existingLike = await (prisma as any).like.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existingLike) {
            await (prisma as any).like.delete({
                where: { id: existingLike.id }
            });
            return { liked: false };
        } else {
            const like = await (prisma as any).like.create({
                data: { userId, postId }
            });

            // Trigger activity notification
            const post = await (prisma as any).post.findUnique({
                where: { id: postId },
                select: { authorId: true }
            });
            
            if (post && post.authorId !== userId) {
                const { ActivityService } = require('./ActivityService');
                ActivityService.createActivity({
                    userId: post.authorId,
                    actorId: userId,
                    type: 'LIKE',
                    postId,
                    text: 'liked your post'
                }).catch(() => {});
            }

            return { liked: true, like };
        }
    }

    /**
     * Add a comment to a post.
     */
    static async addComment(userId: string, postId: string, content: string) {
        const comment = await (prisma as any).comment.create({
            data: { userId, postId, content },
            include: {
                user: {
                    select: { id: true, username: true, displayName: true, avatar: true }
                }
            }
        });

        // Trigger activity notification
        const post = await (prisma as any).post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (post && post.authorId !== userId) {
            const { ActivityService } = require('./ActivityService');
            ActivityService.createActivity({
                userId: post.authorId,
                actorId: userId,
                type: 'COMMENT',
                postId,
                text: 'commented: ' + (content.length > 20 ? content.substring(0, 17) + '...' : content)
            }).catch(() => {});
        }

        return comment;
    }
}
