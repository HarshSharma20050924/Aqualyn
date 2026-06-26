import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';
import jwt from 'jsonwebtoken';


// Mock Redis layout comprehensively to isolate testing from both event publishers, BullMQ, and Socket.io cluster adapters
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

describe('Social API Integration Tests', () => {
  let testUserToken: string;
  let userId: string;
  let testPostId: string;
  let testCommentId: string;
  let testReplyCommentId: string;
  let testStoryId: string;

  beforeAll(async () => {
    // 1. Clean out existing trace target data to ensure pristine execution state
    await (prisma as any).user.deleteMany({
      where: { email: 'social_integration@example.com' }
    });

    // 2. Build explicit Test User row
    const user = await (prisma as any).user.create({
      data: {
        email: 'social_integration@example.com',
        username: 'social_integration_dev',
        displayName: 'Social Integration Tester',
        firebaseUid: 'social_integration_uid',
      }
    });
    userId = user.id;

    // 3. Issue valid JWT auth token matching verification structure
    testUserToken = jwt.sign(
      { id: userId, uid: user.firebaseUid, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Teardown relations sequentially backwards to respect Foreign Key rules securely
    await (prisma as any).commentLike.deleteMany({ where: { userId } });
    await (prisma as any).comment.deleteMany({ where: { userId } });
    await (prisma as any).like.deleteMany({ where: { userId } });
    await (prisma as any).savedPost.deleteMany({ where: { userId } });
    await (prisma as any).storyView.deleteMany({ where: { userId } });
    await (prisma as any).story.deleteMany({ where: { userId } });
    await (prisma as any).post.deleteMany({ where: { authorId: userId } });
    await (prisma as any).user.deleteMany({ where: { id: userId } });
  });

  // ──── POST SYSTEM TESTS ────

  it('should successfully create a new post', async () => {
    const response = await request(app)
      .post('/api/social/post')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        content: 'Testing production social endpoints architecture!',
        mediaUrl: 'https://example.com/mock-media.jpg',
        mediaType: 'image'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('post');
    expect(response.body.post.content).toBe('Testing production social endpoints architecture!');
    
    testPostId = response.body.post.id;
  });

  it('should toggle and append a like to the post', async () => {
    const response = await request(app)
      .post(`/api/social/post/${testPostId}/like`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('liked', true);
  });

  it('should fetch the global/following feed successfully', async () => {
    const response = await request(app)
      .get('/api/social/feed')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].id).toBe(testPostId);
  });

  it('should fetch user specific posts with pagination options', async () => {
    const response = await request(app)
      .get(`/api/social/user/${userId}/posts?limit=10`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // ──── COMMENT SYSTEM TESTS ────

  it('should post a comment on the created post', async () => {
    const response = await request(app)
      .post(`/api/social/post/${testPostId}/comment`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        content: 'This is an automated structural comment assertion.'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.comment.content).toBe('This is an automated structural comment assertion.');
    
    testCommentId = response.body.comment.id;
  });

  it('should fetch paginated comments for the post', async () => {
    const response = await request(app)
      .get(`/api/social/post/${testPostId}/comments`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should successfully reply to a specific comment thread', async () => {
    const response = await request(app)
      .post(`/api/social/post/${testPostId}/comment/${testCommentId}/reply`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        content: 'Automated evaluation reply comment thread.'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.reply.content).toBe('Automated evaluation reply comment thread.');
    testReplyCommentId = response.body.reply.id;
  });

  it('should toggle a like on a specific comment', async () => {
    const response = await request(app)
      .post(`/api/social/comment/${testCommentId}/like`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('liked', true);
  });

  // ──── BOOKMARK & STORY TESTS ────

  it('should toggle saving/bookmarking a post', async () => {
    const response = await request(app)
      .post(`/api/social/post/${testPostId}/save`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('saved', true);
  });

  it('should fetch a collection of saved posts via paginated parameters', async () => {
    const response = await request(app)
      .get('/api/social/saved-posts?limit=5')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should successfully create a new user story', async () => {
    const response = await request(app)
      .post('/api/social/story')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        mediaUrl: 'https://example.com/story-frame.jpg',
        mediaType: 'image',
        content: 'Brief life update text string.'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('story');
    
    testStoryId = response.body.story.id;
  });

  it('should record a view on the target story', async () => {
    const response = await request(app)
      .post(`/api/social/story/${testStoryId}/view`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  // ──── DELETION HARDENING TESTS ────

  it('should safely delete an individual comment without violating relationships', async () => {
    const response = await request(app)
      .delete(`/api/social/comment/${testReplyCommentId}`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should successfully clean up a complete post layout via cascade transactions', async () => {
    const response = await request(app)
      .delete(`/api/social/post/${testPostId}`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});