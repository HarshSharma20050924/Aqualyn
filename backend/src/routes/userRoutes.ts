import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { followUser, unfollowUser, handleFollowRequest, getNotifications, markNotificationsRead } from '../controllers/userController';
import prisma from '../config/prisma';
import { SettingsService } from '../services/SettingsService';

const router = Router();

router.use(verifyFirebaseToken);

// 1. SETTINGS API
router.get('/settings', async (req: any, res: any) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const settings = await SettingsService.getSettings(user.id);
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.patch('/settings', async (req: any, res: any) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const updatedSettings = await SettingsService.updateSettings(user.id, req.body);
        res.json({ success: true, settings: updatedSettings });
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to update settings' });
    }
});

// 2. SOCIAL API
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.post('/follow-request/handle', handleFollowRequest);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);

// 3. PROFILE API (Optimized - No full includes)
router.get('/profile/:userId', async (req: any, res: any) => {
    try {
        const profile = await (prisma as any).user.findUnique({
            where: { id: req.params.userId },
            select: { 
                id: true, username: true, displayName: true,
                avatar: true, largeAvatar: true, bio: true, 
                isPrivate: true, lastLogin: true,
                _count: {
                    select: { followers: true, following: true }
                }
            }
        });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (e) {
        console.error('[UserRoute] Profile fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
