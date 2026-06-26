import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';
import jwt from 'jsonwebtoken';

// 1. Isolation Mocking: Intercept Vercel Blob SDK network traffic safely
vi.mock('@vercel/blob', () => {
  return {
    put: vi.fn().mockImplementation(async (pathname: string) => {
      return {
        url: `https://hebbkx1anhila5yf.public.blob.vercel-storage.com/${pathname}-mocked123.jpg`,
        pathname: `uploads/${pathname}`,
        contentType: 'image/jpeg',
        contentDisposition: 'inline',
      };
    }),
  };
});

// Mock Redis configuration layout to prevent suite hangs
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
const ROUTE_PREFIX = '/api/upload'; // Match your exact mounting setup from server index (singular or plural)

describe('Upload Module Integration Tests', () => {
  let userToken: string;
  let userId: string;
  const timestamp = Date.now();

  beforeAll(async () => {
    // Inject mock environment variable token so service check bypasses safely
    process.env.BLOB_READ_WRITE_TOKEN = 'mock_vercel_blob_token_value';

    const email = `upload_tester_${timestamp}@example.com`;
    try { await (prisma as any).user?.deleteMany({ where: { email } }); } catch (e) {}

    // Provision dummy user profile for token signing and auth checks
    const user = await (prisma as any).user.create({
      data: {
        email,
        username: `upload_dev_${timestamp}`,
        displayName: 'Upload Orchestrator',
        firebaseUid: `uid_upload_${timestamp}`,
      },
    });
    userId = user.id;

    userToken = jwt.sign({ id: userId, uid: user.firebaseUid, email: user.email }, JWT_SECRET);
  });

  // ──── CHANNELS OF TEST EXECUTION ────

  it('should reject requests that contain no file attachments with a 400 status code', async () => {
    const response = await request(app)
      .post(`${ROUTE_PREFIX}/`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message || response.body.error).toContain('No file uploaded');
  });

  it('should successfully upload and process an image file via Sharp optimization pipelines', async () => {
    // Generate a dummy 1x1 transparent tracking pixel buffer for testing image processing
    const samplePixelImageBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    const response = await request(app)
      .post(`${ROUTE_PREFIX}/`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', samplePixelImageBuffer, 'test_avatar.png');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('url');
    expect(response.body.url).toContain('vercel-storage.com');
    // Verifies service mapping forced extension manipulation to .jpg cleanly
    expect(response.body.filename).toContain('.jpg'); 
  });

  it('should handle raw document text files bypassing image optimization mechanics smoothly', async () => {
    const sampleTextBuffer = Buffer.from('System testing array logs pipeline telemetry data streams.');

    const response = await request(app)
      .post(`${ROUTE_PREFIX}/`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', sampleTextBuffer, 'system_manifest.txt');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.filename).toContain('system_manifest.txt');
  });
});