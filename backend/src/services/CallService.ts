import prisma from '../config/prisma';

export class CallService {
    static async createCallLog(data: { callerId: string, receiverId: string, type: 'VOICE' | 'VIDEO' }) {
        return await (prisma as any).callLog.create({
            data: {
                ...data,
                status: 'INITIATED'
            }
        });
    }

    static async updateCallStatus(callId: string, status: 'MISSED' | 'COMPLETED' | 'REJECTED', duration?: number) {
        return await (prisma as any).callLog.update({
            where: { id: callId },
            data: { 
                status, 
                duration,
                endedAt: new Date()
            }
        });
    }

    static async getUserCallHistory(userId: string) {
        return await (prisma as any).callLog.findMany({
            where: {
                OR: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { startedAt: 'desc' },
            include: {
                caller: { select: { id: true, username: true, displayName: true, avatar: true } },
                receiver: { select: { id: true, username: true, displayName: true, avatar: true } }
            }
        });
    }
}
