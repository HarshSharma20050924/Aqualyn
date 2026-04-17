import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const loginOrRegister = async (req: Request, res: Response): Promise<Response> => {
    try {
        const decodedToken = (req as any).user;
        if (!decodedToken) {
            return res.status(401).json({ error: 'Unauthorized: Decoded token missing' });
        }

        const { uid, email, phone_number } = decodedToken;
        const { displayName: inputName, dob, avatar: inputAvatar, username: inputUsername } = req.body;

        // 1. UNIQUE IDENTIFIER SEARCH (Primary Key)
        let user = await (prisma as any).user.findUnique({
            where: { firebaseUid: uid },
        });

        // 2. ACCOUNT LINKING (Edge Case: User exists but UID is new/missing)
        if (!user) {
            // Check for conflict by email or phone to link accounts
            const conflictUser = await (prisma as any).user.findFirst({
                where: {
                    OR: [
                        ...(email ? [{ email }] : []),
                        ...(phone_number ? [{ phone: phone_number }] : []),
                        ...(req.body.phone ? [{ phone: req.body.phone }] : [])
                    ].filter(Boolean)
                }
            });

            if (conflictUser) {
                console.log(`[Auth] Linking existing account (${conflictUser.id}) to new UID: ${uid}`);
                user = await (prisma as any).user.update({
                    where: { id: conflictUser.id },
                    data: { firebaseUid: uid }
                });
            }
        }

        const finalName = inputName || user?.displayName || email?.split('@')[0] || 'Aqualyn User';
        const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${finalName}`;

        // 3. USERNAME CONFLICT CHECK
        if (inputUsername) {
            const usernameOverlap = await (prisma as any).user.findFirst({
                where: { 
                    username: { equals: inputUsername, mode: 'insensitive' },
                    firebaseUid: { not: uid } 
                }
            });
            if (usernameOverlap) {
                return res.status(409).json({ error: 'Username is already taken' });
            }
        }

        // 4. PERSISTENCE (Create or Update)
        if (!user) {
            // NEW USER REGISTRATION - Generate a unique username if none provided
            let generatedUsername = inputUsername;
            if (!generatedUsername) {
                const base = (email?.split('@')[0] || finalName.toLowerCase().replace(/\s+/g, '_')).substring(0, 15);
                generatedUsername = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
            }

            user = await (prisma as any).user.create({
                data: {
                    firebaseUid: uid,
                    username: generatedUsername,
                    email: email || null,
                    phone: phone_number || req.body.phone || null,
                    displayName: finalName,
                    avatar: inputAvatar || defaultAvatar,
                    largeAvatar: inputAvatar || defaultAvatar,
                    dob: dob ? new Date(dob) : null,
                    lastLogin: new Date(),
                    settings: {}
                },
            });
            console.log(`[Auth] Registered new user: ${user.id}`);
            return res.status(201).json({ message: 'User registered successfully', user });
        } else {
            // EXISTING USER - NON-DESTRUCTIVE SYNC
            const updateData: any = {
                lastLogin: new Date(),
            };

            // Only update identity fields if specific body values are provided (explicit update)
            if (inputName) updateData.displayName = inputName;
            if (inputUsername) updateData.username = inputUsername;
            if (inputAvatar) {
                updateData.avatar = inputAvatar;
                updateData.largeAvatar = inputAvatar;
            }
            if (req.body.bio !== undefined) updateData.bio = req.body.bio;
            if (req.body.role !== undefined) updateData.role = req.body.role;
            if (req.body.phone) updateData.phone = req.body.phone;
            if (req.body.showPhoneTo) updateData.showPhoneTo = req.body.showPhoneTo;
            if (req.body.searchByPhone !== undefined) updateData.searchByPhone = req.body.searchByPhone;

            const updatedUser = await (prisma as any).user.update({
                where: { firebaseUid: uid },
                data: updateData
            });

            // 5. OPTIMIZED RESPONSE SUMMARY
            const userSummary = await (prisma as any).user.findUnique({
                where: { id: updatedUser.id },
                select: { 
                    id: true, username: true, displayName: true,
                    avatar: true, largeAvatar: true, bio: true, 
                    email: true, phone: true, dob: true,
                    isPrivate: true, searchByPhone: true,
                    showPhoneTo: true, lastLogin: true,
                    _count: {
                        select: { followers: true, following: true }
                    }
                },
            });

            return res.status(200).json({ message: 'User synced successfully', user: userSummary });
        }
    } catch (error: unknown) {
        console.error('[Auth] Login/Register Critical Error:', error);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
        const decodedToken = (req as any).user;
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            select: { 
                id: true, username: true, displayName: true,
                avatar: true, largeAvatar: true, bio: true, 
                email: true, phone: true, dob: true,
                isPrivate: true, searchByPhone: true,
                showPhoneTo: true, lastLogin: true,
                _count: {
                    select: { followers: true, following: true }
                }
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
