import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;

beforeAll(async () => {
  ({ app } = await createTestApp());
});

beforeEach(resetDatabase);

afterAll(closeDatabase);

describe('Health, 404 and error format', () => {
	it('GET /api/health/live returns ok without touching the database', async () => {
    const res = await request(app).get('/api/health/live');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /api/health/ready returns ok with db status when the database is reachable', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      status: 'ok',
      database: 'up',
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });
  });

  it('unknown routes return 404 in the unified error format', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: expect.any(String),
        requestId: expect.any(String),
      },
    });
  });

  it('every response carries an X-Request-Id header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('malformed JSON body returns 400 before auth/routing even runs', async () => {
    const res = await request(app)
      .post('/api/auth/logi')
      .set('Content-Type', 'application/json')
      .send('{ this is not json');

    expect(res.status).toBe(400);
    expect(res.body.error.requestId).toBeDefined();
  });
});
