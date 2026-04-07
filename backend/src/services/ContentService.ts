import prisma from '../config/prisma';
import { GroupService } from './GroupService';

/**
 * ContentService handles the parsing of mentions, links, and hashtags
 * across the entire Aqualyn social ecosystem.
 */
export class ContentService {
    
    /**
     * Parse @usernames from a string and find their database IDs.
     */
    static async parseMentions(text: string): Promise<string[]> {
        const mentionRegex = /@([a-zA-Z0-9._]+)/g;
        const matches = [...text.matchAll(mentionRegex)];
        const usernames = matches.map(match => match[1]);

        if (usernames.length === 0) return [];

        const users = await (prisma as any).user.findMany({
            where: { username: { in: usernames } },
            select: { id: true }
        });

        return users.map((u: any) => u.id);
    }

    /**
     * Process mentions in a Social Post.
     */
    static async handlePostMentions(actorId: string, postId: string, text: string) {
        const mentionIds = await this.parseMentions(text);
        
        for (const userId of mentionIds) {
            if (userId === actorId) continue;
            await (prisma as any).activity.create({
                data: {
                    userId,
                    actorId,
                    type: 'MENTION',
                    postId
                }
            });
        }
    }

    /**
     * Process mentions in a Chat Message.
     * Special: If user @mentioned is not in group, we create a temporary invite.
     */
    static async handleChatMentions(actorId: string, chatId: string, text: string) {
        const mentionIds = await this.parseMentions(text);
        
        // 1. Check current participants
        const participants = await (prisma as any).chatParticipant.findMany({
            where: { chatId },
            select: { userId: true }
        });
        const existingUserIds = participants.map((p: any) => p.userId);

        for (const userId of mentionIds) {
            if (!existingUserIds.includes(userId)) {
                // AUTO-INVITE: Create a pending join or notification
                console.log(`[ContentService] User ${userId} mentioned in chat ${chatId} - Triggering invite.`);
                // We'll create an Activity for them to join
                await (prisma as any).activity.create({
                    data: {
                        userId,
                        actorId,
                        type: 'MENTION',
                        text: `Mentioned you in a chat. Join here: ${chatId}`
                    }
                });
            }
        }
    }
}
