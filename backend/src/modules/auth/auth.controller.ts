import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';
import admin from '../../config/firebaseAdmin';
import { supabaseAdmin } from '../../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL OTP — check existence only (Supabase OTP is sent from the frontend client)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sendOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { identifier } = req.body;
    if (!identifier) return next(new AppError('Identifier is required', 400));

    const isEmail = identifier.includes('@');
    if (!isEmail) {
        return next(new AppError('Phone OTP is currently unavailable. Please use email.', 400));
    }

    // Check if user exists in our DB — OTP is sent client-side via Supabase anon key
    const user = await (prisma as any).user.findFirst({ where: { email: identifier } });

    console.log(`[Auth] isExisting check for ${identifier}: ${!!user}`);
    res.status(200).json({
        message: 'OTP sent to your email via Supabase',
        isExisting: !!user
    });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, otp, token } = req.body;

    if (!identifier) return next(new AppError('Email is required', 400));
    if (!otp && !token) return next(new AppError('OTP or token is required', 400));

    const isEmail = identifier.includes('@');
    if (!isEmail) return next(new AppError('Phone OTP is currently unavailable. Please use email.', 400));

    let supabaseUserId: string;
    let supabaseEmail: string;

    if (token) {
        // Verify a Supabase access token directly (from frontend magic link flow)
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !data.user) {
            return next(new AppError('Invalid or expired token', 401));
        }
        supabaseUserId = data.user.id;
        supabaseEmail = data.user.email!;
    } else {
        // Verify the 6-digit OTP via Supabase
        const { data, error } = await supabaseAdmin.auth.verifyOtp({
            email: identifier,
            token: otp,
            type: 'email'
        });

        if (error || !data.user) {
            console.error('[Supabase OTP Verify] Error:', error);
            return next(new AppError('Invalid or expired OTP', 400));
        }
        supabaseUserId = data.user.id;
        supabaseEmail = data.user.email!;
    }

    // Find or prepare user in our DB
    let user = await (prisma as any).user.findFirst({ where: { email: supabaseEmail } });

    const uid = user ? user.firebaseUid : `supabase-${supabaseUserId}`;

    const jwtPayload: any = {
        id: user ? user.id : null,
        uid,
        email: supabaseEmail,
        supabaseId: supabaseUserId,
        phone_number: user?.phone || null
    };

    const jwtToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '30d' });

    if (user) {
        await (prisma as any).session.upsert({
            where: { token: jwtToken },
            update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            create: {
                userId: user.id,
                token: jwtToken,
                device: req.headers['user-agent'] || 'unknown',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
    }

    res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ token: jwtToken, isExisting: !!user });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GOOGLE SIGN-IN (via Firebase — unchanged)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const googleSignin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;
    if (!idToken) return next(new AppError('ID token is required', 400));

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, phone_number, name, picture } = decodedToken;

        // First try to find by Firebase UID
        let user = await (prisma as any).user.findFirst({ where: { firebaseUid: uid } });

        // Then try by email (user might have registered via email OTP previously)
        if (!user && email) {
            user = await (prisma as any).user.findFirst({ where: { email } });
            if (user) {
                user = await (prisma as any).user.update({
                    where: { id: user.id },
                    data: { firebaseUid: uid, lastLogin: new Date() },
                    include: { followers: true, following: true }
                });
            }
        }

        // ── NEW USER: issue a temp token and ask them to complete profile ──
        if (!user) {
            const tempToken = jwt.sign(
                { id: null, uid: `firebase-${uid}`, email: email || null, phone_number: phone_number || null, picture: picture || null },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.cookie('token', tempToken, {
                httpOnly: true, secure: true, sameSite: 'none', maxAge: 60 * 60 * 1000
            });
            return res.status(200).json({
                status: 'needs_profile',
                token: tempToken,
                user: {
                    email: email || null,
                    phone: phone_number || null,
                    displayName: name || email?.split('@')[0] || null,
                    avatar: picture || null
                }
            });
        }

        // ── EXISTING USER: update lastLogin and issue full token ──
        user = await (prisma as any).user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
            include: { followers: true, following: true }
        });

        // If profile is incomplete, redirect to setup
        if (!user.dob || !user.displayName) {
            const tempToken = jwt.sign(
                { id: user.id, uid: user.firebaseUid, email: user.email, phone_number: user.phone },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.cookie('token', tempToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 60 * 60 * 1000 });
            return res.status(200).json({
                status: 'needs_profile',
                token: tempToken,
                user: { email: user.email, phone: user.phone, displayName: user.displayName, avatar: user.avatar }
            });
        }

        const token = jwt.sign(
            { id: user.id, uid: user.firebaseUid, email: user.email, phone_number: user.phone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        await (prisma as any).session.upsert({
            where: { token },
            update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            create: {
                userId: user.id, token,
                device: req.headers['user-agent'] || 'unknown',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.status(200).json({ token, user });
    } catch (error) {
        console.error('Google sign-in error:', error);
        return next(new AppError('Failed to verify Google ID token', 400));
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYNC TOKEN — refresh JWT from existing cookie
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const syncToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken || !decodedToken.id) {
        return next(new AppError('Unauthorized: Invalid token', 401));
    }

    const user = await (prisma as any).user.findFirst({
        where: { id: decodedToken.id },
        include: { followers: true, following: true }
    });

    if (!user) return next(new AppError('User not found', 401));

    const newToken = jwt.sign(
        { id: user.id, uid: user.firebaseUid, email: user.email, phone_number: user.phone },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    res.cookie('token', newToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
    });

    await (prisma as any).session.upsert({
        where: { token: newToken },
        update: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        create: {
            userId: user.id, token: newToken, device: req.headers['user-agent'] || 'unknown',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });

    res.status(200).json({ token: newToken, user });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGISTER — complete profile for new users
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken) return next(new AppError('Unauthorized: Decoded token missing', 401));

    if (decodedToken.id) {
        return next(new AppError('User is already registered. Please login instead.', 400));
    }

    const { uid, email, phone_number, picture } = decodedToken;
    const { displayName: inputName, dob, avatar: inputAvatar, username: inputUsername } = req.body;

    if (!inputName || !dob) {
        return res.status(200).json({
            message: 'Registration required',
            status: 'needs_profile',
            user: { email: email || null, phone: phone_number || null, avatar: picture || null }
        });
    }

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
        return next(new AppError('Identifier already associated with another account', 409));
    }

    let generatedUsername = inputUsername;
    if (!generatedUsername) {
        const base = (email?.split('@')[0] || inputName.toLowerCase().replace(/\s+/g, '_')).substring(0, 15);
        generatedUsername = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const usernameTaken = await (prisma as any).user.findFirst({ where: { username: generatedUsername } });
    if (usernameTaken) return next(new AppError('Username is already taken', 409));

    const userData: any = {
        username: generatedUsername,
        email: email || null,
        phone: phone_number || req.body.phone || null,
        displayName: inputName,
        avatar: inputAvatar || picture || `https://api.dicebear.com/7.x/initials/svg?seed=${inputName}`,
        largeAvatar: inputAvatar || picture || `https://api.dicebear.com/7.x/initials/svg?seed=${inputName}`,
        dob: new Date(dob),
        lastLogin: new Date(),
        firebaseUid: uid,
        settings: {}
    };

    const user = await (prisma as any).user.create({
        data: userData,
        include: { followers: true, following: true }
    });

    const newToken = jwt.sign(
        { id: user.id, uid: user.firebaseUid, email: user.email, phone_number: user.phone },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    await (prisma as any).session.create({
        data: {
            userId: user.id,
            token: newToken,
            device: req.headers['user-agent'] || 'unknown',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });

    res.cookie('token', newToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'User registered successfully', user, token: newToken });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGIN — existing user
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken) return next(new AppError('Unauthorized: Decoded token missing', 401));

    if (!decodedToken.id) {
        return next(new AppError('User not registered. Please register first.', 404));
    }

    const { id } = decodedToken;
    const { displayName: inputName, dob, avatar: inputAvatar, username: inputUsername } = req.body;

    let user = await (prisma as any).user.findUnique({ where: { id } });
    // If user no longer exists in DB, clear the stale cookie and return 401
    if (!user) {
        res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
        return next(new AppError('User not found — session cleared', 401));
    }

    const updateData: any = { lastLogin: new Date() };

    if (inputName) updateData.displayName = inputName;
    if (dob) updateData.dob = new Date(dob);
    if (inputUsername && inputUsername !== user.username) {
        const taken = await (prisma as any).user.findFirst({ where: { username: inputUsername } });
        if (taken) return next(new AppError('Username already taken', 409));
        updateData.username = inputUsername;
    }
    if (inputAvatar) {
        updateData.avatar = inputAvatar;
        updateData.largeAvatar = inputAvatar;
    }

    const updatedUser = await (prisma as any).user.update({
        where: { id: user.id },
        data: updateData,
        include: { followers: true, following: true }
    });

    const newToken = jwt.sign(
        { id: updatedUser.id, uid: updatedUser.firebaseUid, email: updatedUser.email, phone_number: updatedUser.phone },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

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

    res.cookie('token', newToken, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ message: 'Login successful', user: updatedUser, token: newToken });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED SYNC — routes to login or register
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const sync = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken) return next(new AppError('Unauthorized: Decoded token missing', 401));

    if (decodedToken.id) {
        return login(req, res, next);
    } else {
        return register(req, res, next);
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken || !decodedToken.id) return next(new AppError('Unauthorized', 401));

    const user = await (prisma as any).user.findUnique({
        where: { id: decodedToken.id },
        select: {
            id: true, username: true, displayName: true,
            avatar: true, largeAvatar: true, bio: true,
            email: true, phone: true, dob: true,
            isPrivate: true, searchByPhone: true,
            showPhoneTo: true, lastLogin: true,
            _count: { select: { followers: true, following: true } },
            followers: { select: { followerId: true } },
            following: { select: { followingId: true } }
        },
    });

    if (!user) return next(new AppError('User profile not found', 401));

    res.status(200).json(user);
});
