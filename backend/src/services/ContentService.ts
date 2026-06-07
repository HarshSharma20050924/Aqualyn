import prisma from '../config/prisma';
import { GroupService } from '../modules/group/group.service';

/**
 * ContentService handles the parsing of mentions, links, and hashtags
 * across the entire Aqualyn social ecosystem.
 */
export class ContentService {
    
    /**
     * Parse @usernames from a string and find their database IDs.
     */
    static async parseMentions(text: string): Promise<string[]> {
        if (!text) return [];
        try {
            const mentionRegex = /@([a-zA-Z0-9._]+)/g;
            const matches = [...text.matchAll(mentionRegex)];
            const usernames = matches.map(match => match[1]);

            if (usernames.length === 0) return [];

            const users = await (prisma as any).user.findMany({
                where: { username: { in: usernames } },
                select: { id: true }
            });
            return users.map((u: any) => u.id);
        } catch (error) {
            console.error('[Content] Mention parsing failed:', error);
            return [];
        }
    }

    static async handlePostMentions(actorId: string, postId: string, text: string) {
        if (!actorId || !postId || !text) return;
        try {
            const mentionIds = await this.parseMentions(text);
            for (const userId of mentionIds) {
                if (userId === actorId) continue;
                await (prisma as any).activity.create({
                    data: { userId, actorId, type: 'MENTION', postId }
                });
            }
        } catch (error) {
            console.error('[Content] Post mention handling failed:', error);
        }
    }

    static async handleChatMentions(actorId: string, chatId: string, text: string) {
        if (!actorId || !chatId || !text) return;
        try {
            const mentionIds = await this.parseMentions(text);
            const participants = await (prisma as any).chatParticipant.findMany({
                where: { chatId },
                select: { userId: true }
            });
            const existingUserIds = participants.map((p: any) => p.userId);

            for (const userId of mentionIds) {
                if (!existingUserIds.includes(userId)) {
                    await (prisma as any).activity.create({
                        data: {
                            userId, actorId, type: 'MENTION',
                            text: `Mentioned you in a chat.`
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[Content] Chat mention handling failed:', error);
        }
    }
}
