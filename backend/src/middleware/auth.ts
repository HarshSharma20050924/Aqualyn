import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    // Check cookie first, then Authorization header
    const token = req.cookies.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    try {
        let decodedToken: any;

        // ── 1. Try our own JWT first ──
        try {
            decodedToken = jwt.verify(token, JWT_SECRET) as any;
        } catch (jwtErr) {
            // ── 2. Try Supabase access token ──
            try {
                const { data, error } = await supabaseAdmin.auth.getUser(token);
                if (error || !data?.user) {
                    console.error('[Auth] Supabase token verification failed:', error?.message);
                    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
                }
                const supaUser = data.user;
                // Build a compatible payload — look up our DB user by email
                const { default: prisma } = require('../config/prisma');
                const dbUser = await (prisma as any).user.findFirst({
                    where: { email: supaUser.email }
                });
                decodedToken = {
                    id: dbUser?.id || null,
                    uid: dbUser?.firebaseUid || `supabase-${supaUser.id}`,
                    email: supaUser.email,
                    phone_number: dbUser?.phone || null,
                    supabaseId: supaUser.id,
                    _fromSupabase: true
                };
            } catch (supErr) {
                console.error('[Auth] Token verification failed entirely');
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
        }

        // Ensure at least uid is present
        if (!decodedToken.id && !decodedToken.uid) {
            return res.status(401).json({ error: 'Unauthorized: Malformed token payload' });
        }

        // Revocation check — fail-open if Redis unavailable (skip for Supabase tokens)
        if (!decodedToken._fromSupabase) {
            try {
                const { AuthService } = require('../modules/auth/auth.service');
                const isRevoked = await AuthService.isRevoked(token);
                if (isRevoked) {
                    return res.status(401).json({ error: 'Unauthorized: Session revoked' });
                }
            } catch {
                console.warn('[Auth] Revocation check skipped (Redis may be offline)');
            }
        }

        (req as any).user = decodedToken;
        next();
    } catch (error: any) {
        return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }
};