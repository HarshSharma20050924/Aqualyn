import prisma from '../config/prisma';
import { ContentService } from './ContentService';
import { ActivityService } from './ActivityService';
import { pubClient } from '../config/redis';

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
        if (!userId) throw new Error('User ID is required');
        if (!data.content && !data.mediaUrl) throw new Error('Post must have content or media');

        try {
            const post = await (prisma as any).post.create({
                data: {
                    authorId: userId,
                    content: data.content,
                    mediaUrl: data.mediaUrl,
                    mediaType: data.mediaType || 'text'
                },
                include: {
                    author: {
                        select: { id: true, username: true, displayName: true, avatar: true }
                    }
                }
            });

            // 🟢 DISTRIBUTED MENTION LOGIC (Run in background)
            if (data.content) {
                ContentService.handlePostMentions(userId, post.id, data.content).catch((e: any) => 
                    console.error('[SocialService] Mention Error:', e)
                );
            }

            // 🔵 REAL-TIME BROADCAST (Background)
            const followers = await (prisma as any).userFollows.findMany({
                where: { followingId: userId },
                select: { followerId: true }
            });
            const followerIds = followers.map((f: any) => f.followerId);

            if (followerIds.length > 0) {
                pubClient.publish('SOCIAL_POST_UPDATE', JSON.stringify({ 
                    userId, 
                    postId: post.id, 
                    post,
                    followerIds 
                }));
            }

            return post;
        } catch (error) {
            console.error('[SocialService] createPost failed:', error);
            throw new Error('Could not create post');
        }
    }

    static async deletePost(userId: string, postId: string) {
        if (!userId || !postId) throw new Error('User ID and Post ID are required');
        try {
            const post = await (prisma as any).post.findUnique({ where: { id: postId } });
            if (!post) throw new Error('Post not found');
            if (post.authorId !== userId) throw new Error('Not authorized');

            await (prisma as any).post.delete({ where: { id: postId } });
            return { success: true };
        } catch (error) {
            console.error('[SocialService] deletePost failed:', error);
            throw new Error('Deletion failed');
        }
    }

    static async editPost(userId: string, postId: string, content: string) {
        if (!userId || !postId) throw new Error('User ID and Post ID are required');
        try {
            const post = await (prisma as any).post.findUnique({ where: { id: postId } });
            if (!post) throw new Error('Post not found');
            if (post.authorId !== userId) throw new Error('Not authorized');

            return await (prisma as any).post.update({
                where: { id: postId },
                data: { content },
                include: {
                    author: { select: { id: true, username: true, displayName: true, avatar: true } }
                }
            });
        } catch (error) {
            console.error('[SocialService] editPost failed:', error);
            throw new Error('Edit failed');
        }
    }

    static async getFeed(userId: string, cursor?: string, limit: number = 20) {
        if (!userId) return [];
        try {
            const following = await (prisma as any).userFollows.findMany({
                where: { followerId: userId },
                select: { followingId: true }
            });
            const followingIds = following.map((f: any) => f.followingId);
            const authors = [...followingIds, userId];

            return await (prisma as any).post.findMany({
                where: { authorId: { in: authors } },
                take: limit,
                ...(cursor && { skip: 1, cursor: { id: cursor } }),
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, username: true, displayName: true, avatar: true }
                    },
                    likes: { select: { userId: true } },
                    comments: {
                        include: {
                            user: { select: { id: true, username: true, displayName: true, avatar: true } }
                        },
                        orderBy: { createdAt: 'asc' },
                        take: 5
                    },
                    _count: { select: { likes: true, comments: true } }
                }
            });
        } catch (error) {
            console.error('[SocialService] getFeed failed:', error);
            return [];
        }
    }

    static async createStory(userId: string, data: { mediaUrl: string, mediaType: string, content?: string }) {
        if (!userId || !data.mediaUrl) throw new Error('User ID and Media URL are required');
        
        try {
            const story = await (prisma as any).story.create({
                data: {
                    userId,
                    mediaUrl: data.mediaUrl,
                    mediaType: data.mediaType || 'image',
                    content: data.content
                },
                include: {
                    user: {
                        select: { id: true, username: true, displayName: true, avatar: true }
                    }
                }
            });

            const followers = await (prisma as any).userFollows.findMany({
                where: { followingId: userId },
                select: { followerId: true }
            });
            const followerIds = followers.map((f: any) => f.followerId);

            for (const followerId of followerIds) {
                ActivityService.createActivity({
                    userId: followerId,
                    actorId: userId,
                    type: 'STORY',
                    storyId: story.id,
                    text: 'published a new story'
                }).catch(() => {});
            }

            pubClient.publish('SOCIAL_STORY_UPDATE', JSON.stringify({ 
                userId, 
                storyId: story.id, 
                story,
                followerIds 
            }));

            return story;
        } catch (error) {
            console.error('[SocialService] createStory failed:', error);
            throw new Error('Story creation failed');
        }
    }

    static async getActiveStories(userId: string) {
        if (!userId) return [];
        try {
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
                    user: { select: { id: true, username: true, displayName: true, avatar: true } }
                }
            });
        } catch (error) {
            console.error('[SocialService] getActiveStories failed:', error);
            return [];
        }
    }

    static async deleteStory(userId: string, storyId: string) {
        if (!userId || !storyId) throw new Error('User ID and Story ID are required');
        
        try {
            const story = await (prisma as any).story.findUnique({
                where: { id: storyId }
            });

            if (!story) throw new Error('Story not found');
            if (story.userId !== userId) throw new Error('Not authorized to delete this story');

            await (prisma as any).story.delete({
                where: { id: storyId }
            });

            return { success: true };
        } catch (error) {
            console.error('[SocialService] deleteStory failed:', error);
            throw new Error('Story deletion failed');
        }
    }

    static async getUserPosts(userId: string) {
        try {
            return await (prisma as any).post.findMany({
                where: { authorId: userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, username: true, displayName: true, avatar: true } },
                    likes: { select: { userId: true } },
                    comments: {
                        include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
                        orderBy: { createdAt: 'asc' }, take: 5
                    },
                    _count: { select: { likes: true, comments: true } }
                }
            });
        } catch (error) {
            console.error('[SocialService] getUserPosts failed:', error);
            return [];
        }
    }

    static async getUserStories(userId: string) {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return await (prisma as any).story.findMany({
                where: { userId, createdAt: { gte: twentyFourHoursAgo } },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } }
            });
        } catch (error) {
            console.error('[SocialService] getUserStories failed:', error);
            return [];
        }
    }

    static async toggleLike(userId: string, postId: string) {
        if (!userId || !postId) throw new Error('Missing User ID or Post ID');
        try {
            const existingLike = await (prisma as any).like.findUnique({
                where: { userId_postId: { userId, postId } }
            });

            if (existingLike) {
                await (prisma as any).like.delete({ where: { id: existingLike.id } });
                return { liked: false };
            } else {
                const like = await (prisma as any).like.create({ data: { userId, postId } });
                const post = await (prisma as any).post.findUnique({ where: { id: postId }, select: { authorId: true } });
                
                if (post && post.authorId !== userId) {
                    ActivityService.createActivity({
                        userId: post.authorId,
                        actorId: userId,
                        type: 'LIKE',
                        postId,
                        text: 'liked your post'
                    }).catch(() => {});
                }

                // 🔵 Broadcast Like
                pubClient.publish('SOCIAL_LIKE_UPDATE', JSON.stringify({ userId, postId, liked: true }));
                
                return { liked: true, like };
            }
        } catch (error) {
            console.error('[SocialService] toggleLike failed:', error);
            throw new Error('Like operation failed');
        }
    }

    static async addComment(userId: string, postId: string, content: string) {
        if (!userId || !postId || !content) throw new Error('Missing required fields for comment');
        try {
            const comment = await (prisma as any).comment.create({
                data: { userId, postId, content },
                include: {
                    user: { select: { id: true, username: true, displayName: true, avatar: true } }
                }
            });

            const post = await (prisma as any).post.findUnique({ where: { id: postId }, select: { authorId: true } });
            if (post && post.authorId !== userId) {
                ActivityService.createActivity({
                    userId: post.authorId,
                    actorId: userId,
                    type: 'COMMENT',
                    postId,
                    text: 'commented: ' + (content.length > 20 ? content.substring(0, 17) + '...' : content)
                }).catch(() => {});
            }

            // 🔵 Broadcast Comment
            pubClient.publish('SOCIAL_COMMENT_UPDATE', JSON.stringify({ userId, postId, comment }));

            return comment;
        } catch (error) {
            console.error('[SocialService] addComment failed:', error);
            throw new Error('Comment failed');
        }
    }
}
