import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';
import { ChatService } from './chat.service';

export const getChats = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const chats = await ChatService.getChats(req.user.id);
    res.json(chats);
});

export const getMessages = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await ChatService.getMessages(req.params.chatId, req.user.id, page, limit);
    res.json(messages);
});

export const sendMessage = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const message = await ChatService.sendMessage(
        req.user.id, 
        req.params.chatId, 
        req.body.content, 
        req.body.replyToId
    );
    res.json(message);
});

export const deleteMessage = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await ChatService.deleteMessage(req.user.id, req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
});

export const updateReactions = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await ChatService.updateReactions(req.params.messageId, req.user.id, req.body.emoji);
    res.json({ success: true, ...result });
});

export const toggleMuteChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await ChatService.toggleMuteChat(req.user.id, req.params.chatId);
    res.json(result);
});

export const updateChatSettings = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const chat = await ChatService.updateChatSettings(
        req.params.chatId, 
        req.body.settings, 
        req.body.selfDestructTimer
    );
    res.json({ success: true, chat });
});

export const getChatMedia = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const media = await ChatService.getChatMedia(req.params.chatId);
    res.json(media);
});

export const requestSecretChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    if (!req.body.targetUserId) return next(new AppError('targetUserId required', 400));
    const result = await ChatService.requestSecretChat(req.user.id, req.body.targetUserId);
    res.json({ success: true, ...result });
});

export const handleSecretChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { chatId, action } = req.body;
    if (!chatId || !action) return next(new AppError('chatId and action required', 400));
    
    const result = await ChatService.handleSecretChat(req.user.id, chatId, action);
    res.json({ success: true, status: result.status });
});

export const getFolders = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const folders = await ChatService.getFolders(req.user.id);
    res.json(folders);
});

export const createFolder = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    if (!req.body.name) return next(new AppError('Folder name required', 400));
    const folder = await ChatService.createFolder(req.user.id, req.body.name, req.body.chatIds);
    res.json(folder);
});

export const updateFolder = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const folder = await ChatService.updateFolder(
        req.user.id, 
        req.params.id, 
        req.body.name, 
        req.body.chatIds
    );
    res.json(folder);
});

export const deleteFolder = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await ChatService.deleteFolder(req.user.id, req.params.id);
    res.json({ success: true, message: 'Folder deleted' });
});

export const archiveChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await ChatService.archiveChat(req.user.id, req.params.chatId);
    res.json({ success: true, isArchived: result.isArchived });
});

export const pinChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await ChatService.pinChat(req.user.id, req.params.chatId);
    res.json({ success: true, isPinned: result.isPinned });
});

export const pinMessage = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await ChatService.pinMessage(req.params.chatId, req.params.messageId);
    res.json({ success: true, isPinned: result.isPinned });
});

export const createChat = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { isGroup, name, memberIds } = req.body;
    if (isGroup === undefined || !memberIds || !Array.isArray(memberIds)) {
        return next(new AppError('isGroup and memberIds (array) are required', 400));
    }
    const chat = await ChatService.createChat(req.user.id, isGroup, name || '', memberIds);
    res.json(chat);
});
