import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { SettingsService } from '../../services/SettingsService';
import { UserService } from './user.service';

export const getSettings = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const settings = await SettingsService.getSettings(req.user.id);
    res.json(settings);
});

export const updateSettings = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const updatedSettings = await SettingsService.updateSettings(req.user.id, req.body);
    res.json({ success: true, settings: updatedSettings });
});

export const getSessions = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const sessions = await SettingsService.getActiveSessions(req.user.id);
    res.json(sessions);
});

export const revokeSession = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await SettingsService.revokeSession(req.user.id, req.params.id);
    res.json({ success: true });
});

export const getStorageUsage = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const usage = await SettingsService.getStorageUsage(req.user.id);
    res.json(usage);
});

export const exportData = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    res.json({ success: true, message: 'Data export initiated. You will be notified when it is ready for download.' });
});

export const getProfile = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const profile = await UserService.getProfile(req.params.userId);
    res.json(profile);
});

export const updateProfile = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.updateProfile(req.user.id, req.body);
    res.json(result);
});

export const blockUser = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.blockUser(req.user.id, req.body.targetUserId);
    res.json(result);
});

export const reportUser = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.reportUser(req.user.id, req.body.targetUserId, req.body.reason);
    res.json(result);
});

export const getBlockedUsers = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const blocked = await UserService.getBlockedUsers(req.user.id);
    res.json(blocked);
});

export const updatePrivacy = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const updated = await UserService.updatePrivacy(req.user.id, req.body);
    res.json(updated);
});

export const uploadAvatar = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.uploadAvatar(req.user.id, req.body.avatar);
    res.json(result);
});

export const syncContacts = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const matches = await UserService.syncContacts(req.user.id, req.body.phones);
    res.json(matches);
});

export const getCallHistory = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await UserService.getCallHistory(req.user.id, page, limit);
    res.json(history);
});

export const setPin = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.setPin(req.user.id, req.body.pin);
    res.json(result);
});

export const verifyPin = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.verifyPin(req.user.id, req.body.pin);
    res.json(result);
});

export const followUser = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.followUser(req.user.id, req.body.targetUserId);
    res.json(result);
});

export const unfollowUser = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.unfollowUser(req.user.id, req.body.targetUserId);
    res.json(result);
});

export const handleFollowRequest = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.handleFollowRequest(req.user.id, req.body.requestId, req.body.senderId, req.body.action);
    res.json(result);
});

export const getNotifications = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const notifications = await UserService.getNotifications(req.user.id);
    res.json(notifications);
});

export const markNotificationsRead = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.markNotificationsRead(req.user.id);
    res.json(result);
});

export const getFollowersList = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const followers = await UserService.getFollowersList(req.params.userId);
    res.json(followers);
});

export const getFollowingList = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const following = await UserService.getFollowingList(req.params.userId);
    res.json(following);
});

export const startCall = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const call = await UserService.startCall(req.user.id, req.body.calleeId, req.body.type);
    res.json({ success: true, call });
});

export const endCall = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const call = await UserService.endCall(req.user.id, req.params.callId, req.body.status);
    res.json({ success: true, call });
});

export const getActivityFeed = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const cursor = req.query.cursor as string | undefined;
    const activities = await UserService.getActivityFeed(req.user.id, cursor);
    res.json(activities);
});

export const markActivityRead = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await UserService.markActivityRead(req.user.id, req.body.activityIds);
    res.json(result);
});

