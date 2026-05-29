import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { SocialService } from '../services/SocialService';
import { SearchService } from '../services/SearchService';
import prisma from '../config/prisma';

const router = Router();

/**
 * SOCIAL & FEED ENDPOINTS
 */

// 1. GLOBAL SEARCH (Users + Posts)
router.get('/search', verifyToken, async (req: any, res: any) => {
    const q = req.query.q as string;
    if (!q) return res.json({ users: [], posts: [] });
    try {
        const results = await SearchService.globalSearch(q, req.user.id);
        res.json(results);
    } catch (e) {
        console.error('[SocialRoute] Search error:', e);
        res.status(500).json({ error: 'Global Search failed' });
    }
});

// 2. GET SOCIAL FEED (Posts from following)
router.get('/feed', verifyToken, async (req: any, res: any) => {
    const cursor = req.query.cursor as string | undefined;
    try {
        const feed = await SocialService.getFeed(req.user.id, cursor);
        res.json(feed);
    } catch (e) {
        console.error('[SocialRoute] Feed error:', e);
        res.status(500).json({ error: 'Could not fetch feed' });
    }
});

// 3. GET ACTIVE STORIES (24h)
router.get('/stories', verifyToken, async (req: any, res: any) => {
    try {
        const stories = await SocialService.getActiveStories(req.user.id);
        res.json(stories);
    } catch (e) {
        console.error('[SocialRoute] Stories error:', e);
        res.status(500).json({ error: 'Could not fetch stories' });
    }
});

// 3b. GET USER POSTS
router.get('/user/:userId/posts', verifyToken, async (req: any, res: any) => {
    try {
        const posts = await SocialService.getUserPosts(req.params.userId);
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: 'Could not fetch user posts' });
    }
});

// 3c. GET USER STORIES
router.get('/user/:userId/stories', verifyToken, async (req: any, res: any) => {
    try {
        const stories = await SocialService.getUserStories(req.params.userId);
        res.json(stories);
    } catch (e) {
        res.status(500).json({ error: 'Could not fetch user stories' });
    }
});

/**
 * CREATION & MODIFICATION ENDPOINTS
 */

// 4. CREATE POST
router.post('/post', verifyToken, async (req: any, res: any) => {
    const { content, mediaUrl, mediaType } = req.body;
    try {
        const post = await SocialService.createPost(req.user.id, { content, mediaUrl, mediaType });
        res.json({ success: true, post });
    } catch (e) {
        console.error('[SocialRoute] Post creation error:', e);
        res.status(500).json({ error: 'Post creation failed' });
    }
});

// 4b. DELETE POST
router.delete('/post/:postId', verifyToken, async (req: any, res: any) => {
    try {
        await SocialService.deletePost(req.user.id, req.params.postId);
        res.json({ success: true, message: 'Post deleted' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// 4c. EDIT POST
router.patch('/post/:postId', verifyToken, async (req: any, res: any) => {
    const { content } = req.body;
    try {
        const post = await SocialService.editPost(req.user.id, req.params.postId, content);
        res.json({ success: true, post });
    } catch (e) {
        res.status(500).json({ error: 'Edit failed' });
    }
});

// 5. CREATE STORY
router.post('/story', verifyToken, async (req: any, res: any) => {
    const { mediaUrl, mediaType, content } = req.body;
    try {
        const story = await SocialService.createStory(req.user.id, { mediaUrl, mediaType, content });
        res.json({ success: true, story });
    } catch (e) {
        console.error('[SocialRoute] Story creation error:', e);
        res.status(500).json({ error: 'Story creation failed' });
    }
});

// 5b. DELETE STORY
router.delete('/story/:storyId', verifyToken, async (req: any, res: any) => {
    try {
        await SocialService.deleteStory(req.user.id, req.params.storyId);
        res.json({ success: true, message: 'Story deleted' });
    } catch (e) {
        console.error('[SocialRoute] Story deletion error:', e);
        res.status(500).json({ error: 'Could not delete story' });
    }
});

// 6. TOGGLE LIKE
router.post('/post/:postId/like', verifyToken, async (req: any, res: any) => {
    try {
        const result = await SocialService.toggleLike(req.user.id, req.params.postId);
        res.json(result);
    } catch (e) {
        console.error('[SocialRoute] Like error:', e);
        res.status(500).json({ error: 'Like operation failed' });
    }
});

// 7. ADD COMMENT
router.post('/post/:postId/comment', verifyToken, async (req: any, res: any) => {
    const { content } = req.body;
    try {
        const comment = await SocialService.addComment(req.user.id, req.params.postId, content);
        res.json({ success: true, comment });
    } catch (e) {
        console.error('[SocialRoute] Comment error:', e);
        res.status(500).json({ error: 'Comment failed' });
    }
});

// 8. SAVE POST
router.post('/post/:postId/save', verifyToken, async (req: any, res: any) => {
    const userId = req.user.id;
    const { postId } = req.params;
    try {
        const existing = await (prisma as any).savedPost.findUnique({
            where: { userId_postId: { userId, postId } }
        });
        if (existing) {
            await (prisma as any).savedPost.delete({ where: { id: existing.id } });
            return res.json({ saved: false });
        } else {
            await (prisma as any).savedPost.create({ data: { userId, postId } });
            return res.json({ saved: true });
        }
    } catch (e) {
        console.error('[SocialRoute] Save post error:', e);
        res.status(500).json({ error: 'Save post failed' });
    }
});

// 9. GET SAVED POSTS
router.get('/saved-posts', verifyToken, async (req: any, res: any) => {
    try {
        const saved = await (prisma as any).savedPost.findMany({
            where: { userId: req.user.id },
            include: {
                post: {
                    include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } }
                }
            },
            orderBy: { savedAt: 'desc' }
        });
        res.json(saved.map((s: any) => s.post));
    } catch (e) {
        console.error('[SocialRoute] Get saved posts error:', e);
        res.status(500).json({ error: 'Get saved posts failed' });
    }
});

// 10. VIEW STORY
router.post('/story/:storyId/view', verifyToken, async (req: any, res: any) => {
    const userId = req.user.id;
    const { storyId } = req.params;
    try {
        // Upsert view
        const existing = await (prisma as any).storyView.findUnique({
            where: { storyId_userId: { storyId, userId } }
        });
        if (!existing) {
            await (prisma as any).storyView.create({ data: { storyId, userId } });
        }
        res.json({ success: true });
    } catch (e) {
        console.error('[SocialRoute] View story error:', e);
        res.status(500).json({ error: 'View story failed' });
    }
});

export default router;