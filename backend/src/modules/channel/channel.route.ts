import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { cacheResponse } from '../../core/middlewares/cache.middleware';
import {
    listChannels,
    getChannel,
    createChannel,
    joinChannel,
    leaveChannel,
    getChannelPosts,
    createChannelPost,
    deleteChannel,
} from './channel.controller';

const router = Router();
router.use(verifyToken);

router.get('/',           cacheResponse(30), listChannels);
router.post('/',          createChannel);
router.get('/:id',        cacheResponse(30), getChannel);
router.delete('/:id',     deleteChannel);
router.post('/:id/join',  joinChannel);
router.post('/:id/leave', leaveChannel);
router.get('/:id/posts',  cacheResponse(30), getChannelPosts);
router.post('/:id/posts', createChannelPost);

export default router;
