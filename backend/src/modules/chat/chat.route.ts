import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import {
    getChats,
    getMessages,
    sendMessage,
    deleteMessage,
    updateReactions,
    toggleMuteChat,
    updateChatSettings,
    getChatMedia,
    requestSecretChat,
    handleSecretChat,
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    archiveChat,
    pinChat,
    pinMessage
} from './chat.controller';

const router = Router();

router.use(verifyToken);

// Folders (Specific routes first)
router.get('/folders', getFolders);
router.post('/folders', createFolder);
router.put('/folders/:id', updateFolder);
router.delete('/folders/:id', deleteFolder);

// Secret Chats
router.post('/secret/request', requestSecretChat);
router.post('/secret/handle', handleSecretChat);

// Chat list
router.get('/', getChats);

// Messages
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', sendMessage);
router.delete('/:chatId/messages/:messageId', deleteMessage);
router.post('/:chatId/messages/:messageId/reactions', updateReactions);
router.post('/:chatId/messages/:messageId/pin', pinMessage);

// Chat Actions
router.post('/:chatId/mute', toggleMuteChat);
router.patch('/:chatId/settings', updateChatSettings);
router.get('/:chatId/media', getChatMedia);
router.post('/:chatId/archive', archiveChat);
router.post('/:chatId/pin', pinChat);

export default router;
