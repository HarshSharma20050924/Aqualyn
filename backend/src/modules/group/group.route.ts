import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import {
    createGroup,
    joinByToken,
    updateSettings,
    updateMemberRole,
    getGroupInfo,
    leaveGroup,
    handleInvitation
} from './group.controller';

const router = Router();

router.use(verifyToken);

/**
 * GROUP CREATION & MANAGEMENT ENDPOINTS
 */

// 1. CREATE GROUP
router.post('/create', createGroup);

// 2. JOIN VIA LINK
router.post('/join/:token', joinByToken);

// 3. UPDATE SETTINGS (RBAC Enforced)
router.patch('/:id/settings', updateSettings);

// 4. MANAGE ROLES (Promote/Demote)
router.post('/:id/member/:targetId/role', updateMemberRole);

// 5. GET FULL GROUP INFO
router.get('/:id/info', getGroupInfo);

// 6. LEAVE GROUP
router.post('/:id/leave', leaveGroup);

// 7. HANDLE GROUP INVITATION (Accept / Decline)
router.post('/:chatId/invitation/handle', handleInvitation);

export default router;
