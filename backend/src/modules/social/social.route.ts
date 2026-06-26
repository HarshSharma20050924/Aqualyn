import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import {
    globalSearch,
    getFeed,
    getActiveStories,
    getUserPosts,
    getUserStories,
    createPost,
    deletePost,
    editPost,
    createStory,
    deleteStory,
    toggleLike,
    addComment,
    deleteComment,
    toggleSavePost,
    getSavedPosts,
    viewStory,
    getComments,
    replyToComment,
    getPostLikes,
    getStoryViews,
    toggleCommentLike
} from './social.controller';

const router = Router();

router.use(verifyToken);
router.use((req: any, res: any, next: any) => {
    if (!req.user?.id) return res.status(403).json({ error: 'Profile setup incomplete' });
    next();
});

/**
 * SOCIAL & FEED ENDPOINTS
 */
router.get('/search', globalSearch);
router.get('/feed', getFeed);
router.get('/stories', getActiveStories);
router.get('/user/:userId/posts', getUserPosts);
router.get('/user/:userId/stories', getUserStories);
router.get('/saved-posts', getSavedPosts);

/**
 * CREATION & MODIFICATION ENDPOINTS
 */
router.post('/post', createPost);
router.delete('/post/:postId', deletePost);
router.patch('/post/:postId', editPost);

router.post('/story', createStory);
router.delete('/story/:storyId', deleteStory);
router.post('/story/:storyId/view', viewStory);
router.get('/story/:storyId/views', getStoryViews);

router.post('/post/:postId/like', toggleLike);
router.get('/post/:postId/likes', getPostLikes);
router.post('/post/:postId/save', toggleSavePost);

router.post('/post/:postId/comment', addComment);
router.get('/post/:postId/comments', getComments);
router.post('/post/:postId/comment/:commentId/reply', replyToComment);
router.delete('/comment/:commentId', deleteComment);
router.post('/comment/:commentId/like', toggleCommentLike);

export default router;