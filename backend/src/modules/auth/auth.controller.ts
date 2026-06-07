import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { redis } from '../../config/redis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { catchAsync } from '../../core/utils/catchAsync';
import { AppError } from '../../core/exceptions/AppError';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

export const sendOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { identifier } = req.body;
    if (!identifier) return next(new AppError('Identifier is required', 400));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:${identifier}`, otp, 'EX', 300); // 5 min expiry
    
    console.log(`[Auth] Generated OTP for ${identifier}: ${otp}`);

    const isEmail = identifier.includes('@');
    const user = await (prisma as any).user.findFirst({
        where: isEmail ? { email: identifier } : { phone: identifier }
    });

    res.status(200).json({ 
        message: 'OTP sent successfully', 
        otp,
        isExisting: !!user
    });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return next(new AppError('Missing required fields', 400));

    const storedOtp = await redis.get(`otp:${identifier}`);
    if (!storedOtp || storedOtp !== otp) {
        return next(new AppError('Invalid or expired OTP', 400));
    }

    await redis.del(`otp:${identifier}`);

    const isEmail = identifier.includes('@');
    let user = await (prisma as any).user.findFirst({
        where: isEmail ? { email: identifier } : { phone: identifier }
    });

    const uid = user ? user.firebaseUid : `native-${uuidv4()}`;

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
    
    if (user) {
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
    }
    
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ token, isExisting: !!user });
});

export const syncToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken || !decodedToken.id) {
        return next(new AppError('Unauthorized: Invalid token', 401));
    }

    const user = await (prisma as any).user.findFirst({
        where: { id: decodedToken.id },
        include: { followers: true, following: true }
    });

    if (!user) return next(new AppError('User not found', 404));

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

    // Check for identifier conflict
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

    // Generate unique username
    let generatedUsername = inputUsername;
    if (!generatedUsername) {
        const base = (email?.split('@')[0] || inputName.toLowerCase().replace(/\s+/g, '_')).substring(0, 15);
        generatedUsername = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Check if username taken
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

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = (req as any).user;
    if (!decodedToken) return next(new AppError('Unauthorized: Decoded token missing', 401));

    if (!decodedToken.id) {
        return next(new AppError('User not registered. Please register first.', 404));
    }

    const { id } = decodedToken;
    const { displayName: inputName, dob, avatar: inputAvatar, username: inputUsername } = req.body;

    let user = await (prisma as any).user.findUnique({ where: { id } });
    if (!user) return next(new AppError('User not found', 404));

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

    if (!user) return next(new AppError('User profile not found', 404));

    res.status(200).json(user);
});
