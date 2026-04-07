import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let serviceAccount: any;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
    }
} catch (e: any) {
    console.error('[Firebase] JSON Config Parse Error!', e.message);
    serviceAccount = {};
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase] Admin SDK Ready | Project:', serviceAccount.project_id || serviceAccount.projectId);
    } catch (e: any) {
        console.error('[Firebase] Init Error:', e.message);
    }
}

export default admin;
