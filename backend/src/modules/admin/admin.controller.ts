import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { AdminService } from './admin.service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH (No admin middleware needed)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const setup = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.setup(req.body.email, req.body.password, req.body.name);
    res.status(201).json({ success: true, message: 'Admin created', ...result });
});

export const login = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.login(req.body.email, req.body.password);
    res.json({ success: true, ...result });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getStats = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const stats = await AdminService.getStats();
    res.json(stats);
});

export const getAnalytics = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const analytics = await AdminService.getAnalytics();
    res.json(analytics);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getUsers = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await AdminService.getUsers(page, limit);
    res.json(result);
});

export const deleteUser = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.deleteUser(req.user.id, req.params.userId);
    res.json({ success: true, ...result });
});

export const banUser = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const user = await AdminService.banUser(req.params.userId, req.body.banned);
    res.json({ success: true, user });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHATS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getChats = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await AdminService.getChats(page, limit);
    res.json(result);
});

export const getChatMessages = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await AdminService.getChatMessages(req.params.chatId, page, limit);
    res.json(result);
});

export const deleteChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.deleteChat(req.params.chatId, req.body.hardDelete);
    res.json({ success: true, ...result });
});

export const deleteMessage = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.deleteMessage(req.params.messageId);
    res.json({ success: true, ...result });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POSTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getPosts = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await AdminService.getPosts(page, limit);
    res.json(result);
});

export const deletePost = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.deletePost(req.params.postId);
    res.json({ success: true, ...result });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getReports = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const result = await AdminService.getReports(page, limit, status);
    res.json(result);
});

export const resolveReport = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.resolveReport(req.params.reportId, req.body.action, req.body.adminNotes);
    res.json({ success: true, report: result });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLEANUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const resetDatabase = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.resetDatabase(req.body.confirmReset);
    res.json({ success: true, ...result });
});

export const cleanupSessions = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await AdminService.cleanupSessions();
    res.json({ success: true, ...result });
});
