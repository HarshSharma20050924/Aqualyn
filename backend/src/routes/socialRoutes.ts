import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { SocialService } from '../services/SocialService';
import { SearchService } from '../services/SearchService';
import prisma from '../config/prisma';

const router = Router();

/**
 * SOCIAL & FEED ENDPOINTS
 */

// 1. GLOBAL SEARCH (Users + Posts)
router.get('/search', verifyFirebaseToken, async (req: any, res: any) => {
    const q = req.query.q as string;
    if (!q) return res.json({ users: [], posts: [] });
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const results = await SearchService.globalSearch(q, user.id);
        res.json(results);
    } catch (e) {
        console.error('[SocialRoute] Search error:', e);
        res.status(500).json({ error: 'Global Search failed' });
    }
});

// 2. GET SOCIAL FEED (Posts from following)
router.get('/feed', verifyFirebaseToken, async (req: any, res: any) => {
    const cursor = req.query.cursor as string | undefined;
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const feed = await SocialService.getFeed(user.id, cursor);
        res.json(feed);
    } catch (e) {
        console.error('[SocialRoute] Feed error:', e);
        res.status(500).json({ error: 'Could not fetch feed' });
    }
});

// 3. GET ACTIVE STORIES (24h)
router.get('/stories', verifyFirebaseToken, async (req: any, res: any) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const stories = await SocialService.getActiveStories(user.id);
        res.json(stories);
    } catch (e) {
        console.error('[SocialRoute] Stories error:', e);
        res.status(500).json({ error: 'Could not fetch stories' });
    }
});

/**
 * CREATION ENDPOINTS
 */

// 4. CREATE POST
router.post('/post', verifyFirebaseToken, async (req: any, res: any) => {
    const { content, mediaUrl, mediaType } = req.body;
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const post = await SocialService.createPost(user.id, { content, mediaUrl, mediaType });
        res.json({ success: true, post });
    } catch (e) {
        console.error('[SocialRoute] Post creation error:', e);
        res.status(500).json({ error: 'Post creation failed' });
    }
});

// 5. CREATE STORY
router.post('/story', verifyFirebaseToken, async (req: any, res: any) => {
    const { mediaUrl, mediaType, content } = req.body;
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const story = await SocialService.createStory(user.id, { mediaUrl, mediaType, content });
        res.json({ success: true, story });
    } catch (e) {
        console.error('[SocialRoute] Story creation error:', e);
        res.status(500).json({ error: 'Story creation failed' });
    }
});

export default router;
