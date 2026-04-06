import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];
    
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
        // Bind the uid to the request (so we can use it in the controller)
        (req as any).user = decodedToken;
        next();
    } catch (error) {
        console.error('Firebase token verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }
};
