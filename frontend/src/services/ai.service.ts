import { ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';

export class AIService {
    static async initiateLynChat() {
        const res = await apiFetch(ENDPOINTS.AI_INITIATE_CHAT, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to initiate chat with Lyn AI');
        return res.json();
    }

    static async getSmartReplies(chatId: string): Promise<string[]> {
        const res = await apiFetch(ENDPOINTS.AI_SMART_REPLY, {
            method: 'POST',
            body: JSON.stringify({ chatId })
        });
        if (!res.ok) throw new Error('Failed to generate smart replies');
        const data = await res.json();
        return data.replies || [];
    }

    static async getChatSummary(chatId: string): Promise<{ summary: string; actionItems: string[]; sentiment: string; topics: string[] }> {
        const res = await apiFetch(ENDPOINTS.AI_SUMMARIZE, {
            method: 'POST',
            body: JSON.stringify({ chatId })
        });
        if (!res.ok) throw new Error('Failed to generate chat summary');
        return res.json();
    }

    static async searchMessages(query: string): Promise<{ query: string; semanticMatches: any[] }> {
        const res = await apiFetch(ENDPOINTS.AI_SEARCH, {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        if (!res.ok) throw new Error('Failed to search messages');
        return res.json();
    }

    static async lookupContact(query: string): Promise<{ query: string; results: any[] }> {
        const res = await apiFetch(ENDPOINTS.AI_CONTACT, {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        if (!res.ok) throw new Error('Failed to lookup contact');
        return res.json();
    }

    static async draftResponse(chatId: string, personality: string = 'friendly'): Promise<{ draft: string }> {
        const res = await apiFetch(ENDPOINTS.AI_DRAFT, {
            method: 'POST',
            body: JSON.stringify({ chatId, personality })
        });
        if (!res.ok) throw new Error('Failed to draft response');
        return res.json();
    }

    static async discoverSimilarTopics(chatId: string): Promise<{ topics: string[]; suggestions: any[] }> {
        const res = await apiFetch(ENDPOINTS.AI_DISCOVER, {
            method: 'POST',
            body: JSON.stringify({ chatId })
        });
        if (!res.ok) throw new Error('Failed to discover similar topics');
        return res.json();
    }
}
