import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { followUser, unfollowUser, handleFollowRequest, getNotifications, markNotificationsRead, getFollowersList, getFollowingList } from '../controllers/userController';
import prisma from '../config/prisma';
import { SettingsService } from '../services/SettingsService';

const router = Router();

router.use(verifyToken);

// 1. SETTINGS API
router.get('/settings', async (req: any, res: any) => {
    try {
        const settings = await SettingsService.getSettings(req.user.id);
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.patch('/settings', async (req: any, res: any) => {
    try {
        const updatedSettings = await SettingsService.updateSettings(req.user.id, req.body);
        res.json({ success: true, settings: updatedSettings });
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to update settings' });
    }
});

router.get('/sessions', async (req: any, res: any) => {
    try {
        const sessions = await SettingsService.getActiveSessions(req.user.id);
        res.json(sessions);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

router.delete('/sessions/:id', async (req: any, res: any) => {
    try {
        await SettingsService.revokeSession(req.user.id, req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to revoke session' });
    }
});

router.get('/storage-usage', async (req: any, res: any) => {
    try {
        const usage = await SettingsService.getStorageUsage(req.user.id);
        res.json(usage);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch storage usage' });
    }
});

router.post('/export', async (req: any, res: any) => {
    try {
        // Mocking export for now - in real life this would trigger a background job
        // to ZIP everything and then upload to a safe location / email it.
        res.json({ success: true, message: 'Data export initiated. You will be notified when it is ready for download.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to initiate export' });
    }
});

// 2. SOCIAL API
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.post('/follow-request/handle', handleFollowRequest);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);
router.get('/:userId/followers', getFollowersList);
router.get('/:userId/following', getFollowingList);

// 3. PROFILE API (Optimized - No full includes)
router.get('/profile/:userId', async (req: any, res: any) => {
    try {
        const profile = await (prisma as any).user.findUnique({
            where: { id: req.params.userId },
            select: { 
                id: true, username: true, displayName: true,
                avatar: true, largeAvatar: true, bio: true, 
                isPrivate: true, lastLogin: true,
                invitationSettings: true,
                _count: {
                    select: { followers: true, following: true }
                },
                followers: { select: { followerId: true } },
                following: { select: { followingId: true } }
            }
        });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (e) {
        console.error('[UserRoute] Profile fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// 4. BLOCK / UNBLOCK
router.post('/block', async (req: any, res: any) => {
    const { targetUserId } = req.body;
    const userId = req.user.id;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    try {
        const existing = await (prisma as any).blockedUser.findUnique({
            where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } }
        });
        if (existing) {
            await (prisma as any).blockedUser.delete({ where: { id: existing.id } });
            return res.json({ blocked: false, message: 'User unblocked' });
        } else {
            await (prisma as any).blockedUser.create({
                data: { blockerId: userId, blockedId: targetUserId }
            });
            return res.json({ blocked: true, message: 'User blocked' });
        }
    } catch (e) {
        console.error('[UserRoute] Block error:', e);
        res.status(500).json({ error: 'Block operation failed' });
    }
});

// 5. REPORT USER
router.post('/report', async (req: any, res: any) => {
    const { targetUserId, reason } = req.body;
    const userId = req.user.id;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    try {
        await (prisma as any).report.create({
            data: { reporterId: userId, reportedId: targetUserId, reason: reason || null }
        });
        res.json({ success: true, message: 'Report submitted' });
    } catch (e) {
        console.error('[UserRoute] Report error:', e);
        res.status(500).json({ error: 'Report failed' });
    }
});

// 6. GET BLOCKED USERS
router.get('/blocked', async (req: any, res: any) => {
    try {
        const blocked = await (prisma as any).blockedUser.findMany({
            where: { blockerId: req.user.id },
            select: { blockedId: true }
        });
        res.json(blocked.map((b: any) => b.blockedId));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch blocked users' });
    }
});

// 7. UPDATE TOP-LEVEL PRIVACY (Used by specific toggles)
router.patch('/privacy', async (req: any, res: any) => {
    const userId = req.user.id;
    const { invitationSettings, showPhoneTo, searchByPhone, isPrivate } = req.body;
    try {
        const updated = await (prisma as any).user.update({
            where: { id: userId },
            data: {
                invitationSettings: invitationSettings !== undefined ? invitationSettings : undefined,
                showPhoneTo: showPhoneTo !== undefined ? showPhoneTo : undefined,
                searchByPhone: searchByPhone !== undefined ? searchByPhone : undefined,
                isPrivate: isPrivate !== undefined ? isPrivate : undefined
            }
        });
        res.json(updated);
    } catch (e) {
        console.error('[UserRoute] Privacy update error:', e);
        res.status(500).json({ error: 'Failed to update privacy settings' });
    }
});

// 8. UPLOAD AVATAR
router.post('/upload-avatar', async (req: any, res: any) => {
    const userId = req.user.id;
    const { avatar } = req.body; // Expecting base64 or URL for now
    if (!avatar) return res.status(400).json({ error: 'Avatar data required' });
    try {
        const updated = await (prisma as any).user.update({
            where: { id: userId },
            data: { avatar }
        });
        res.json({ success: true, avatar: updated.avatar });
    } catch (e) {
        console.error('[UserRoute] Avatar upload error:', e);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// 9. CONTACT SYNC
router.post('/contacts/sync', async (req: any, res: any) => {
    const { phones } = req.body;
    if (!phones || !Array.isArray(phones)) return res.status(400).json({ error: 'Phones array required' });
    
    try {
        // Find users with these phones who allow search by phone
        const matches = await (prisma as any).user.findMany({
            where: {
                phone: { in: phones },
                searchByPhone: true,
                NOT: { id: req.user.id }
            },
            select: {
                id: true, username: true, displayName: true,
                avatar: true, phone: true
            }
        });
        res.json(matches);
    } catch (e) {
        console.error('[UserRoute] Contact sync error:', e);
        res.status(500).json({ error: 'Failed to sync contacts' });
    }
});

// 10. CALL HISTORY
router.get('/call-history', async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 30;
        const skip = (page - 1) * limit;

        const calls = await (prisma as any).callLog.findMany({
            where: {
                OR: [{ callerId: userId }, { calleeId: userId }]
            },
            orderBy: { startedAt: 'desc' },
            skip,
            take: limit,
            include: {
                caller: { select: { id: true, displayName: true, username: true, avatar: true } },
                callee: { select: { id: true, displayName: true, username: true, avatar: true } }
            }
        });

        const total = await (prisma as any).callLog.count({
            where: { OR: [{ callerId: userId }, { calleeId: userId }] }
        });

        res.json({ calls, total, page, limit });
    } catch (e) {
        console.error('[UserRoute] Call history error:', e);
        res.status(500).json({ error: 'Failed to fetch call history' });
    }
});

export default router;
