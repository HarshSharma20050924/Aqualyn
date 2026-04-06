import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { loginOrRegister, getProfile } from '../controllers/authController';

const router = Router();

router.post('/sync', verifyFirebaseToken, loginOrRegister);
router.get('/profile', verifyFirebaseToken, getProfile);

export default router;
