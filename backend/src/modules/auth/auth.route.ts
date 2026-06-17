import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { login, register, getProfile, sendOtp, verifyOtp, syncToken, googleSignin } from './auth.controller';

const router = Router();

router.post('/login', verifyToken, login);
router.post('/register', verifyToken, register);
router.post('/sync', verifyToken, require('./auth.controller').sync);
router.post('/sync-token', verifyToken, syncToken);
router.get('/profile', verifyToken, getProfile);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google-signin', googleSignin);

router.post('/logout', verifyToken, async (req: any, res: any) => {
    try {
        const userId = req.user.uid;
        // In verifyToken middleware we already extracted the token
        // Let's get it again or pass it through req
        const token = req.cookies.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
        
        if (token) {
            const { AuthService } = require('./auth.service');
            await AuthService.logout(userId, token);
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (e) {
        console.error('[AuthRoute] Logout failed:', e);
        res.status(500).json({ error: 'Logout process failed on server' });
    }
});

export default router;

