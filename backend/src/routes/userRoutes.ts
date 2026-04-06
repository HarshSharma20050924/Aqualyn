import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { followUser, unfollowUser, handleFollowRequest, getNotifications, markNotificationsRead } from '../controllers/userController';
import prisma from '../config/prisma';

const router = Router();

router.use(verifyFirebaseToken);

router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.post('/follow-request/handle', handleFollowRequest);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);

router.get('/profile/:userId', async (req: any, res: any) => {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: req.params.userId },
            include: {
                followers: true,
                following: true,
                sentFollowReqs: true,
                receivedFollowReqs: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
