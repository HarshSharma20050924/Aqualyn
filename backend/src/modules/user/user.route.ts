import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { cacheResponse } from '../../core/middlewares/cache.middleware';
import {
    getSettings,
    updateSettings,
    getSessions,
    revokeSession,
    getStorageUsage,
    exportData,
    getProfile,
    updateProfile,
    blockUser,
    reportUser,
    getBlockedUsers,
    updatePrivacy,
    uploadAvatar,
    syncContacts,
    getCallHistory,
    setPin,
    verifyPin,
    followUser,
    unfollowUser,
    handleFollowRequest,
    getNotifications,
    markNotificationsRead,
    getFollowersList,
    getFollowingList,
    startCall,
    endCall,
    getActivityFeed,
    markActivityRead
} from './user.controller';

const router = Router();

router.use(verifyToken);
router.use((req: any, res: any, next: any) => {
    if (!req.user?.id) return res.status(403).json({ error: 'Profile setup incomplete' });
    next();
});

// 1. SETTINGS API
router.get('/settings', cacheResponse(60), getSettings);
router.patch('/settings', updateSettings);
router.get('/sessions', cacheResponse(60), getSessions);
router.delete('/sessions/:id', revokeSession);
router.get('/storage-usage', cacheResponse(300), getStorageUsage);
router.post('/export', exportData);

// 2. SOCIAL API
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.post('/follow-request/handle', handleFollowRequest);
router.get('/notifications', cacheResponse(30), getNotifications);
router.post('/notifications/read', markNotificationsRead);

// 3. ACTIVITY FEED
router.get('/activity', cacheResponse(60), getActivityFeed);
router.post('/activity/read', markActivityRead);

// 4. FOLLOWERS / FOLLOWING (before dynamic :userId routes)
router.get('/:userId/followers', cacheResponse(60), getFollowersList);
router.get('/:userId/following', cacheResponse(60), getFollowingList);

// 5. PROFILE API
router.get('/profile/:userId', cacheResponse(60), getProfile);
router.patch('/profile', updateProfile);

// 6. BLOCK / UNBLOCK
router.post('/block', blockUser);
router.get('/blocked', getBlockedUsers);

// 7. REPORT USER
router.post('/report', reportUser);

// 8. UPDATE TOP-LEVEL PRIVACY
router.patch('/privacy', updatePrivacy);

// 9. UPLOAD AVATAR
router.post('/upload-avatar', uploadAvatar);

// 10. CONTACT SYNC
router.post('/contacts/sync', syncContacts);

// 11. CALL MANAGEMENT
router.get('/call-history', getCallHistory);
router.post('/calls/start', startCall);
router.patch('/calls/:callId/end', endCall);

// 12. APP LOCK PIN
router.post('/pin/set', setPin);
router.post('/pin/verify', verifyPin);

export default router;