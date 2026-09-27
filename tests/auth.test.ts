import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;

beforeAll(async () => {
  ({ app } = await createTestApp({ apiKeys: 'secret-1,secret-2' }));
  await resetDatabase();
});

afterAll(closeDatabase);

describe('API key authentication (bonus)', () => {
  const payload = {
    name: 'Sensor X',
    type: 'sensor',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 1, lon: 1 },
    installedAt: '2021-01-01',
  };

  it('rejects mutating requests without an API key (401)', async () => {
    const res = await request(app).post('/api/equipment').send(payload);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid API key (401)', async () => {
    const res = await request(app).post('/api/equipment').set('X-API-Key', 'wrong').send(payload);
    expect(res.status).toBe(401);
  });

  it('accepts a valid API key', async () => {
    const res = await request(app).post('/api/equipment').set('X-API-Key', 'secret-1').send(payload);
    expect(res.status).toBe(201);
  });

  it('does not require an API key for read-only requests', async () => {
    const res = await request(app).get('/api/equipment');
    expect(res.status).toBe(200);
  });
});
