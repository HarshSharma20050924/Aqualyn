import prisma from '../config/prisma';

/**
 * SearchService handles discovery across all entities.
 * Designed for Big Production scale with optimized index usage.
 */
export class SearchService {
    
    /**
     * Search for users and posts globally.
     */
    static async globalSearch(query: string, currentUserId: string, limit: number = 20) {
        if (!query || query.length < 2) return { users: [], posts: [] };

        // 1. Search Users (Hits Username & DisplayName Indexes)
        const users = await (prisma as any).user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayName: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: limit,
            select: { 
                id: true, username: true, displayName: true,
                avatar: true, isPrivate: true
            }
        });

        // 2. Search Posts (Hits Post Content Keywords)
        const posts = await (prisma as any).post.findMany({
            where: {
                content: { contains: query, mode: 'insensitive' }
            },
            take: limit,
            include: {
                author: {
                    select: { id: true, username: true, displayName: true, avatar: true }
                }
            }
        });

        return { users, posts };
    }
}
