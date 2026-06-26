import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';
import jwt from 'jsonwebtoken';

// Add this mock near the top of tests/integration/admin.test.ts to short-circuit Supabase network lookups during testing
vi.mock('../../middleware/auth', () => {
  return {
    verifyToken: (req: any, res: any, next: any) => {
      // Parse token from header to simulate extractors if required
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader === 'Bearer undefined') {
        return res.status(401).json({ error: 'Unauthorized credentials session' });
      }
      
      // Inject dummy payload to bypass down-stream checks safely
      req.user = { id: req.user?.id || 'mocked-admin-id' };
      next();
    },
    isAdmin: async (req: any, res: any, next: any) => {
      next(); // Bypasses explicit role guards natively in testing context
    }
  };
});

const JWT_SECRET = process.env.JWT_SECRET || '07f4aa247bb2789d402af105e7fc416e57aebb266facfb2c30ad2843a86e4e61';
const ROUTE_PREFIX = '/api/admin';

describe('Admin Module API Integration Tests', () => {
  let adminToken: string;
  let adminId: string;
  let targetUserId: string;
  let sampleReportId: string;
  const timestamp = Date.now();
beforeAll(async () => {
    const adminEmail = `admin_tester_${timestamp}@example.com`;
    const userEmail = `banned_user_${timestamp}@example.com`;

    // 1. Clear database state with strict dependency order
    try {
      // Step A: Clear second-tier dependent collections
      if ((prisma as any).report) await (prisma as any).report.deleteMany({});
      
      // Step A: Clear out polymorphic/dependent relations first
if ((prisma as any).notification) await (prisma as any).notification.deleteMany({});
if ((prisma as any).activity) await (prisma as any).activity.deleteMany({});
if ((prisma as any).followRequest) await (prisma as any).followRequest.deleteMany({});
if ((prisma as any).userFollows) await (prisma as any).userFollows.deleteMany({});
if ((prisma as any).session) await (prisma as any).session.deleteMany({});

// Step B: Now safely clean out the target tester users and existing admins
await (prisma as any).user.deleteMany({
  where: {
    OR: [
      { email: adminEmail },
      { email: userEmail },
      { role: 'admin' }
    ]
  }
});
    } catch (e) {
      console.error('Pre-test cleanup error safely handled: ', e);
    }

    // 2. Provision Target User for moderation checks
    const targetUser = await (prisma as any).user.create({
      data: {
        email: userEmail,
        username: `user_mod_${timestamp}`,
        displayName: 'Target User',
        firebaseUid: `uid_target_${timestamp}`,
        settings: { banned: false }
      }
    });
    targetUserId = targetUser.id;

    // 3. Provision Sample Report record
    const report = await (prisma as any).report.create({
      data: {
        reporterId: targetUserId,
        reportedId: targetUserId,
        reason: 'Testing moderation pipeline logic',
        status: 'pending'
      }
    });
    sampleReportId = report.id;
  });
  afterAll(async () => {
    try { await (prisma as any).report?.deleteMany({}); } catch (e) {}
    try { await (prisma as any).user?.deleteMany({ where: { id: { in: [adminId, targetUserId] } } }); } catch (e) {}
  });

  // ──── UNPROTECTED AUTH LIFECYCLE FLOWS ────

  it('should provision the root master admin profile securely via setup', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/setup`)
      .send({
        email: `admin_tester_${timestamp}@example.com`,
        password: 'securePassword123',
        name: 'System Admin Architect'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token');
    
    adminToken = response.body.token;
    adminId = response.body.admin?.id || response.body.user?.id;
  });

  it('should successfully authenticate credentials and return active token session', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/login`)
      .send({
        email: `admin_tester_${timestamp}@example.com`,
        password: 'securePassword123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token');
  });

  // ──── PROTECTED DASHBOARD AND ANALYTICS METRICS ────

  it('should fetch global platform aggregate status information metrics cleanly', async () => {
    const response = await request(app)
      .get(`${ROUTE_PREFIX}/stats`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalUsers');
  });

  it('should fetch temporal dashboard charts data streams cleanly', async () => {
    const response = await request(app)
      .get(`${ROUTE_PREFIX}/analytics`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  // ──── MODERATION CONSOLE PIPELINES ────

  it('should fetch a paginated registry of platform profiles', async () => {
    const response = await request(app)
      .get(`${ROUTE_PREFIX}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('users');
  });

  it('should modify state flag variables to ban or restrict access for a target user', async () => {
    const response = await request(app)
      .patch(`${ROUTE_PREFIX}/users/${targetUserId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ban: true });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should fetch a filterable timeline registry of submitted policy abuse reports', async () => {
    const response = await request(app)
      .get(`${ROUTE_PREFIX}/reports`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'pending' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reports');
  });

  it('should resolve open abuse reports and apply relevant cascading actions', async () => {
    if (!sampleReportId) return;
    const response = await request(app)
      .patch(`${ROUTE_PREFIX}/reports/${sampleReportId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'ban',
        adminNotes: 'Confirmed violation of core communication standards.'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  // ──── SYSTEM CLEANUP OPERATIONS ────

  it('should refuse to trigger database resets on invalid parameters', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/reset-database`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmReset: 'INVALID_PASSPHRASE' });

    expect(response.status).toBe(400);
  });

  it('should cleanly flush obsolete active auth token cache states from database tables', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/cleanup-sessions`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});