import { Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';
import { AIService } from './ai.service';
import { ChatService } from '../chat/chat.service';

export const initiateLynChat = catchAsync(async (req: any, res: Response) => {
    const lyn = await AIService.ensureLynUser();
    const chat = await ChatService.createChat(req.user.id, false, 'Lyn', [lyn.id]);
    res.json(chat);
});

export const getSmartReplies = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { chatId } = req.body;
    if (!chatId) return next(new AppError('chatId is required', 400));
    const replies = await AIService.generateSmartReplies(chatId, req.user.id);
    res.json({ replies });
});

export const getChatSummary = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { chatId } = req.body;
    if (!chatId) return next(new AppError('chatId is required', 400));

    const raw = await AIService.generateSummary(chatId);

    const topicsText = raw.topics?.length ? `Topics: ${raw.topics.join(', ')}.` : '';
    const decisionsText = raw.decisions?.length ? ` Decisions: ${raw.decisions.join('; ')}.` : '';
    const summary = (topicsText + decisionsText).trim() || 'No notable topics or decisions found.';
    const sentiment = (raw.actionItems?.length || raw.decisions?.length) ? 'Productive & Action-Oriented' : 'Casual & Conversational';

    res.json({ summary, sentiment, actionItems: raw.actionItems || [], links: raw.links || [], topics: raw.topics || [], decisions: raw.decisions || [] });
});

export const searchMessagesNL = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { query } = req.body;
    if (!query) return next(new AppError('query is required', 400));
    const result = await AIService.searchMessages(req.user.id, query);
    res.json({ query, answer: result.answer, semanticMatches: result.results || [] });
});

export const lookupContactNL = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { query } = req.body;
    if (!query) return next(new AppError('query is required', 400));
    const result = await AIService.lookupContact(req.user.id, query);
    res.json({ query, answer: result.answer, results: result.contacts || [] });
});

export const draftResponse = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { chatId, personality } = req.body;
    if (!chatId) return next(new AppError('chatId is required', 400));
    const result = await AIService.draftResponse(chatId, req.user.id, personality || 'friendly');
    res.json(result);
});

export const discoverSimilarTopics = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { chatId } = req.body;
    if (!chatId) return next(new AppError('chatId is required', 400));
    const result = await AIService.discoverSimilarTopics(chatId, req.user.id);
    res.json(result);
});

// ── Lyn AI Settings (persisted in User.settings JSON) ─────────────────────
import prisma from '../../config/prisma';

export const getLynSettings = catchAsync(async (req: any, res: Response) => {
    const user = await (prisma as any).user.findUnique({
        where: { id: req.user.id },
        select: { settings: true },
    });
    const settings = (user?.settings as any) || {};
    res.json({
        aiEnabled:           settings.aiEnabled            ?? true,
        aiSuggestionsEnabled: settings.aiSuggestionsEnabled ?? true,
        lynPersonality:      settings.lynPersonality       ?? 'friendly',
        lynCustomPersonality: settings.lynCustomPersonality ?? '',
    });
});

export const updateLynSettings = catchAsync(async (req: any, res: Response) => {
    const { aiEnabled, aiSuggestionsEnabled, lynPersonality, lynCustomPersonality } = req.body;
    const user = await (prisma as any).user.findUnique({
        where: { id: req.user.id },
        select: { settings: true },
    });
    const existing = (user?.settings as any) || {};
    const updated = {
        ...existing,
        ...(aiEnabled !== undefined && { aiEnabled }),
        ...(aiSuggestionsEnabled !== undefined && { aiSuggestionsEnabled }),
        ...(lynPersonality !== undefined && { lynPersonality }),
        ...(lynCustomPersonality !== undefined && { lynCustomPersonality }),
    };
    await (prisma as any).user.update({
        where: { id: req.user.id },
        data: { settings: updated },
    });
    res.json(updated);
});

