import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';
import { GroupService } from './group.service';

export const createGroup = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { name, participantIds, description } = req.body;
    const group = await GroupService.createGroup(req.user.id, name, participantIds || [], description);
    res.json({ success: true, group });
});

export const joinByToken = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const membership = await GroupService.joinByToken(req.user.id, req.params.token);
    res.json({ success: true, membership });
});

export const updateSettings = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const group = await GroupService.updateSettings(req.user.id, req.params.id, req.body.settings);
    res.json({ success: true, group });
});

export const updateMemberRole = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await GroupService.updateMemberRole(req.user.id, req.params.id, req.params.targetId, req.body.role);
    res.json({ success: true, result });
});

export const getGroupInfo = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const info = await GroupService.getFullGroupInfo(req.params.id);
    res.json(info);
});

export const leaveGroup = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await GroupService.leaveGroup(req.user.id, req.params.id);
    res.json({ success: true, message: 'Left the group' });
});

export const handleInvitation = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await GroupService.handleInvitation(req.user.id, req.params.chatId, req.body.action);
    res.json({ success: true, result });
});
