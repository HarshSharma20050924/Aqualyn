import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const loginOrRegister = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        if (!decodedToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { uid, email, phone_number } = decodedToken;
        const { displayName, dob, avatar } = req.body; // Additional profile details can be sent in the body

        let user = await (prisma as any).user.findUnique({
            where: { firebaseUid: uid },
        });

        // GLITCH FIX: If no user by firebaseUid, check if account already exists with this phone or email
        if (!user) {
            const existingUser = await (prisma as any).user.findFirst({
                where: {
                    OR: [
                        ...(email ? [{ email }] : []),
                        ...(phone_number ? [{ phone: phone_number }] : []),
                        ...(req.body.phone ? [{ phone: req.body.phone }] : [])
                    ]
                }
            });

            if (existingUser) {
                // Link existing account to this new firebaseUid
                user = await (prisma as any).user.update({
                    where: { id: existingUser.id },
                    data: { firebaseUid: uid }
                });
            }
        }

        const finalName = displayName || email?.split('@')[0] || 'User';
        const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${finalName}`;
        const inputUsername = req.body.username;

        // Check if username is already taken by someone else
        if (inputUsername) {
            const existingUser = await (prisma as any).user.findFirst({
                where: { 
                   username: inputUsername,
                   firebaseUid: { not: uid } 
                }
            });
            if (existingUser) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        if (!user) {
            // Register flow
            user = await (prisma as any).user.create({
                data: {
                    firebaseUid: uid,
                    username: inputUsername || null,
                    email: email || null,
                    phone: phone_number || req.body.phone || null,
                    displayName: finalName,
                    avatar: avatar || defaultAvatar,
                    largeAvatar: avatar || defaultAvatar,
                    dob: dob ? new Date(dob) : null,
                    lastLogin: new Date(),
                },
            });
            return res.status(201).json({ message: 'User registered successfully', user });
        } else {
            // Login flow
            user = await (prisma as any).user.update({
                where: { firebaseUid: uid },
                data: {
                    lastLogin: new Date(),
                    ...(inputUsername && { username: inputUsername }),
                    ...(displayName && { displayName }),
                    ...(avatar && { avatar, largeAvatar: avatar }),
                    ...(dob && { dob: new Date(dob) }),
                    ...(req.body.phone && { phone: req.body.phone }),
                    ...(req.body.showPhoneTo && { showPhoneTo: req.body.showPhoneTo }),
                    ...('searchByPhone' in req.body && { searchByPhone: req.body.searchByPhone }),
                    ...(req.body.bio !== undefined && { bio: req.body.bio }),
                },
            });
            // Just in case it was missing
        // Final fetch with relations
        const userWithRelations = await (prisma as any).user.findUnique({
            where: { id: user.id },
            include: { 
                following: true, 
                followers: true,
                sentFollowReqs: true,
                receivedFollowReqs: true
            },
        });
        return res.status(200).json({ message: 'User updated successfully', user: userWithRelations });
        }
    } catch (error) {
        console.error('Login/Register error:', error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const decodedToken = (req as any).user;
        const user = await (prisma as any).user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            include: { 
                following: true, 
                followers: true,
                sentFollowReqs: true,
                receivedFollowReqs: true
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found in DB' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
