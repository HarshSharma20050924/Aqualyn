import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import {
    initiateLynChat,
    getSmartReplies,
    getChatSummary,
    searchMessagesNL,
    lookupContactNL,
    draftResponse,
    discoverSimilarTopics,
    getLynSettings,
    updateLynSettings,
} from './ai.controller';

const router = Router();

router.use(verifyToken);
router.use((req: any, res: any, next: any) => {
    if (!req.user?.id) return res.status(403).json({ error: 'Profile setup incomplete' });
    next();
});

router.post('/chat/initiate', initiateLynChat);
router.post('/smart-reply',   getSmartReplies);
router.post('/summarize',     getChatSummary);
router.post('/search',        searchMessagesNL);
router.post('/contact',       lookupContactNL);
router.post('/draft',         draftResponse);
router.post('/discover',      discoverSimilarTopics);
router.get('/settings',       getLynSettings);
router.put('/settings',       updateLynSettings);

export default router;
