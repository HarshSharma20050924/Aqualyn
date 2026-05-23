import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { GroupService } from '../services/GroupService';
import prisma from '../config/prisma';

const router = Router();

/**
 * GROUP CREATION & MANAGEMENT ENDPOINTS
 */

// 1. CREATE GROUP
router.post('/create', verifyToken, async (req: any, res: any) => {
    const { name, participantIds, description } = req.body;
    try {
        const group = await GroupService.createGroup(req.user.id, name, participantIds || [], description);
        res.json({ success: true, group });
    } catch (e) {
        console.error('[GroupRoute] Creation error:', e);
        res.status(500).json({ error: 'Group creation failed' });
    }
});

// 2. JOIN VIA LINK
router.post('/join/:token', verifyToken, async (req: any, res: any) => {
    const { token } = req.params;
    try {
        const membership = await GroupService.joinByToken(req.user.id, token);
        res.json({ success: true, membership });
    } catch (e: any) {
        res.status(400).json({ error: e.message || 'Join failed' });
    }
});

// 3. UPDATE SETTINGS (RBAC Enforced)
router.patch('/:id/settings', verifyToken, async (req: any, res: any) => {
    const { id } = req.params;
    const { settings } = req.body;
    try {
        const group = await GroupService.updateSettings(req.user.id, id, settings);
        res.json({ success: true, group });
    } catch (e: any) {
        res.status(403).json({ error: e.message || 'Update failed' });
    }
});

// 4. MANAGE ROLES (Promote/Demote)
router.post('/:id/member/:targetId/role', verifyToken, async (req: any, res: any) => {
    const { id, targetId } = req.params;
    const { role } = req.body; // 'ADMIN' or 'MEMBER'
    try {
        const result = await GroupService.updateMemberRole(req.user.id, id, targetId, role);
        res.json({ success: true, result });
    } catch (e: any) {
        res.status(403).json({ error: 'Permission denied' });
    }
});

// 5. GET FULL GROUP INFO
router.get('/:id/info', verifyToken, async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const chat = await (prisma as any).chat.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, displayName: true, avatar: true, bio: true }
                        }
                    }
                }
            }
        });
        if (!chat) return res.status(404).json({ error: 'Group not found' });

        // Count media
        const messages = await (prisma as any).message.findMany({
            where: { chatId: id },
            select: { imageUrl: true, videoUrl: true, audioUrl: true, fileUrl: true, document: true }
        });
        let images = 0, videos = 0, docs = 0;
        for (const m of messages) {
            if (m.imageUrl) images++;
            if (m.videoUrl) videos++;
            if (m.fileUrl || m.document) docs++;
        }

        const admins = chat.participants.filter((p: any) => p.role === 'ADMIN' || p.role === 'OWNER');

        res.json({
            ...chat,
            settings: chat.settings || {},
            mediaCount: { images, videos, docs, total: images + videos + docs },
            adminCount: admins.length,
            participantCount: chat.participants.length
        });
    } catch (e) {
        console.error('[GroupRoute] Info error:', e);
        res.status(500).json({ error: 'Failed to get group info' });
    }
});

// 6. LEAVE GROUP
router.post('/:id/leave', verifyToken, async (req: any, res: any) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        await (prisma as any).chatParticipant.deleteMany({
            where: { chatId: id, userId }
        });
        res.json({ success: true, message: 'Left the group' });
    } catch (e) {
        console.error('[GroupRoute] Leave error:', e);
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

// 7. HANDLE GROUP INVITATION (Accept / Decline)
router.post('/:chatId/invitation/handle', verifyToken, async (req: any, res: any) => {
    const { chatId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    try {
        const result = await GroupService.handleInvitation(req.user.id, chatId, action);
        res.json({ success: true, result });
    } catch (e: any) {
        console.error('[GroupRoute] Invitation handle error:', e);
        res.status(500).json({ error: e.message || 'Invitation handle failed' });
    }
});

export default router;
