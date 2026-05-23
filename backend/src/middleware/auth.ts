import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

import admin from '../config/firebaseAdmin';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    // CHECK COOKIE FIRST, THEN HEADER
    const token = req.cookies.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    
    try {
        let decodedToken: any;
        
        // Try native JWT first
        try {
            decodedToken = jwt.verify(token, JWT_SECRET) as any;
        } catch (nativeErr) {
            // If native fails, try Firebase (for Google Sign-in flow)
            try {
                const firebaseUser = await admin.auth().verifyIdToken(token);
                decodedToken = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    phone_number: firebaseUser.phone_number,
                    id: null // Will be looked up in controller
                };
            } catch (firebaseErr: any) {
                console.error('[Auth] Native & Firebase verification failed');
                throw new Error('Invalid token');
            }
        }
        
        // Ensure either id (existing user) or uid (registration) is present
        if (!decodedToken.id && !decodedToken.uid) {
            return res.status(401).json({ error: 'Unauthorized: Malformed token payload' });
        }
        
        const isRevoked = await (require('../services/AuthService')).AuthService.isRevoked(token);
        if (isRevoked) {
            return res.status(401).json({ error: 'Unauthorized: Session revoked' });
        }
        
        (req as any).user = decodedToken;
        next();
    } catch (error: any) {
        return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }
};
