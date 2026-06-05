import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import prisma from '../config/prisma';
import { redis } from '../config/redis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

const router = Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ ADMIN SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/setup', async (req: any, res: any) => {
    try {
        const { email, password, name } = req.body;
        
        // 1. Check if an admin already exists
        const existingAdmin = await (prisma as any).user.findFirst({
            where: { role: 'admin' }
        });
        
        if (existingAdmin) {
            return res.status(403).json({ error: 'Admin already exists. Please login.' });
        }
        
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ error: 'Valid email and a password (min 6 chars) are required.' });
        }
        
        // 2. Hash password and create admin
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const adminUser = await (prisma as any).user.create({
            data: {
                email,
                password: hashedPassword,
                displayName: name || 'System Admin',
                role: 'admin',
                isPrivate: false
            }
        });
        
        // 3. Generate Token
        const token = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ success: true, message: 'Admin created', token });
    } catch (e) {
        console.error('[Admin] Setup error:', e);
        res.status(500).json({ error: 'Failed to setup admin' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 ADMIN LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/login', async (req: any, res: any) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Find admin by email and role
        const adminUser = await (prisma as any).user.findFirst({
            where: { email, role: 'admin' }
        });
        
        if (!adminUser || !adminUser.password) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        
        // Generate Token
        const token = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token, user: { id: adminUser.id, email: adminUser.email, name: adminUser.displayName } });
    } catch (e) {
        console.error('[Admin] Login error:', e);
        res.status(500).json({ error: 'Failed to process admin login' });
    }
});



// ✅ ADMIN MIDDLEWARE: Only allow admin users
const isAdmin = async (req: any, res: any, next: any) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        
        const user = await (prisma as any).user.findUnique({
            where: { id: userId }
        });
        
        if (user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
    } catch (e) {
        console.error('[AdminMiddleware] Error:', e);
        res.status(500).json({ error: 'Admin check failed' });
    }
};

router.use(verifyToken);
router.use(isAdmin);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 DASHBOARD STATS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/stats', async (req: any, res: any) => {
    try {
        const totalUsers = await (prisma as any).user.count();
        const totalChats = await (prisma as any).chat.count();
        const totalMessages = await (prisma as any).message.count();
        const totalPosts = await (prisma as any).post.count();
        
        const activeUsers = await (prisma as any).user.count({
            where: {
                lastLogin: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });
        
        res.json({
            totalUsers,
            activeUsers,
            totalChats,
            totalMessages,
            totalPosts,
            timestamp: new Date()
        });
    } catch (e) {
        console.error('[Admin] Stats error:', e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 USERS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Get all users (paginated)
router.get('/users', async (req: any, res: any) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const users = await (prisma as any).user.findMany({
            skip,
            take: limit,
            select: {
                id: true,
                email: true,
                phone: true,
                displayName: true,
                username: true,
                avatar: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                _count: {
                    select: { followers: true, following: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const total = await (prisma as any).user.count();
        
        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        console.error('[Admin] Get users error:', e);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Delete user and all their data
router.delete('/users/:userId', async (req: any, res: any) => {
    try {
        const { userId } = req.params;
        
        // Prevent self-deletion
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        
        // Delete user data: posts, messages, chats, follows, etc.
        await (prisma as any).$transaction([
            // Delete all messages sent by user
            (prisma as any).message.deleteMany({
                where: { senderId: userId }
            }),
            // Delete all posts by user
            (prisma as any).post.deleteMany({
                where: { authorId: userId }
            }),
            // Delete all comments by user
            (prisma as any).comment.deleteMany({
                where: { authorId: userId }
            }),
            // Remove from chats
            (prisma as any).chatParticipant.deleteMany({
                where: { userId }
            }),
            // Delete follow relationships
            (prisma as any).userFollows.deleteMany({
                where: { OR: [{ followerId: userId }, { followingId: userId }] }
            }),
            // Delete notifications
            (prisma as any).notification.deleteMany({
                where: { OR: [{ userId }, { actorId: userId }] }
            }),
            // Delete sessions
            (prisma as any).session.deleteMany({
                where: { userId }
            }),
            // Finally delete user
            (prisma as any).user.delete({
                where: { id: userId }
            })
        ]);
        
        res.json({ success: true, message: `User ${userId} deleted successfully` });
    } catch (e) {
        console.error('[Admin] Delete user error:', e);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Ban/Unban user
router.patch('/users/:userId/ban', async (req: any, res: any) => {
    try {
        const { userId } = req.params;
        const { banned } = req.body;
        
        const user = await (prisma as any).user.update({
            where: { id: userId },
            data: {
                settings: {
                    ...(await (prisma as any).user.findUnique({ where: { id: userId } }))?.settings || {},
                    banned: !!banned
                }
            }
        });
        
        res.json({ success: true, user });
    } catch (e) {
        console.error('[Admin] Ban user error:', e);
        res.status(500).json({ error: 'Failed to ban/unban user' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 CHATS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Get all chats
router.get('/chats', async (req: any, res: any) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const chats = await (prisma as any).chat.findMany({
            skip,
            take: limit,
            include: {
                participants: {
                    select: {
                        userId: true,
                        user: { select: { displayName: true, email: true } }
                    }
                },
                messages: { take: 1, orderBy: { createdAt: 'desc' } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        
        const total = await (prisma as any).chat.count();
        
        res.json({
            chats,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (e) {
        console.error('[Admin] Get chats error:', e);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get messages in a chat
router.get('/chats/:chatId/messages', async (req: any, res: any) => {
    try {
        const { chatId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        const messages = await (prisma as any).message.findMany({
            where: { chatId },
            skip,
            take: limit,
            include: {
                sender: { select: { id: true, displayName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const total = await (prisma as any).message.count({ where: { chatId } });
        
        res.json({
            messages,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (e) {
        console.error('[Admin] Get chat messages error:', e);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Delete a chat (soft delete or hard delete)
router.delete('/chats/:chatId', async (req: any, res: any) => {
    try {
        const { chatId } = req.params;
        const { hardDelete } = req.body; // If true, completely remove; if false, just archive
        
        if (hardDelete) {
            // Hard delete: remove all messages and chat
            await (prisma as any).$transaction([
                (prisma as any).message.deleteMany({ where: { chatId } }),
                (prisma as any).chatParticipant.deleteMany({ where: { chatId } }),
                (prisma as any).chat.delete({ where: { id: chatId } })
            ]);
        } else {
            // Soft delete: archive for all participants
            await (prisma as any).chat.update({
                where: { id: chatId },
                data: {
                    participants: {
                        updateMany: {
                            where: { chatId },
                            data: { isArchived: true }
                        }
                    }
                }
            });
        }
        
        res.json({ success: true, message: `Chat deleted (hardDelete: ${hardDelete})` });
    } catch (e) {
        console.error('[Admin] Delete chat error:', e);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Delete a specific message
router.delete('/messages/:messageId', async (req: any, res: any) => {
    try {
        const { messageId } = req.params;
        
        await (prisma as any).message.delete({
            where: { id: messageId }
        });
        
        res.json({ success: true, message: 'Message deleted' });
    } catch (e) {
        console.error('[Admin] Delete message error:', e);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 POSTS MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Get all posts
router.get('/posts', async (req: any, res: any) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const posts = await (prisma as any).post.findMany({
            skip,
            take: limit,
            include: {
                author: { select: { id: true, displayName: true, email: true } },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const total = await (prisma as any).post.count();
        
        res.json({
            posts,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (e) {
        console.error('[Admin] Get posts error:', e);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Delete a post
router.delete('/posts/:postId', async (req: any, res: any) => {
    try {
        const { postId } = req.params;
        
        await (prisma as any).$transaction([
            (prisma as any).comment.deleteMany({ where: { postId } }),
            (prisma as any).like.deleteMany({ where: { postId } }),
            (prisma as any).post.delete({ where: { id: postId } })
        ]);
        
        res.json({ success: true, message: 'Post deleted' });
    } catch (e) {
        console.error('[Admin] Delete post error:', e);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ DATABASE CLEANUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Hard reset: Delete all data (DANGEROUS!)
router.post('/reset-database', async (req: any, res: any) => {
    try {
        const { confirmReset } = req.body;
        
        if (confirmReset !== 'CONFIRM_RESET_ALL_DATA') {
            return res.status(400).json({ error: 'Confirmation required' });
        }
        
        console.warn('[Admin] ⚠️ HARD RESET INITIATED');
        
        await (prisma as any).$transaction([
            (prisma as any).message.deleteMany({}),
            (prisma as any).chatParticipant.deleteMany({}),
            (prisma as any).chat.deleteMany({}),
            (prisma as any).comment.deleteMany({}),
            (prisma as any).like.deleteMany({}),
            (prisma as any).post.deleteMany({}),
            (prisma as any).story.deleteMany({}),
            (prisma as any).notification.deleteMany({}),
            (prisma as any).userFollows.deleteMany({}),
            (prisma as any).session.deleteMany({}),
            // Keep users intact to preserve auth
        ]);
        
        res.json({ success: true, message: 'All data cleared (users preserved)' });
    } catch (e) {
        console.error('[Admin] Reset error:', e);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

// Clear old sessions (> 30 days)
router.post('/cleanup-sessions', async (req: any, res: any) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const result = await (prisma as any).session.deleteMany({
            where: {
                expiresAt: { lt: thirtyDaysAgo }
            }
        });
        
        res.json({ success: true, deleted: result.count });
    } catch (e) {
        console.error('[Admin] Cleanup error:', e);
        res.status(500).json({ error: 'Failed to cleanup sessions' });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 ANALYTICS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/analytics', async (req: any, res: any) => {
    try {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const newUsersThisWeek = await (prisma as any).user.count({
            where: { createdAt: { gte: lastWeek } }
        });
        
        const messagesThisWeek = await (prisma as any).message.count({
            where: { createdAt: { gte: lastWeek } }
        });
        
        const postsThisWeek = await (prisma as any).post.count({
            where: { createdAt: { gte: lastWeek } }
        });
        
        res.json({
            period: 'Last 7 days',
            newUsers: newUsersThisWeek,
            messages: messagesThisWeek,
            posts: postsThisWeek
        });
    } catch (e) {
        console.error('[Admin] Analytics error:', e);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

export default router;
