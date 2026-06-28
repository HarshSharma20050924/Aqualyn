import { OpenAI } from 'openai';
import prisma from '../../config/prisma';
import { SocketService } from '../../services/SocketService';

const apiKey = process.env.DASHSCOPE_API_KEY;
const baseURL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

const openai = new OpenAI({
    apiKey,
    baseURL
});

const DEFAULT_MODEL = 'qwen-plus';

// --- Vector Math Helpers ---
function cosineSimilarity(A: number[], B: number[]): number {
    let dotproduct = 0, mA = 0, mB = 0;
    for(let i = 0; i < Math.min(A.length, B.length); i++) {
        dotproduct += (A[i] * B[i]);
        mA += (A[i]*A[i]);
        mB += (B[i]*B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    if (mA === 0 || mB === 0) return 0;
    return (dotproduct)/((mA)*(mB));
}

async function getEmbedding(text: string): Promise<number[]> {
    try {
        const res = await openai.embeddings.create({
            input: text,
            model: 'text-embedding-v3' // Dashscope compatible embedding model
        });
        return res.data[0]?.embedding || [];
    } catch (e) {
        console.error('[AI] Embedding generation failed:', e);
        return [];
    }
}

export class AIService {
    /**
     * Helper to ensure the Lyn AI user exists in the database
     */
    static async ensureLynUser() {
        const lynId = 'lyn-ai-user-id';
        let lyn = await (prisma as any).user.findUnique({
            where: { id: lynId }
        });

        if (!lyn) {
            lyn = await (prisma as any).user.create({
                data: {
                    id: lynId,
                    username: 'lyn',
                    displayName: 'Lyn',
                    email: 'lyn@aqualyn.ai',
                    bio: 'Your general-purpose AI communication assistant.',
                    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150', // Premium visual placeholder
                    showPhoneTo: 'no_one',
                    searchByPhone: false,
                    isPrivate: false
                }
            });
        }
        return lyn;
    }

    /**
     * Intercepts messages in a chat to see if Lyn needs to respond
     */
    static async handleMessageAdded(chatId: string, senderId: string, text: string, aiSettings?: { enabled?: boolean; personality?: string; friendMode?: boolean; responseRate?: number; customPersonality?: string }) {
        await this.ensureLynUser();
        const lynId = 'lyn-ai-user-id';

        if (senderId === lynId) return; // Don't reply to self

        // Respect per-chat enable flag (default: enabled)
        if (aiSettings?.enabled === false) return;

        // Check if Lyn is a participant in this chat
        const participants = await (prisma as any).chatParticipant.findMany({
            where: { chatId },
            include: { user: { select: { id: true, displayName: true, username: true } } }
        });

        const isLynParticipant = participants.some((p: any) => p.userId === lynId);
        const isMentioned = text.toLowerCase().includes('lyn');
        const friendMode = aiSettings?.friendMode === true;
        const responseRate = aiSettings?.responseRate ?? 0;

        if (!isLynParticipant && !isMentioned && !friendMode) return;

        if (!isMentioned && friendMode && !isLynParticipant) {
            const roll = Math.random() * 100;
            if (roll > responseRate) return;
        }

        // Fetch recent messages for rich context (last 20)
        const recentMessages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { sender: { select: { id: true, displayName: true, username: true } } }
        });

        const senderUser = recentMessages.find((m: any) => m.senderId === senderId)?.sender;
        const senderName = senderUser?.displayName || senderUser?.username || 'User';
        const otherParticipants = participants.filter((p: any) => p.userId !== lynId && p.userId !== senderId).map((p: any) => p.user?.displayName || p.user?.username).join(', ');

        // Format chat history for the model
        const formattedHistory = recentMessages.reverse().map((msg: any) => {
            const mName = msg.sender?.displayName || msg.sender?.username || 'User';
            return {
                role: msg.senderId === lynId ? 'assistant' : 'user',
                content: msg.senderId === lynId ? msg.text || '' : `[${mName}]: ${msg.text || ''}`
            };
        }).filter((m: any) => m.content.trim());

        // Build personality guide
        const personalityGuide: Record<string, string> = {
            friendly:     'You are warm, casual, and personable. Use a conversational tone.',
            professional: 'You are formal, concise, and business-appropriate. Avoid slang.',
            witty:        'You are clever and humorous, with light wit and wordplay.',
            empathetic:   'You are deeply understanding, emotionally aware, and supportive.',
            concise:      'You are brief and to the point — reply in 1-2 sentences maximum.',
            creative:     'You are expressive, imaginative, and think outside the box.',
        };

        const personalityStyle = aiSettings?.customPersonality?.trim() 
            ? aiSettings.customPersonality.trim() 
            : (personalityGuide[aiSettings?.personality || 'friendly'] || 'friendly');

        const systemPrompt = `You are Lyn, an AI assistant on Aqualyn chatting with ${senderName}${otherParticipants ? ` and ${otherParticipants}` : ''}.
If this is a group chat, talk mutually like you are part of a friend group, addressing both sender and receiver.

EXTREMELY STRICT RULES - IF YOU BREAK THESE YOU FAIL:
1. Speak like a casual, helpful Gen-Z person texting.
2. Max length: 1 or 2 sentences TOTAL. Extremely brief.
3. ABSOLUTELY NO bullet points, NO lists, NO asterisks, NO bold/italics, NO arrows (->, =>), NO dashes (-). Just plain raw text.
4. ABSOLUTELY NO emojis. Zero emojis allowed.
5. ABSOLUTELY NO "therapy talk" (e.g., never say "deep breath", "you're doing great", "let's map this out").
6. Use all lowercase most of the time. Use abbreviations like "tbh", "rn", "idk", "lol", "bruh" where natural.
7. Just respond naturally to whatever they just said. Do not list options. Do not ask multiple questions. Just one casual thought.
8. CRITICAL - NEVER fabricate personal memories, shared experiences, or inside jokes. You do NOT have a history with the user outside of this conversation. ONLY reference things that were actually said in this chat. If asked about something you don't know, say "idk" or "not sure tbh".
9. NEVER claim to know the user's real-life details (what they did, who they know, past events) unless the user told you in this conversation.
10. You are an AI assistant, not a real person. If asked directly, be honest about that.

Examples of HOW TO talk:
User: "i hate my job"
Lyn: "damn that sucks tbh. u wanna quit or just vent?"

User: "can you help me text her back"
Lyn: "yeah what did she say last?"

User: "who are you"
Lyn: "lyn, ur ai assistant on aqualyn. what's up?"

Current Tone: ${personalityStyle}

Drafts: If they ask you to draft a message for them to send, just output the exact text they should send, nothing else.`;

        try {
            // Show typing indicator
            participants.forEach((p: any) => {
                SocketService.emitToUser(p.userId, 'user_typing', {
                    chatId,
                    userId: 'Lyn', // use exactly 'Lyn' or lynId so it shows "Lyn is typing..."
                    userName: 'Lyn',
                    isTyping: true
                });
            });

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...formattedHistory
                ],
                max_tokens: 512,
                temperature: 0.7,
            });

            const replyContent = response.choices[0]?.message?.content?.trim() || "I'm here! How can I help you?";

            // Save AI reply to DB
            const aiMessage = await (prisma as any).message.create({
                data: {
                    chatId,
                    senderId: lynId,
                    text: replyContent,
                    status: 'sent'
                }
            });

            // Update chat timestamp
            await (prisma as any).chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() }
            });

            // Emit to all participants using the correct event name the frontend listens on
            const payload = {
                ...aiMessage,
                sender: { id: lynId, displayName: 'Lyn', username: 'lyn', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150' },
                chat: { id: chatId, isGroup: false, isSecret: false },
                timestamp: new Date(aiMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            participants.forEach((p: any) => {
                SocketService.emitToUser(p.userId, 'receive_message', payload);
            });

            console.log(`[Lyn] Responded in chat ${chatId} with personality style: ${personalityStyle}`);
        } catch (error) {
            console.error('[Lyn] Error generating response:', error);
        } finally {
            // Clear typing indicator
            participants.forEach((p: any) => {
                SocketService.emitToUser(p.userId, 'user_typing', {
                    chatId,
                    userId: 'Lyn',
                    userName: 'Lyn',
                    isTyping: false
                });
            });
        }
    }

    /**
     * Generate smart replies based on recent conversation history
     */
    static async generateSmartReplies(chatId: string, userId: string) {
        // Fetch last 10 messages from the chat
        const recentMessages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { text: true, senderId: true }
        });

        if (recentMessages.length === 0) {
            return ['Hello!', 'How can I help?', 'Hey there!'];
        }

        // Format history
        const formattedHistory = recentMessages.reverse().map((msg: any) => {
            const senderTag = msg.senderId === userId ? 'Me' : 'Them';
            return `${senderTag}: ${msg.text}`;
        }).join('\n');

        try {
            const prompt = `Based on the following recent conversation history, generate exactly 3 short, context-appropriate, helpful, and natural-sounding suggestions for what "Me" could reply next.
Provide the output strictly as a JSON array of strings, with no additional text or formatting.
Example output format: ["Sounds good!", "Can we do it tomorrow?", "I will check and get back to you."]

Conversation history:
${formattedHistory}`;

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: prompt }]
            });

            const rawContent = response.choices[0]?.message?.content?.trim() || '[]';
            // Extract JSON array
            const match = rawContent.match(/\[.*\]/s);
            if (match) {
                return JSON.parse(match[0]);
            }
            return JSON.parse(rawContent);
        } catch (error) {
            console.error('Error generating smart replies:', error);
            return ['Okay', 'Thanks!', 'Let me check on that.'];
        }
    }

    /**
     * Summarize a chat's topic, decisions, action items, and links
     */
    static async generateSummary(chatId: string) {
        // Fetch last 50 messages to summarize
        const recentMessages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { sender: { select: { displayName: true, username: true } } }
        });

        if (recentMessages.length === 0) {
            return {
                topics: [],
                decisions: [],
                actionItems: [],
                links: []
            };
        }

        const formattedHistory = recentMessages.reverse().map((msg: any) => {
            const senderName = msg.sender.displayName || msg.sender.username || 'User';
            return `${senderName}: ${msg.text || '[Media/Attachment]'}`;
        }).join('\n');

        try {
            const prompt = `Analyze the following chat transcript and generate:
1. Key topics discussed
2. Decisions made
3. Pending action items (and who is assigned, if clear)
4. Any shared links or resources

Provide the output strictly as a JSON object matching this structure:
{
  "topics": ["topic 1", "topic 2"],
  "decisions": ["decision 1"],
  "actionItems": ["action 1", "action 2"],
  "links": ["http://example.com"]
}

Transcript:
${formattedHistory}`;

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: prompt }]
            });

            const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
            const match = rawContent.match(/\{.*\}/s);
            if (match) {
                return JSON.parse(match[0]);
            }
            return JSON.parse(rawContent);
        } catch (error) {
            console.error('Error generating summary:', error);
            return {
                topics: ['Could not generate summary'],
                decisions: [],
                actionItems: [],
                links: []
            };
        }
    }

    /**
     * Perform natural language search across messages
     */
    static async searchMessages(userId: string, query: string) {
        // Step 1: Query database for candidate messages containing keywords from query
        const keywordCandidates = await (prisma as any).message.findMany({
            where: {
                chat: { participants: { some: { userId } } },
                text: { contains: query, mode: 'insensitive' }
            },
            take: 10,
            include: { sender: { select: { displayName: true, username: true } } }
        });

        // Step 2: Feed context to Qwen to generate an intelligent answer
        if (keywordCandidates.length === 0) {
            return {
                answer: `I couldn't find any messages containing "${query}".`,
                results: []
            };
        }

        const formattedResults = keywordCandidates.map((m: any) => {
            const senderName = m.sender.displayName || m.sender.username || 'User';
            return `[Message ID: ${m.id}, Date: ${m.createdAt.toISOString()}] ${senderName}: ${m.text}`;
        }).join('\n');

        try {
            const prompt = `The user is searching their chats with the query: "${query}".
Here are some relevant message snippets:
${formattedResults}

Write a direct, helpful answer to the user's query based strictly on these messages. Highlight dates or sender names when appropriate.
Provide your response strictly in the following JSON format:
{
  "answer": "Your human-like answer summarizing the search results.",
  "matchingMessageIds": ["id1", "id2"]
}
`;

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: prompt }]
            });

            const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
            const match = rawContent.match(/\{.*\}/s);
            const parsed = match ? JSON.parse(match[0]) : JSON.parse(rawContent);

            return {
                answer: parsed.answer || 'Matching results found.',
                results: keywordCandidates.filter((c: any) => (parsed.matchingMessageIds || []).includes(c.id))
            };
        } catch (error) {
            console.error('Error during AI message search:', error);
            return {
                answer: `Found some matches containing your query.`,
                results: keywordCandidates
            };
        }
    }

    /**
     * Lookup info or details about contacts
     */
    static async lookupContact(userId: string, query: string) {
        // Fetch all contacts/users this user interacts with
        const chats = await (prisma as any).chat.findMany({
            where: { participants: { some: { userId } } },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, displayName: true, username: true, bio: true, email: true }
                        }
                    }
                }
            }
        });

        const contactsList = new Map();
        chats.forEach((chat: any) => {
            chat.participants.forEach((p: any) => {
                if (p.userId !== userId) {
                    contactsList.set(p.userId, p.user);
                }
            });
        });

        const contactsArray = Array.from(contactsList.values());

        if (contactsArray.length === 0) {
            return {
                answer: "You don't have any contacts in your network yet.",
                contacts: []
            };
        }

        const formattedContacts = contactsArray.map((c: any) => 
            `- ${c.displayName || c.username} (@${c.username}) | Bio: ${c.bio || 'None'} | Email: ${c.email || 'None'}`
        ).join('\n');

        try {
            const prompt = `The user is looking up contact information with query: "${query}".
Here is a list of contacts in their network:
${formattedContacts}

Synthesize an answer addressing the user's query. Extract matches.
Provide your response strictly in the following JSON format:
{
  "answer": "Human-friendly answer about the contact(s).",
  "matchingUsernames": ["username1"]
}
`;

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: prompt }]
            });

            const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
            const match = rawContent.match(/\{.*\}/s);
            const parsed = match ? JSON.parse(match[0]) : JSON.parse(rawContent);

            return {
                answer: parsed.answer || 'Found matching contacts.',
                contacts: contactsArray.filter((c: any) => (parsed.matchingUsernames || []).includes(c.username))
            };
        } catch (error) {
            console.error('Error during AI contact lookup:', error);
            return {
                answer: `Search completed for query: ${query}.`,
                contacts: contactsArray.filter((c: any) => c.username.toLowerCase().includes(query.toLowerCase()) || c.displayName?.toLowerCase().includes(query.toLowerCase()))
            };
        }
    }

    /**
     * Draft a context-aware reply based on conversation history + selected personality + vector memory
     */
    static async draftResponse(chatId: string, userId: string, personality: string = 'friendly') {
        const recentMessages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { sender: { select: { displayName: true, username: true } } }
        });

        if (recentMessages.length === 0) {
            return { draft: "Hey! How are you doing?" };
        }

        const formattedHistory = recentMessages.reverse().map((msg: any) => {
            const isMe = msg.senderId === userId;
            const senderName = isMe ? 'Me' : (msg.sender.displayName || msg.sender.username || 'Them');
            return `${senderName}: ${msg.text || '[Attachment]'}`;
        }).join('\n');

        // Extract context for vector search
        const recentContext = recentMessages.slice(0, 4).map((m: any) => m.text).join(' ');
        
        let memoryContext = '';
        const embedding = await getEmbedding(recentContext);
        
        if (embedding.length > 0) {
            // Fetch all memories for the user (in-memory cosine similarity is fast enough for personal scale)
            const allMemories = await (prisma as any).aIMemory.findMany({
                where: { userId }
            });

            // Score and sort
            const scoredMemories = allMemories.map((mem: any) => ({
                content: mem.content,
                score: mem.embedding ? cosineSimilarity(embedding, mem.embedding) : 0
            })).sort((a: any, b: any) => b.score - a.score).slice(0, 5); // top 5 facts

            if (scoredMemories.length > 0) {
                memoryContext = scoredMemories.map((m: any) => `- ${m.content}`).join('\n');
            }
        }

        const personalityGuide: Record<string, string> = {
            friendly:     'Warm, conversational, and personable. Use casual language.',
            professional: 'Formal, concise, and business-appropriate. Avoid slang.',
            witty:        'Clever and humorous, with light sarcasm or wordplay.',
            empathetic:   'Deeply understanding, emotionally aware, supportive and caring.',
            concise:      'Short and to the point — one or two sentences maximum.',
            creative:     'Expressive, imaginative, and unique. Think outside the box.'
        };

        const guide = personalityGuide[personality] || personality || personalityGuide['friendly'];

        try {
            const prompt = `You are drafting a reply on my behalf (labeled "Me") in the following conversation.

CRITICAL INSTRUCTIONS:
1. MIMIC MY EXACT TONE: Look at how "Me" speaks in the conversation history. If I use lowercase, you use lowercase. If I use slang (tbh, rn), you use it. If I use emojis, match my frequency. If I am brief, be brief. DO NOT sound like an AI assistant.
2. ANSWER THE QUESTION: If "Them" asked a question, draft an answer to it.
3. CONTEXT/FACTS: You have access to my long-term memory facts below. Use them ONLY if relevant to the current topic.

My Memory Facts (use if relevant):
${memoryContext || "No relevant memories found."}

Conversation History:
${formattedHistory}

Draft my next reply. Write ONLY the exact text I should send. No quotation marks, no explanations.`;

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 256,
                temperature: 0.8, // Slightly higher for more natural, varied phrasing
            });

            const draft = response.choices[0]?.message?.content?.trim() || "Let me get back to you on that.";
            return { draft: draft.replace(/^"|"$/g, '') }; // clean up quotes if the AI adds them
        } catch (error) {
            console.error('Error drafting response:', error);
            throw new Error('Failed to generate draft');
        }
    }

    /**
     * Save a new fact to the user's vector memory.
     * Call this when you want the AI to remember something long-term.
     */
    static async saveMemory(userId: string, fact: string) {
        try {
            const embedding = await getEmbedding(fact);
            if (embedding.length === 0) return false;

            await (prisma as any).aIMemory.create({
                data: {
                    userId,
                    memoryType: 'fact',
                    content: fact,
                    embedding
                }
            });
            return true;
        } catch (e) {
            console.error('[AI] Failed to save memory:', e);
            return false;
        }
    }

    /**
     * Discover public users discussing similar topics as the current chat
     */
    static async discoverSimilarTopics(chatId: string, userId: string) {
        const currentChatMessages = await (prisma as any).message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: { text: true }
        });

        if (currentChatMessages.length === 0) {
            return { topics: [], suggestions: [] };
        }

        const chatText = currentChatMessages.map((m: any) => m.text || '').join(' ');

        const discoverableUsers = await (prisma as any).user.findMany({
            where: { id: { not: userId }, isPrivate: false, bio: { not: null } },
            select: { id: true, displayName: true, username: true, bio: true, avatar: true },
            take: 20
        });

        if (discoverableUsers.length === 0) {
            return { topics: [], suggestions: [] };
        }

        try {
            const userList = discoverableUsers.map((u: any) =>
                `- ${u.username}: ${u.bio || ''}`
            ).join('\n');

            const prompt = `A user is having a conversation about: "${chatText.slice(0, 500)}"

Other platform users and their bios:
${userList}

Find top 3 users who might be discussing or interested in similar topics.
Return ONLY valid JSON:
{
  "topics": ["topic1", "topic2"],
  "matchingUsernames": ["username1", "username2", "username3"]
}`;

            const response = await openai.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: prompt }]
            });

            const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
            const match = rawContent.match(/\{.*\}/s);
            const parsed = match ? JSON.parse(match[0]) : {};

            const suggestions = discoverableUsers.filter((u: any) =>
                (parsed.matchingUsernames || []).includes(u.username)
            );

            return { topics: parsed.topics || [], suggestions };
        } catch (error) {
            console.error('Error discovering similar topics:', error);
            return { topics: [], suggestions: discoverableUsers.slice(0, 3) };
        }
    }
}
