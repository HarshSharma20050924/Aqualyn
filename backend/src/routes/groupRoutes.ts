import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { GroupService } from '../services/GroupService';
import prisma from '../config/prisma';

const router = Router();

/**
 * GROUP CREATION & MANAGEMENT ENDPOINTS
 */

// 1. CREATE GROUP
router.post('/create', verifyFirebaseToken, async (req: any, res: any) => {
    const { name, participantIds, description } = req.body;
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const group = await GroupService.createGroup(user.id, name, participantIds || [], description);
        res.json({ success: true, group });
    } catch (e) {
        console.error('[GroupRoute] Creation error:', e);
        res.status(500).json({ error: 'Group creation failed' });
    }
});

// 2. JOIN VIA LINK
router.post('/join/:token', verifyFirebaseToken, async (req: any, res: any) => {
    const { token } = req.params;
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const membership = await GroupService.joinByToken(user.id, token);
        res.json({ success: true, membership });
    } catch (e: any) {
        res.status(400).json({ error: e.message || 'Join failed' });
    }
});

// 3. UPDATE SETTINGS (RBAC Enforced)
router.patch('/:id/settings', verifyFirebaseToken, async (req: any, res: any) => {
    const { id } = req.params;
    const { settings } = req.body;
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const group = await GroupService.updateSettings(user.id, id, settings);
        res.json({ success: true, group });
    } catch (e: any) {
        res.status(403).json({ error: e.message || 'Update failed' });
    }
});

// 4. MANAGE ROLES (Promote/Demote)
router.post('/:id/member/:targetId/role', verifyFirebaseToken, async (req: any, res: any) => {
    const { id, targetId } = req.params;
    const { role } = req.body; // 'ADMIN' or 'MEMBER'
    try {
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: req.user.uid },
            select: { id: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const result = await GroupService.updateMemberRole(user.id, id, targetId, role);
        res.json({ success: true, result });
    } catch (e: any) {
        res.status(403).json({ error: 'Permission denied' });
    }
});

export default router;
