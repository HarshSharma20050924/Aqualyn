import prisma from '../../config/prisma';
import { ContentService } from '../../services/ContentService';
import { ActivityService } from '../../services/ActivityService';
import { pubClient } from '../../config/redis';

export class SocialService {
    
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

            if (data.content) {
                ContentService.handlePostMentions(userId, post.id, data.content).catch((e: any) => 
                    console.error('[SocialService] Mention Error:', e)
                );
            }

            const followers = await (prisma as any).userFollows.findMany({
                where: { followingId: userId },
                select: { followerId: true }
            });
            const followerIds = followers.map((f: any) => f.followerId);

            if (followerIds.length > 0) {
                // Safeguard against Redis process crashes
                try {
                    pubClient.publish('SOCIAL_POST_UPDATE', JSON.stringify({ 
                        userId, 
                        postId: post.id, 
                        post,
                        followerIds 
                    }));
                } catch (redisError) {
                    console.error('[SocialService] Redis publish failed for createPost:', redisError);
                }
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

            // Sequential teardown inside a transactional unit to handle constraints safely
            await (prisma as any).$transaction([
                (prisma as any).commentLike.deleteMany({ where: { comment: { postId } } }),
                (prisma as any).comment.deleteMany({ where: { postId } }),
                (prisma as any).like.deleteMany({ where: { postId } }),
                (prisma as any).savedPost.deleteMany({ where: { postId } }),
                (prisma as any).post.delete({ where: { id: postId } })
            ]);

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
                        where: { parentId: null },
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

            try {
                pubClient.publish('SOCIAL_STORY_UPDATE', JSON.stringify({ 
                    userId, 
                    storyId: story.id, 
                    story,
                    followerIds 
                }));
            } catch (redisError) {
                console.error('[SocialService] Redis publish failed for createStory:', redisError);
            }

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

            await (prisma as any).$transaction([
                (prisma as any).storyView.deleteMany({ where: { storyId } }),
                (prisma as any).story.delete({ where: { id: storyId } })
            ]);

            return { success: true };
        } catch (error) {
            console.error('[SocialService] deleteStory failed:', error);
            throw new Error('Story deletion failed');
        }
    }

    static async getUserPosts(userId: string, cursor?: string, limit: number = 20) {
        try {
            return await (prisma as any).post.findMany({
                where: { authorId: userId },
                take: limit,
                ...(cursor && { skip: 1, cursor: { id: cursor } }),
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, username: true, displayName: true, avatar: true } },
                    likes: { select: { userId: true } },
                    comments: {
                        where: { parentId: null },
                        include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
                        orderBy: { createdAt: 'asc' }, 
                        take: 5
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

                try {
                    pubClient.publish('SOCIAL_LIKE_UPDATE', JSON.stringify({ userId, postId, liked: true }));
                } catch (redisError) {
                    console.error('[SocialService] Redis publish failed for toggleLike:', redisError);
                }
                
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

            try {
                pubClient.publish('SOCIAL_COMMENT_UPDATE', JSON.stringify({ userId, postId, comment }));
            } catch (redisError) {
                console.error('[SocialService] Redis publish failed for addComment:', redisError);
            }

            return comment;
        } catch (error) {
            console.error('[SocialService] addComment failed:', error);
            throw new Error('Comment failed');
        }
    }

    static async deleteComment(userId: string, commentId: string) {
        if (!userId || !commentId) throw new Error('Missing fields');
        try {
            const comment = await (prisma as any).comment.findUnique({
                where: { id: commentId },
                include: { post: true }
            });
            if (!comment) throw new Error('Comment not found');
            
            // Authorized if user wrote the comment OR user owns the post
            if (comment.userId !== userId && comment.post.authorId !== userId) {
                throw new Error('Not authorized');
            }

            await (prisma as any).$transaction([
                (prisma as any).commentLike.deleteMany({ where: { commentId } }),
                (prisma as any).comment.deleteMany({ where: { parentId: commentId } }), // wipe nested sub-replies
                (prisma as any).comment.delete({ where: { id: commentId } })
            ]);

            return { success: true };
        } catch (error) {
            console.error('[SocialService] deleteComment failed:', error);
            throw new Error('Comment deletion failed');
        }
    }

    static async getComments(postId: string, cursor?: string, limit: number = 20) {
        return await (prisma as any).comment.findMany({
            where: { postId, parentId: null },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, username: true, displayName: true, avatar: true } },
                replies: {
                    include: {
                        user: { select: { id: true, username: true, displayName: true, avatar: true } },
                        _count: { select: { likes: true } }
                    },
                    orderBy: { createdAt: 'asc' },
                    take: 3
                },
                _count: { select: { likes: true, replies: true } }
            }
        });
    }

    static async replyToComment(userId: string, postId: string, parentId: string, content: string) {
        if (!content) throw new Error('Reply content is required');
        const parent = await (prisma as any).comment.findUnique({ where: { id: parentId } });
        if (!parent || parent.postId !== postId) throw new Error('Parent comment not found');

        const reply = await (prisma as any).comment.create({
            data: { userId, postId, parentId, content },
            include: {
                user: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        });

        if (parent.userId !== userId) {
            ActivityService.createActivity({
                userId: parent.userId,
                actorId: userId,
                type: 'COMMENT',
                postId,
                text: 'replied: ' + (content.length > 20 ? content.substring(0, 17) + '...' : content)
            }).catch(() => {});
        }

        return reply;
    }

    static async getPostLikes(postId: string, cursor?: string, limit: number = 30) {
        const likes = await (prisma as any).like.findMany({
            where: { postId },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, displayName: true, avatar: true, bio: true } }
            }
        });
        return likes.map((l: any) => l.user);
    }

    static async getStoryViews(userId: string, storyId: string) {
        const story = await (prisma as any).story.findUnique({ where: { id: storyId } });
        if (!story) throw new Error('Story not found');
        if (story.userId !== userId) throw new Error('Only the story owner can see views');

        return await (prisma as any).storyView.findMany({
            where: { storyId },
            orderBy: { viewedAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        });
    }

    static async toggleCommentLike(userId: string, commentId: string) {
        if (!commentId) throw new Error('Comment ID is required');
        const existing = await (prisma as any).commentLike.findUnique({
            where: { userId_commentId: { userId, commentId } }
        });
        if (existing) {
            await (prisma as any).commentLike.delete({ where: { id: existing.id } });
            return { liked: false };
        } else {
            await (prisma as any).commentLike.create({ data: { userId, commentId } });
            return { liked: true };
        }
    }

    static async toggleSavePost(userId: string, postId: string) {
        const existing = await (prisma as any).savedPost.findUnique({
            where: { userId_postId: { userId, postId } }
        });
        if (existing) {
            await (prisma as any).savedPost.delete({ where: { id: existing.id } });
            return { saved: false };
        } else {
            await (prisma as any).savedPost.create({ data: { userId, postId } });
            return { saved: true };
        }
    }

    static async getSavedPosts(userId: string, cursor?: string, limit: number = 20) {
        const saved = await (prisma as any).savedPost.findMany({
            where: { userId },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            include: {
                post: {
                    include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } }
                }
            },
            orderBy: { savedAt: 'desc' }
        });
        return saved.map((s: any) => s.post);
    }

    static async viewStory(userId: string, storyId: string) {
        const existing = await (prisma as any).storyView.findUnique({
            where: { storyId_userId: { storyId, userId } }
        });
        if (!existing) {
            await (prisma as any).storyView.create({ data: { storyId, userId } });
        }
        return { success: true };
    }
}