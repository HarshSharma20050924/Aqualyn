import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';

describe('API Health Check Integration Test', () => {
  it('should return 200 and a status message', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('Aqualyn server is running');
  });
});
