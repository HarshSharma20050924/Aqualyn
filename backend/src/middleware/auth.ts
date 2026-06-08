import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    // CHECK COOKIE FIRST, THEN HEADER
    const token = req.cookies.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    
    try {
        let decodedToken: any;
        
        try {
            decodedToken = jwt.verify(token, JWT_SECRET) as any;
        } catch (nativeErr) {
            console.error('[Auth] Token verification failed');
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        
        // Ensure either id (existing user) or uid (registration) is present
        if (!decodedToken.id && !decodedToken.uid) {
            return res.status(401).json({ error: 'Unauthorized: Malformed token payload' });
        }
        
        // Revocation check — fail-open if Redis is unavailable
        try {
            const { AuthService } = require('../modules/auth/auth.service');
            const isRevoked = await AuthService.isRevoked(token);
            if (isRevoked) {
                return res.status(401).json({ error: 'Unauthorized: Session revoked' });
            }
        } catch (revokeErr) {
            // Redis/AuthService unavailable — allow request through
            console.warn('[Auth] Revocation check skipped (Redis may be offline)');
        }
        
        (req as any).user = decodedToken;
        next();
    } catch (error: any) {
        return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }
};