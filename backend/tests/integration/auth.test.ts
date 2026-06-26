import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import prisma from '../../src/config/prisma';

describe('Auth API Integration Tests', () => {

  beforeAll(async () => {
    // Setup - Ensure the test user does not exist
    await (prisma as any).user.deleteMany({
      where: { email: 'test_integration@example.com' }
    });
  });

  afterAll(async () => {
    // Cleanup
    await (prisma as any).user.deleteMany({
      where: { email: 'test_integration@example.com' }
    });
  });

  it('should return 400 if no identifier is provided for OTP', async () => {
    const response = await request(app).post('/api/auth/send-otp').send({});
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain('Identifier is required');
  });

  it('should send OTP and indicate user does not exist', async () => {
    const response = await request(app)
      .post('/api/auth/send-otp')
      .send({ identifier: 'test_integration@example.com' });
    
    expect(response.status).toBe(200);
    expect(response.body.isExisting).toBe(false);
    expect(response.body.message).toContain('OTP sent');
  });

  it('should generate a QR token for login', async () => {
    const response = await request(app).post('/api/auth/qr/generate');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('qrToken');
    
    // Check status of the generated token
    const token = response.body.qrToken;
    const statusResponse = await request(app).get(`/api/auth/qr/status/${token}`);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe('pending');
  });

});
