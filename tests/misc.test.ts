import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();
});

afterAll(closeDatabase);

describe('Health, 404 and error format', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
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

  it('malformed JSON body returns 400', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .set('Content-Type', 'application/json')
      .send('{ this is not json');

    expect(res.status).toBe(400);
    expect(res.body.error.requestId).toBeDefined();
  });
});
