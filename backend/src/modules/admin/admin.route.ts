import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import prisma from '../../config/prisma';
import {
    setup,
    login,
    getStats,
    getAnalytics,
    getUsers,
    deleteUser,
    banUser,
    getChats,
    getChatMessages,
    deleteChat,
    deleteMessage,
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

// TEMPORARY: Wipes existing admins so you can start fresh. 
// Remove this after you use it in production!
router.post('/force-reset-admin', async (req: any, res: any) => {
    try {
        const deleted = await (prisma as any).user.deleteMany({ where: { role: 'admin' } });
        res.json({ message: 'Previous admins deleted successfully', count: deleted.count, nextStep: 'Call /api/admin/setup to create your new JWT Admin' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

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
router.use(isAdmin);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USERS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/users', getUsers);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/ban', banUser);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHATS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/chats', getChats);
router.get('/chats/:chatId/messages', getChatMessages);
router.delete('/chats/:chatId', deleteChat);
router.delete('/messages/:messageId', deleteMessage);

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
