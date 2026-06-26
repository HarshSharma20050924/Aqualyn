import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';
import jwt from 'jsonwebtoken';

// Fully mock Redis layout to bypass BullMQ and Socket.io server startup initializations
vi.mock('../../src/config/redis', () => {
  const mockRedisInstance = {
    duplicate: vi.fn().mockImplementation(() => mockRedisInstance),
    on: vi.fn(),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    psubscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    punsubscribe: vi.fn().mockResolvedValue(undefined),
  };

  return {
    pubClient: mockRedisInstance,
    subClient: mockRedisInstance,
    redis: mockRedisInstance,
  };
});

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

// NOTE: Update this to '/api/groups' if your server binds via plural convention in server.ts
const ROUTE_PREFIX = '/api/groups'; 

describe('Group API Integration Tests', () => {
  let ownerToken: string;
  let memberToken: string;
  
  let ownerId: string;
  let memberId: string;
  
  let testGroupId: string;
  let testInviteToken: string;

 beforeAll(async () => {
    // 1. Clean out existing test-specific footprints comprehensively
    await (prisma as any).chatParticipant.deleteMany({
      where: { user: { email: { in: ['owner_group@example.com', 'member_group@example.com', 'token_joiner@example.com'] } } }
    });
    await (prisma as any).user.deleteMany({
      where: { email: { in: ['owner_group@example.com', 'member_group@example.com', 'token_joiner@example.com'] } }
    });

    // 2. Provision Group Owner Profile
    const owner = await (prisma as any).user.create({
      data: {
        email: 'owner_group@example.com',
        username: 'group_owner_dev',
        displayName: 'Group Owner Tester',
        firebaseUid: 'uid_owner_group_test',
      }
    });
    ownerId = owner.id;

    // 3. Provision Auxiliary Participant Profile
    const member = await (prisma as any).user.create({
      data: {
        email: 'member_group@example.com',
        username: 'group_member_dev',
        displayName: 'Group Member Tester',
        firebaseUid: 'uid_member_group_test',
      }
    });
    memberId = member.id;

    // 4. Issue Authentic JSON Web Tokens
    ownerToken = jwt.sign({ id: ownerId, uid: owner.firebaseUid, email: owner.email }, JWT_SECRET, { expiresIn: '1h' });
    memberToken = jwt.sign({ id: memberId, uid: member.firebaseUid, email: member.email }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Cascading structural cleanup
    if (testGroupId) {
      await (prisma as any).message.deleteMany({ where: { chatId: testGroupId } });
      await (prisma as any).chatParticipant.deleteMany({ where: { chatId: testGroupId } });
      await (prisma as any).chat.deleteMany({ where: { id: testGroupId } });
    }
    await (prisma as any).user.deleteMany({ where: { id: { in: [ownerId, memberId] } } });
  });

  // ──── GROUP MANAGEMENT ACTIONS ────

  it('should successfully build a professional group chat layout', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/create`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Architecture & Scalability Pod',
        description: 'Design matrix coordination environment.',
        participantIds: [memberId]
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.group).toHaveProperty('id');
    expect(response.body.group.isGroup).toBe(true);
    
    testGroupId = response.body.group.id;
    testInviteToken = response.body.group.inviteToken;
  });

  it('should enable prospective invitees to accept native invitations', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/${testGroupId}/invitation/handle`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ action: 'accept' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should allow administrative settings updates from authorized owners', async () => {
    const response = await request(app)
      .patch(`${ROUTE_PREFIX}/${testGroupId}/settings`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        settings: { canMessage: 'admins', canInvite: 'all' }
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should block administrative updates from unprivileged members', async () => {
    const response = await request(app)
      .patch(`${ROUTE_PREFIX}/${testGroupId}/settings`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        settings: { canMessage: 'everyone' }
      });

    expect(response.status).not.toBe(200);
  });

  it('should elevate standard participant roles through promotion actions', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/${testGroupId}/member/${memberId}/role`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should parse metadata matrices and compile complete structural group information', async () => {
    const response = await request(app)
      .get(`${ROUTE_PREFIX}/${testGroupId}/info`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testGroupId);
    expect(response.body).toHaveProperty('mediaCount');
    expect(response.body).toHaveProperty('participantCount');
    expect(typeof response.body.participantCount).toBe('number');
  });

  it('should process token-based entries smoothly via dynamic join links', async () => {
    const timestamp = Date.now();
    const looseUser = await (prisma as any).user.create({
      data: {
        email: `token_joiner_${timestamp}@example.com`,
        username: `token_joiner_${timestamp}`,
        firebaseUid: `uid_token_joiner_${timestamp}` // Guaranteed unique across concurrent runs
      }
    });
    const looseToken = jwt.sign({ id: looseUser.id, uid: looseUser.firebaseUid, email: looseUser.email }, JWT_SECRET);

    const response = await request(app)
      .post(`${ROUTE_PREFIX}/join/${testInviteToken}`)
      .set('Authorization', `Bearer ${looseToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);

    await (prisma as any).chatParticipant.deleteMany({ where: { userId: looseUser.id } });
    await (prisma as any).user.delete({ where: { id: looseUser.id } });
  });

  it('should allow users to leave groups cleanly', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/${testGroupId}/leave`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});