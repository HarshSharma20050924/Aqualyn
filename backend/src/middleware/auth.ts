import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from '../config/firebaseAdmin';
import prisma from '../config/prisma'; // Imported prisma to handle local user lookups

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

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
                
                // Query local database for the matching user
                let localUser = await (prisma as any).user.findFirst({
                    where: {
                        OR: [
                            { email: firebaseUser.email }
                        ]
                    }
                });

                // Optional Fallback: Auto-provision a user if they exist in Firebase but not in DB yet
                if (!localUser && firebaseUser.email) {
                    localUser = await (prisma as any).user.create({
                        data: {
                            email: firebaseUser.email,
                            displayName: firebaseUser.name || 'New User',
                            phone: firebaseUser.phone_number || null,
                            searchByPhone: true,
                            isPrivate: false
                        }
                    });
                }

                decodedToken = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    phone_number: firebaseUser.phone_number,
                    id: localUser ? localUser.id : null // Automatically populates database ID
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