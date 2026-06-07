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

// 1. GLOBAL SEARCH (Users + Posts)
router.get('/search', globalSearch);

// 2. GET SOCIAL FEED (Posts from following)
router.get('/feed', getFeed);

// 3. GET ACTIVE STORIES (24h)
router.get('/stories', getActiveStories);

// 3b. GET USER POSTS
router.get('/user/:userId/posts', getUserPosts);

// 3c. GET USER STORIES
router.get('/user/:userId/stories', getUserStories);

// 9. GET SAVED POSTS (before dynamic :postId routes)
router.get('/saved-posts', getSavedPosts);

/**
 * CREATION & MODIFICATION ENDPOINTS
 */

// 4. CREATE POST
router.post('/post', createPost);

// 4b. DELETE POST
router.delete('/post/:postId', deletePost);

// 4c. EDIT POST
router.patch('/post/:postId', editPost);

// 5. CREATE STORY
router.post('/story', createStory);

// 5b. DELETE STORY
router.delete('/story/:storyId', deleteStory);

// 6. TOGGLE LIKE
router.post('/post/:postId/like', toggleLike);

// 7. ADD COMMENT
router.post('/post/:postId/comment', addComment);

// 7b. GET COMMENTS (with nested replies)
router.get('/post/:postId/comments', getComments);

// 7c. REPLY TO COMMENT
router.post('/post/:postId/comment/:commentId/reply', replyToComment);

// 7d. LIKE / UNLIKE A COMMENT
router.post('/comment/:commentId/like', toggleCommentLike);

// 8. GET POST LIKES LIST (who liked this post)
router.get('/post/:postId/likes', getPostLikes);

// 8b. SAVE POST
router.post('/post/:postId/save', toggleSavePost);

// 10. VIEW STORY
router.post('/story/:storyId/view', viewStory);

// 11. GET STORY VIEWS (who viewed this story)
router.get('/story/:storyId/views', getStoryViews);

export default router;