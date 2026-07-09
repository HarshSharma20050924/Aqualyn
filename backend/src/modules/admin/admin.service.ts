import prisma from '../../config/prisma';
import { AppError } from '../../core/exceptions/AppError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

export class AdminService {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AUTH
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async setup(email: string, password: string, name?: string) {
        if (!email || !password || password.length < 6) {
            throw new AppError('Valid email and a password (min 6 chars) are required.', 400);
        }

        const existingAdminsCount = await (prisma as any).user.count({ where: { role: 'admin' } });
        const existingAdmin = await (prisma as any).user.findFirst({ where: { role: 'admin', email } });
        const hashedPassword = await bcrypt.hash(password, 10);
        let adminUser;

        if (existingAdmin) {
            // If admin exists but has no password (legacy Firebase admin), allow setting password
            if (!existingAdmin.password) {
                adminUser = await (prisma as any).user.update({
                    where: { id: existingAdmin.id },
                    data: { password: hashedPassword, displayName: name || existingAdmin.displayName }
                });
            } else {
                throw new AppError('An admin with this email already exists. Please login.', 403);
            }
        } else {
            if (existingAdminsCount >= 5) {
                throw new AppError('Maximum limit of 5 admin accounts reached.', 403);
            }
            adminUser = await (prisma as any).user.create({
                data: {
                    email,
                    password: hashedPassword,
                    displayName: name || 'System Admin',
                    role: 'admin',
                    isPrivate: false
                }
            });
        }

        const token = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { token };
    }

    static async login(email: string, password: string) {
        if (!email || !password) throw new AppError('Email and password required', 400);

        const adminUser = await (prisma as any).user.findFirst({ where: { email, role: 'admin' } });
        if (!adminUser || !adminUser.password) throw new AppError('Invalid admin credentials', 401);

        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) throw new AppError('Invalid admin credentials', 401);

        const token = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: { id: adminUser.id, email: adminUser.email, name: adminUser.displayName }
        };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DASHBOARD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async getStats() {
        const [totalUsers, totalChats, totalMessages, totalPosts, activeUsers] = await Promise.all([
            (prisma as any).user.count(),
            (prisma as any).chat.count(),
            (prisma as any).message.count(),
            (prisma as any).post.count(),
            (prisma as any).user.count({
                where: { lastLogin: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            })
        ]);

        return { totalUsers, activeUsers, totalChats, totalMessages, totalPosts, timestamp: new Date() };
    }

    static async getAnalytics() {
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [newUsers, messages, posts] = await Promise.all([
            (prisma as any).user.count({ where: { createdAt: { gte: lastWeek } } }),
            (prisma as any).message.count({ where: { createdAt: { gte: lastWeek } } }),
            (prisma as any).post.count({ where: { createdAt: { gte: lastWeek } } })
        ]);

        return { period: 'Last 7 days', newUsers, messages, posts };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OBSERVABILITY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async getObservability() {
        const now = new Date();
        // Build last 7 days labels + date ranges
        const days: { label: string; start: Date; end: Date }[] = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            days.push({
                label: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                start,
                end,
            });
        }

        // Parallel per-day queries
        const [userSignups, messageCounts, postCounts] = await Promise.all([
            Promise.all(
                days.map(d =>
                    (prisma as any).user.count({ where: { createdAt: { gte: d.start, lte: d.end } } })
                )
            ),
            Promise.all(
                days.map(d =>
                    (prisma as any).message.count({ where: { createdAt: { gte: d.start, lte: d.end } } })
                )
            ),
            Promise.all(
                days.map(d =>
                    (prisma as any).post.count({ where: { createdAt: { gte: d.start, lte: d.end } } })
                )
            ),
        ]);

        const growthSeries = days.map((d, i) => ({
            label: d.label,
            users: userSignups[i],
            messages: messageCounts[i],
            posts: postCounts[i],
        }));

        // Totals for quick display
        const totalNewUsers = userSignups.reduce((a, b) => a + b, 0);
        const totalMessages7d = messageCounts.reduce((a, b) => a + b, 0);
        const totalPosts7d = postCounts.reduce((a, b) => a + b, 0);

        // Peak day
        let peakDay = growthSeries[0];
        for (const day of growthSeries) {
            if (day.messages > peakDay.messages) peakDay = day;
        }

        // Avg messages per day
        const avgMessagesPerDay = totalMessages7d > 0
            ? Math.round(totalMessages7d / 7)
            : 0;

        // Recent 5 users (as "recent activity" feed)
        const recentUsers = await (prisma as any).user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, displayName: true, email: true, createdAt: true, role: true }
        });

        // NOTE: E2E encrypted — message content is NOT accessible to admin.

        return {
            period: 'Last 7 days',
            growthSeries,
            summary: {
                newUsers: totalNewUsers,
                messages: totalMessages7d,
                posts: totalPosts7d,
                avgMessagesPerDay,
                peakDay: peakDay.label,
                peakMessages: peakDay.messages,
            },
            recentActivity: {
                users: recentUsers,
                // messages intentionally omitted — E2E encrypted, not accessible
            },
            generatedAt: now,
        };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // USERS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async getUsers(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            (prisma as any).user.findMany({
                skip,
                take: limit,
                select: {
                    id: true, email: true, phone: true, displayName: true,
                    username: true, avatar: true, role: true, createdAt: true, lastLogin: true,
                    _count: { select: { followers: true, following: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            (prisma as any).user.count()
        ]);

        return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async deleteUser(adminId: string, userId: string) {
        if (userId === adminId) throw new AppError('Cannot delete yourself', 400);

        await (prisma as any).$transaction([
            (prisma as any).message.deleteMany({ where: { senderId: userId } }),
            (prisma as any).post.deleteMany({ where: { authorId: userId } }),
            (prisma as any).comment.deleteMany({ where: { userId } }),
            (prisma as any).chatParticipant.deleteMany({ where: { userId } }),
            (prisma as any).userFollows.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
            (prisma as any).notification.deleteMany({ where: { OR: [{ userId }, { actorId: userId }] } }),
            (prisma as any).session.deleteMany({ where: { userId } }),
            (prisma as any).user.delete({ where: { id: userId } })
        ]);

        return { message: `User ${userId} deleted successfully` };
    }

    static async banUser(userId: string, banned: boolean) {
        const user = await (prisma as any).user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);

        const currentSettings = (user.settings as any) || {};
        return await (prisma as any).user.update({
            where: { id: userId },
            data: { settings: { ...currentSettings, banned: !!banned } }
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CHATS (metadata only — E2E encrypted, no message content exposed)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async getChats(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [chats, total] = await Promise.all([
            (prisma as any).chat.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    isGroup: true,
                    createdAt: true,
                    updatedAt: true,
                    // participant count only — no user PII, no message content
                    _count: { select: { participants: true, messages: true } }
                },
                orderBy: { updatedAt: 'desc' }
            }),
            (prisma as any).chat.count()
        ]);

        return { chats, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    // getChatMessages intentionally removed — messages are E2E encrypted and must
    // never be readable by the server or admin.

    static async deleteChat(chatId: string, hardDelete: boolean) {
        if (hardDelete) {
            await (prisma as any).$transaction([
                (prisma as any).message.deleteMany({ where: { chatId } }),
                (prisma as any).chatParticipant.deleteMany({ where: { chatId } }),
                (prisma as any).chat.delete({ where: { id: chatId } })
            ]);
        } else {
            await (prisma as any).chat.update({
                where: { id: chatId },
                data: {
                    participants: {
                        updateMany: { where: { chatId }, data: { isArchived: true } }
                    }
                }
            });
        }
        return { message: `Chat deleted (hardDelete: ${hardDelete})` };
    }

    // deleteMessage intentionally removed — individual message access violates E2E guarantees.

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // POSTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async getPosts(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            (prisma as any).post.findMany({
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, displayName: true, email: true } },
                    _count: { select: { likes: true, comments: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            (prisma as any).post.count()
        ]);

        return { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async deletePost(postId: string) {
        await (prisma as any).$transaction([
            (prisma as any).comment.deleteMany({ where: { postId } }),
            (prisma as any).like.deleteMany({ where: { postId } }),
            (prisma as any).post.delete({ where: { id: postId } })
        ]);
        return { message: 'Post deleted' };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // REPORTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async getReports(page: number, limit: number, status?: string) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};

        const [reports, total] = await Promise.all([
            (prisma as any).report.findMany({
                where,
                skip,
                take: limit,
                include: {
                    reporter: { select: { id: true, displayName: true, username: true, avatar: true } },
                    reported: { select: { id: true, displayName: true, username: true, avatar: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            (prisma as any).report.count({ where })
        ]);

        return { reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async resolveReport(reportId: string, action: string, adminNotes?: string) {
        if (!action) throw new AppError('action is required (dismiss, warn, ban)', 400);

        const report = await (prisma as any).report.findUnique({ where: { id: reportId } });
        if (!report) throw new AppError('Report not found', 404);

        // Update report status
        const updated = await (prisma as any).report.update({
            where: { id: reportId },
            data: {
                status: action === 'dismiss' ? 'dismissed' : 'resolved',
                ...(adminNotes && { adminNotes })
            }
        });

        // If action is ban, ban the reported user
        if (action === 'ban') {
            const user = await (prisma as any).user.findUnique({ where: { id: report.reportedId } });
            if (user) {
                const currentSettings = (user.settings as any) || {};
                await (prisma as any).user.update({
                    where: { id: report.reportedId },
                    data: { settings: { ...currentSettings, banned: true } }
                });
            }
        }

        return updated;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CLEANUP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    static async resetDatabase(confirmReset: string) {
        if (confirmReset !== 'CONFIRM_RESET_ALL_DATA') {
            throw new AppError('Confirmation required', 400);
        }

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
            (prisma as any).session.deleteMany({})
        ]);

        return { message: 'All data cleared (users preserved)' };
    }

    static async cleanupSessions() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await (prisma as any).session.deleteMany({
            where: { expiresAt: { lt: thirtyDaysAgo } }
        });
        return { deleted: result.count };
    }
}
