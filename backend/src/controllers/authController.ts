import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { redis } from '../config/redis';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';
import { v4 as uuidv4 } from 'uuid';

export const sendOtp = async (req: Request, res: Response): Promise<Response | any> => {
    try {
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ error: 'Identifier is required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(`otp:${identifier}`, otp, 'EX', 300); // 5 min expiry
        
        console.log(`[Auth] Generated OTP for ${identifier}: ${otp}`);

        // Check if user exists
        const isEmail = identifier.includes('@');
        const user = await (prisma as any).user.findFirst({
            where: isEmail ? { email: identifier } : { phone: identifier }
        });

        return res.status(200).json({ 
            message: 'OTP sent successfully', 
            otp,
            isExisting: !!user
        });
    } catch (error: unknown) {
        console.error('[Auth] sendOtp Error:', error);
        return res.status(500).json({ error: 'Internal server error while sending OTP' });
    }
};



export const verifyOtp = async (req: Request, res: Response): Promise<Response | any> => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) return res.status(400).json({ error: 'Missing required fields' });

        const storedOtp = await redis.get(`otp:${identifier}`);
        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        await redis.del(`otp:${identifier}`);

        // Logic without Firebase:
        // 1. Check if user exists in our DB
        const isEmail = identifier.includes('@');
        let user = await (prisma as any).user.findFirst({
            where: isEmail ? { email: identifier } : { phone: identifier }
        });

        // 2. Generate or extract a UID
        const uid = user ? user.firebaseUid : `native-${uuidv4()}`;

        // 3. Create our own JWT instead of Firebase token
        const token = jwt.sign(
            { 
                id: user ? user.id : null, 
                uid,
                email: isEmail ? identifier : (user?.email || null),
                phone_number: !isEmail ? identifier : (user?.phone || null)
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Save session to DB
        if (user) {
            try {
                await (prisma as any).session.upsert({
                    where: { token },
                    update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                    create: {
                        userId: user.id,
                        token,
                        device: req.headers['user-agent'] || 'unknown',
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });
            } catch (sessionErr) {
                console.error('[Auth] Session save warning:', sessionErr);
            }
        }
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        return res.status(200).json({ token: token });
    } catch (error: any) {
        console.error('[Auth] verifyOtp error:', error);
        return res.status(500).json({ error: 'Failed to verify OTP and generate token', details: error.message });
    }
};

export const syncToken = async (req: Request, res: Response): Promise<Response | any> => {
    try {
        const decodedToken = (req as any).user;
        const user = await (prisma as any).user.findFirst({
            where: { 
                OR: [
                    { id: decodedToken.id },
                    { firebaseUid: decodedToken.uid }
                ]
            },
            include: {
                followers: true,
                following: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const newToken = jwt.sign(
            { 
                id: user.id, 
                uid: user.firebaseUid,
                email: user.email,
                phone_number: user.phone
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // Save session to DB
        try {
            await (prisma as any).session.upsert({
                where: { token: newToken },
                update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                create: {
                    userId: user.id,
                    token: newToken,
                    device: req.headers['user-agent'] || 'unknown',
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
        } catch (sessionErr) {
            console.error('[Auth] Session sync save warning:', sessionErr);
        }

        return res.status(200).json({ 
            token: newToken,
            user: user
        });
    } catch (error: any) {
        return res.status(500).json({ error: 'Token refresh failed' });
    }
};

export const loginOrRegister = async (req: Request, res: Response): Promise<Response | any> => {
    try {
        const decodedToken = (req as any).user;
        if (!decodedToken) {
            return res.status(401).json({ error: 'Unauthorized: Decoded token missing' });
        }

        const { id, uid, email, phone_number, picture } = decodedToken;
        const { displayName: inputName, dob, avatar: inputAvatar, username: inputUsername } = req.body;

        // 1. UNIQUE IDENTIFIER SEARCH
        let user = id ? await (prisma as any).user.findUnique({ where: { id } }) : null;
        if (!user && uid) {
            user = await (prisma as any).user.findUnique({ where: { firebaseUid: uid } });
        }

        // 2. IDENTIFIER CONFLICT CHECK (Edge Case: Identifier belongs to another user)
        // If we don't have a user, check if the identifier (email/phone) is already used by someone else
        if (!user) {
            const existingUser = await (prisma as any).user.findFirst({
                where: {
                    OR: [
                        ...(email ? [{ email }] : []),
                        ...(phone_number ? [{ phone: phone_number }] : []),
                        ...(req.body.phone && req.body.phone !== phone_number ? [{ phone: req.body.phone }] : [])
                    ].filter(Boolean)
                }
            });

            if (existingUser) {
                // If the user exists but has no firebaseUid, we can link them
                if (!existingUser.firebaseUid) {
                    console.log(`[Auth] Linking existing account (${existingUser.id}) to new UID: ${uid}`);
                    user = await (prisma as any).user.update({
                        where: { id: existingUser.id },
                        data: { firebaseUid: uid }
                    });
                } else if (existingUser.firebaseUid !== uid) {
                    // CRITICAL EDGE CASE: This identifier is already verified and owned by a DIFFERENT firebase UID
                    // This usually means the user is trying to use an email/phone already verified on another account
                    return res.status(409).json({ 
                        error: 'Identifier already associated with another account', 
                        details: `The ${email ? 'email' : 'phone number'} provided is already in use.`
                    });
                }
            }
        }

        // 3. REGISTRATION / PROFILE COMPLETION FLOW
        if (!user) {
            // Check if we have enough info to create the profile
            // If it's a first-time sync without name/dob, we tell the frontend to collect it
            if (!inputName || !dob) {
                return res.status(200).json({ 
                    message: 'Registration required', 
                    status: 'needs_profile',
                    user: { 
                        email: email || null, 
                        phone: phone_number || null,
                        avatar: picture || null
                    } 
                });
            }

            // Generate a unique username
            let generatedUsername = inputUsername;
            if (!generatedUsername) {
                const base = (email?.split('@')[0] || inputName.toLowerCase().replace(/\s+/g, '_')).substring(0, 15);
                generatedUsername = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
            }

            const userData: any = {
                username: generatedUsername,
                email: email || null,
                phone: phone_number || null,
                displayName: inputName,
                avatar: inputAvatar || picture || `https://api.dicebear.com/7.x/initials/svg?seed=${inputName}`,
                largeAvatar: inputAvatar || picture || `https://api.dicebear.com/7.x/initials/svg?seed=${inputName}`,
                dob: new Date(dob),
                lastLogin: new Date(),
                settings: {}
            };
            
            if (uid) userData.firebaseUid = uid;

            user = await (prisma as any).user.create({
                data: userData,
                include: {
                    followers: true,
                    following: true
                }
            });
            console.log(`[Auth] Registered new user: ${user.id}`);

            const newToken = jwt.sign(
                { 
                    id: user.id, 
                    uid: user.firebaseUid,
                    email: user.email,
                    phone_number: user.phone
                },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Save session to DB
            try {
                await (prisma as any).session.upsert({
                    where: { token: newToken },
                    update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                    create: {
                        userId: user.id,
                        token: newToken,
                        device: req.headers['user-agent'] || 'unknown',
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });
            } catch (sessionErr) {
                console.error('[Auth] Session save warning:', sessionErr);
            }

            res.cookie('token', newToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.status(201).json({ 
                message: 'User registered successfully', 
                user,
                token: newToken
            });
        } else {
            // EXISTING USER - SYNC & UPDATE
            // Existing users should be allowed to sign in immediately.
            const updateData: any = {
                lastLogin: new Date(),
            };

            if (inputName) updateData.displayName = inputName;
            if (dob) updateData.dob = new Date(dob);
            if (inputUsername) {
                // Check if username is taken by someone else
                const taken = await (prisma as any).user.findFirst({
                    where: { username: inputUsername, NOT: { id: user.id } }
                });
                if (taken) return res.status(409).json({ error: 'Username already taken' });
                updateData.username = inputUsername;
            }
            if (inputAvatar) {
                updateData.avatar = inputAvatar;
                updateData.largeAvatar = inputAvatar;
            }

            const updatedUser = await (prisma as any).user.update({
                where: { id: user.id },
                data: updateData,
                include: {
                    followers: true,
                    following: true
                }
            });

            const newToken = jwt.sign(
                { 
                    id: updatedUser.id, 
                    uid: updatedUser.firebaseUid,
                    email: updatedUser.email,
                    phone_number: updatedUser.phone
                },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Save session to DB
            try {
                await (prisma as any).session.upsert({
                    where: { token: newToken },
                    update: {
                        device: req.headers['user-agent'] || 'unknown',
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    },
                    create: {
                        userId: updatedUser.id,
                        token: newToken,
                        device: req.headers['user-agent'] || 'unknown',
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });
            } catch (sessionErr) {
                console.error('[Auth] Session save warning:', sessionErr);
            }

            res.cookie('token', newToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({ 
                message: 'User synced successfully', 
                user: updatedUser,
                token: newToken
            });
        }
    } catch (error: any) {
        console.error('[Auth] Login/Register Critical Error:', error);
        return res.status(500).json({ error: 'Internal server error during authentication', details: error.message });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<Response | any> => {
    try {
        const decodedToken = (req as any).user;
        const user = await (prisma as any).user.findUnique({
            where: { id: decodedToken.id },
            select: { 
                id: true, username: true, displayName: true,
                avatar: true, largeAvatar: true, bio: true, 
                email: true, phone: true, dob: true,
                isPrivate: true, searchByPhone: true,
                showPhoneTo: true, lastLogin: true,
                _count: {
                    select: { followers: true, following: true }
                },
                followers: { select: { followerId: true } },
                following: { select: { followingId: true } }
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        return res.status(200).json(user);
    } catch (error: unknown) {
        console.error('[Auth] Profile fetch error:', error);
        return res.status(500).json({ error: 'Internal server error while fetching profile' });
    }
};
