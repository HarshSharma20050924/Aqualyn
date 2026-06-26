import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';

describe('Chat API Integration Tests', () => {
  let testUser1Token: string;
  let testUser2Token: string;
  let user1Id: string;
  let user2Id: string;
  let testChatId: string;

  beforeAll(async () => {
    // 1. Clean up existing test users
    await (prisma as any).user.deleteMany({
      where: { email: { in: ['chatuser1@example.com', 'chatuser2@example.com'] } }
    });

    // 2. Create Test Users
    const user1 = await (prisma as any).user.create({
      data: {
        email: 'chatuser1@example.com',
        username: 'chatuser1_test',
        displayName: 'Test User 1',
        firebaseUid: 'test_uid_1',
      }
    });
    user1Id = user1.id;

    const user2 = await (prisma as any).user.create({
      data: {
        email: 'chatuser2@example.com',
        username: 'chatuser2_test',
        displayName: 'Test User 2',
        firebaseUid: 'test_uid_2',
      }
    });
    user2Id = user2.id;

    // 3. Generate JWT Tokens
    testUser1Token = jwt.sign(
      { id: user1Id, uid: user1.firebaseUid, email: user1.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    testUser2Token = jwt.sign(
      { id: user2Id, uid: user2.firebaseUid, email: user2.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

 afterAll(async () => {
    // 1. Wipe out Message Reactions for test chat messages first
    await (prisma as any).messageReaction.deleteMany({
      where: {
        message: {
          chat: {
            participants: {
              some: { userId: user1Id }
            }
          }
        }
      }
    });

    // 2. Delete all Messages tied to these test chats
    await (prisma as any).message.deleteMany({
      where: {
        chat: {
          participants: {
            some: { userId: user1Id }
          }
        }
      }
    });

    // 3. Clear any loose MutedChat records pointing to these tests
    await (prisma as any).mutedChat.deleteMany({
      where: {
        userId: { in: [user1Id, user2Id] }
      }
    });

    // 4. Delete ChatParticipants (though Cascade handles this, keeping it ensures absolute safety)
    await (prisma as any).chatParticipant.deleteMany({
      where: {
        chat: {
          participants: {
            some: { userId: user1Id }
          }
        }
      }
    });

    // 5. Safely delete the parent Chat records now that they have no references
    await (prisma as any).chat.deleteMany({
      where: {
        participants: {
          some: { userId: user1Id }
        }
      }
    });

    // 6. Finally, drop the test users out of the DB completely
    await (prisma as any).user.deleteMany({
      where: { id: { in: [user1Id, user2Id] } }
    });
  });
  it('should prevent unauthorized access to /api/chats', async () => {
    const response = await request(app).get('/api/chats');
    expect(response.status).toBe(401);
  });

  it('should fetch empty chats list for a new user', async () => {
    const response = await request(app)
      .get('/api/chats')
      .set('Authorization', `Bearer ${testUser1Token}`);
    
    if (response.status !== 200) {
      console.log('GET /api/chats failed:', response.body);
    }
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create a new 1-on-1 chat', async () => {
    const response = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${testUser1Token}`)
      .send({
        isGroup: false,
        name: '',
        memberIds: [user2Id]
      });
    
    expect(response.status).toBe(200); // Controller sends status 200 by default
    expect(response.body).toHaveProperty('id');
    testChatId = response.body.id;
  });

  it('should send a message to the newly created chat', async () => {
    const response = await request(app)
      .post(`/api/chats/${testChatId}/messages`)
      .set('Authorization', `Bearer ${testUser1Token}`)
      .send({
        content: 'Hello from integration tests!' // Adjusted to use "content"
      });
    
    if (response.status !== 200) {
      console.log('Message sending failure details:', response.body);
    }
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('text', 'Hello from integration tests!');
    expect(response.body.senderId).toBe(user1Id);
  });

  it('should fetch messages from the chat', async () => {
    const response = await request(app)
      .get(`/api/chats/${testChatId}/messages`)
      .set('Authorization', `Bearer ${testUser2Token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array); // Directly asserts on returned array
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].text).toBe('Hello from integration tests!');
  });
});

