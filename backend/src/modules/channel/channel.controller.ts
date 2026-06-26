import { Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';
import { ChannelService } from './channel.service';

// ── List / Search channels ─────────────────────────────────────────────────
export const listChannels = catchAsync(async (req: any, res: Response) => {
    const { category, search, type, limit, cursor, discoverable } = req.query;
    const channels = await ChannelService.listChannels({
        category: category as string,
        search: search as string,
        type: type as any,
        discoverable: discoverable ? discoverable === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : 30,
        cursor: cursor as string,
    }, req.user?.id);
    res.json(channels);
});

// ── Get single channel ────────────────────────────────────────────────────
export const getChannel = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(new AppError('Channel ID required', 400));
    const channel = await ChannelService.getChannel(id, req.user.id);
    res.json(channel);
});

// ── Create channel ────────────────────────────────────────────────────────
export const createChannel = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { name, handle, description, category, type, isDiscoverable } = req.body;
    if (!name || !handle) return next(new AppError('name and handle are required', 400));
    const channel = await ChannelService.createChannel(req.user.id, {
        name, handle, description, category, type, isDiscoverable,
    });
    res.status(201).json(channel);
});

// ── Join channel ──────────────────────────────────────────────────────────
export const joinChannel = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(new AppError('Channel ID required', 400));
    const result = await ChannelService.joinChannel(id, req.user.id);
    res.json(result);
});

// ── Leave channel ─────────────────────────────────────────────────────────
export const leaveChannel = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(new AppError('Channel ID required', 400));
    const result = await ChannelService.leaveChannel(id, req.user.id);
    res.json(result);
});

// ── Get channel posts ─────────────────────────────────────────────────────
export const getChannelPosts = catchAsync(async (req: any, res: Response) => {
    const { id } = req.params;
    const { limit, cursor } = req.query;
    const posts = await ChannelService.getChannelPosts(
        id,
        limit ? parseInt(limit as string) : 20,
        cursor as string,
    );
    res.json(posts);
});

// ── Create channel post ───────────────────────────────────────────────────
export const createChannelPost = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { content, mediaUrl, mediaType } = req.body;
    if (!content && !mediaUrl) return next(new AppError('content or mediaUrl required', 400));
    const post = await ChannelService.createChannelPost(id, req.user.id, { content, mediaUrl, mediaType });
    res.status(201).json(post);
});

// ── Delete channel ────────────────────────────────────────────────────────
export const deleteChannel = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(new AppError('Channel ID required', 400));
    const result = await ChannelService.deleteChannel(id, req.user.id);
    res.json(result);
});
