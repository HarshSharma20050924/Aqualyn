import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { SocialService } from './social.service';
import { SearchService } from '../../services/SearchService';

export const globalSearch = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const q = req.query.q as string;
    if (!q) return res.json({ users: [], posts: [] });
    const results = await SearchService.globalSearch(q, req.user.id);
    res.json(results);
});

export const getFeed = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const cursor = req.query.cursor as string | undefined;
    const feed = await SocialService.getFeed(req.user.id, cursor);
    res.json(feed);
});

export const getActiveStories = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const stories = await SocialService.getActiveStories(req.user.id);
    res.json(stories);
});

export const getUserPosts = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const cursor = req.query.cursor as string | undefined;
    const posts = await SocialService.getUserPosts(req.params.userId, cursor);
    res.json(posts);
});

export const getUserStories = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const stories = await SocialService.getUserStories(req.params.userId);
    res.json(stories);
});

export const createPost = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { content, mediaUrl, mediaType } = req.body;
    const post = await SocialService.createPost(req.user.id, { content, mediaUrl, mediaType });
    res.json({ success: true, post });
});

export const deletePost = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await SocialService.deletePost(req.user.id, req.params.postId);
    res.json({ success: true, message: 'Post deleted' });
});

export const editPost = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const post = await SocialService.editPost(req.user.id, req.params.postId, req.body.content);
    res.json({ success: true, post });
});

export const createStory = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const { mediaUrl, mediaType, content } = req.body;
    const story = await SocialService.createStory(req.user.id, { mediaUrl, mediaType, content });
    res.json({ success: true, story });
});

export const deleteStory = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await SocialService.deleteStory(req.user.id, req.params.storyId);
    res.json({ success: true, message: 'Story deleted' });
});

export const toggleLike = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await SocialService.toggleLike(req.user.id, req.params.postId);
    res.json(result);
});

export const addComment = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const comment = await SocialService.addComment(req.user.id, req.params.postId, req.body.content);
    res.json({ success: true, comment });
});

export const deleteComment = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await SocialService.deleteComment(req.user.id, req.params.commentId);
    res.json({ success: true, message: 'Comment deleted successfully' });
});

export const toggleSavePost = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await SocialService.toggleSavePost(req.user.id, req.params.postId);
    res.json(result);
});

export const getSavedPosts = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const cursor = req.query.cursor as string | undefined;
    const saved = await SocialService.getSavedPosts(req.user.id, cursor);
    res.json(saved);
});

export const viewStory = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    await SocialService.viewStory(req.user.id, req.params.storyId);
    res.json({ success: true });
});

export const getComments = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const cursor = req.query.cursor as string | undefined;
    const comments = await SocialService.getComments(req.params.postId, cursor);
    res.json(comments);
});

export const replyToComment = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const reply = await SocialService.replyToComment(req.user.id, req.params.postId, req.params.commentId, req.body.content);
    res.json({ success: true, reply });
});

export const getPostLikes = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const cursor = req.query.cursor as string | undefined;
    const users = await SocialService.getPostLikes(req.params.postId, cursor);
    res.json(users);
});

export const getStoryViews = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const views = await SocialService.getStoryViews(req.user.id, req.params.storyId);
    res.json(views);
});

export const toggleCommentLike = catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const result = await SocialService.toggleCommentLike(req.user.id, req.params.commentId);
    res.json(result);
});