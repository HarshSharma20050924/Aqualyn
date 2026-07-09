import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import prisma from '../../config/prisma';
import {
    setup,
    login,
    getStats,
    getAnalytics,
    getObservability,
    getUsers,
    deleteUser,
    banUser,
    getChats,
    deleteChat,
    getPosts,
    deletePost,
    getReports,
    resolveReport,
    resetDatabase,
    cleanupSessions
} from './admin.controller';

const router = Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC (No auth required)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/setup', setup);
router.post('/login', login);

// NOTE: force-reset-admin removed — it was an unauthenticated destructive endpoint.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const isAdmin = async (req: any, res: any, next: any) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        const user = await (prisma as any).user.findUnique({ where: { id: userId } });
        if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        next();
    } catch (e) {
        res.status(500).json({ error: 'Admin check failed' });
    }
};

router.use(verifyToken);
router.use((req: any, res: any, next: any) => {
    if (!req.user?.id) return res.status(403).json({ error: 'Profile setup incomplete' });
    next();
});
router.use(isAdmin);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/observability', getObservability);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USERS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/users', getUsers);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/ban', banUser);
// NOTE: /users/:userId/chats removed — E2E encrypted, admin must not browse per-user chats.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHATS MANAGEMENT (metadata only, no content)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/chats', getChats);
// NOTE: GET /chats/:chatId/messages removed — E2E encrypted, server must not expose message content.
// NOTE: DELETE /messages/:messageId removed — individual message access violates E2E guarantees.
router.delete('/chats/:chatId', deleteChat);  // Whole-chat delete for abuse/CSAM reports only.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POSTS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/posts', getPosts);
router.delete('/posts/:postId', deletePost);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPORTS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/reports', getReports);
router.patch('/reports/:reportId/resolve', resolveReport);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATABASE CLEANUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/reset-database', resetDatabase);
router.post('/cleanup-sessions', cleanupSessions);

export default router;
