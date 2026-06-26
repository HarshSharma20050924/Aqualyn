import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';
import jwt from 'jsonwebtoken';

// 1. Isolation Mocking: Correct class constructor simulation layout for OpenAI SDK
// 1. Isolation Mocking: Correct class constructor simulation layout for OpenAI SDK
vi.mock('openai', () => {
  return {
    OpenAI: class {
      chat = {
        completions: {
          create: async () => {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      replies: ["Acknowledged, let's move forward.", "Can you clarify the schema choice?"],
                      topics: ['API Testing', 'Database Optimization'],
                      decisions: ['Mock real-time web services', 'Use localized integration runners'],
                      matchingUsernames: ['lyn', 'test_architect'],
                      summary: 'Topics: API Testing, Database Optimization. Decisions: Mock real-time web services; Use localized integration runners.'
                    })
                  }
                }
              ]
            };
          }
        }
      };
    }
  };
});

// Mock Redis to prevent runtime startup hang issues
vi.mock('../../src/config/redis', () => {
  const mockRedisInstance = {
    duplicate: vi.fn().mockImplementation(() => mockRedisInstance),
    on: vi.fn(),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    psubscribe: vi.fn().mockResolvedValue(undefined),
  };
  return { pubClient: mockRedisInstance, subClient: mockRedisInstance, redis: mockRedisInstance };
});

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';
const ROUTE_PREFIX = '/api/ai';

describe('AI Module API Integration Tests', () => {
  let userToken: string;
  let userId: string;
  let companionChatId: string;
  const timestamp = Date.now();

  beforeAll(async () => {
    const email = `ai_tester_${timestamp}@example.com`;

    // Database state pre-clean
    try { await (prisma as any).message?.deleteMany({ where: { user: { email } } }); } catch (e) {}
    try { await (prisma as any).chatParticipant?.deleteMany({ where: { user: { email } } }); } catch (e) {}
    try { await (prisma as any).user?.deleteMany({ where: { email } }); } catch (e) {}

    // Provision test profile
    const user = await (prisma as any).user.create({
      data: {
        email,
        username: `ai_architect_${timestamp}`,
        displayName: 'AI Systems Architect',
        firebaseUid: `uid_ai_${timestamp}`,
        settings: { aiEnabled: true, lynPersonality: 'professional' }
      }
    });
    userId = user.id;

    userToken = jwt.sign({ id: userId, uid: user.firebaseUid, email: user.email }, JWT_SECRET);
  });

  afterAll(async () => {
    try { if (companionChatId) await (prisma as any).chat?.delete({ where: { id: companionChatId } }); } catch (e) {}
    try { await (prisma as any).user?.deleteMany({ where: { id: userId } }); } catch (e) {}
  });

  // ──── CHAT INITIALIZATION & CORE AGENT HANDSHAKE ────

  it('should initiate a dedicated chat conversation stream with Lyn AI agent', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/chat/initiate`)
      .set('Authorization', `Bearer ${userToken}`);

    expect([200, 201]).toContain(response.status);
    expect(response.body).toHaveProperty('id');
    companionChatId = response.body.id;
  });

  // ──── COGNITIVE PROCESSING (SMART REPLY & SUMMARY) ────

  it('should generate suggested contextual smart replies for an active chat window', async () => {
    if (!companionChatId) return;
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/smart-reply`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ chatId: companionChatId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('replies');
    expect(Array.isArray(response.body.replies)).toBe(true);
  });

  it('should extract summaries, action topics, and structural decisions from a conversation history', async () => {
    if (!companionChatId) return;
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/summarize`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ chatId: companionChatId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary');
  });

  // ──── NATURAL LANGUAGE ENGINE SEARCHES & EXTRACTIONS ────

  it('should execute natural language semantic indexing message lookups', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/search`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ query: 'Where are the production migration scripts?' });

    expect(response.status).toBe(200);
  });

  it('should isolate a contact query based on user-provided parameters', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/contact`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ query: 'Find the lead security auditor' });

    expect(response.status).toBe(200);
  });
it('should produce draft responses seamlessly', async () => {
    if (!companionChatId) return;
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/draft`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ 
        chatId: companionChatId, 
        personality: 'friendly' 
      });

    expect(response.status).toBe(200);
  });

  it('should match similar conversational topics across discoverable users bios', async () => {
    if (!companionChatId) return;
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/discover`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ chatId: companionChatId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('topics');
  });

  // ──── AGENT SETTINGS CONFIGURATIONS ────

  it('should view localized AI preferences and agent personality configurations', async () => {
    const response = await request(app)
      .get(`${ROUTE_PREFIX}/settings`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('aiEnabled');
  });

  it('should update specific parameters on agent settings variables', async () => {
    const response = await request(app)
      .put(`${ROUTE_PREFIX}/settings`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        aiEnabled: true,
        lynPersonality: 'custom',
        lynCustomPersonality: 'Hyper-efficient Senior Infrastructure Architect.'
      });

    expect(response.status).toBe(200);
    expect(response.body.lynPersonality).toBe('custom');
  });
});