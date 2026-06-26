import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
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

router.get('/',           listChannels);
router.post('/',          createChannel);
router.get('/:id',        getChannel);
router.delete('/:id',     deleteChannel);
router.post('/:id/join',  joinChannel);
router.post('/:id/leave', leaveChannel);
router.get('/:id/posts',  getChannelPosts);
router.post('/:id/posts', createChannelPost);

export default router;
