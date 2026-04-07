import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { loginOrRegister, getProfile } from '../controllers/authController';

const router = Router();

router.post('/sync', verifyFirebaseToken, loginOrRegister);
router.get('/profile', verifyFirebaseToken, getProfile);

router.post('/logout', verifyFirebaseToken, async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        const authHeader = req.headers.authorization;
        const token = authHeader.split('Bearer ')[1];
        
        const { AuthService } = require('../services/AuthService');
        await AuthService.logout(userId, token);

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (e) {
        console.error('[AuthRoute] Logout failed:', e);
        res.status(500).json({ error: 'Logout process failed on server' });
    }
});

export default router;
