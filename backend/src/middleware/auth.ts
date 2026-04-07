import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[Auth] Inbound Request: ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Auth] Missing or invalid Authorization header | Headers:', JSON.stringify(req.headers));
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log(`[Auth] Inbound Token: ${token?.substring(0, 15)}...`);
    
    // DEVELOPMENT MOCK BYPASS
    if (token.startsWith('MOCK_TOKEN_')) {
        const email = token.replace('MOCK_TOKEN_', '');
        (req as any).user = {
            uid: `mock-uid-${email}`,
            email: email,
            phone_number: null
        };
        return next();
    }
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // 1. Check Global Revocation (Distributed-ready)
        const isRevoked = await (require('../services/AuthService')).AuthService.isRevoked(token);
        if (isRevoked) {
            return res.status(401).json({ error: 'Unauthorized: Session revoked' });
        }

        // 2. Bind the uid to the request (so we can use it in the controller)
        (req as any).user = decodedToken;
        next();
    } catch (error: any) {
        console.error('[Auth] Firebase token verification failed:', error.message || error);
        return res.status(401).json({ error: 'Unauthorized: Token verification failed', details: error.message });
    }
};
