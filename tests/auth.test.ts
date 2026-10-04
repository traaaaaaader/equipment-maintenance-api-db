import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();
});

beforeEach(resetDatabase);

afterAll(closeDatabase);

function credentials(overrides: Record<string, unknown> = {}) {
  return {
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    name: 'Test User',
    password: 'Passw0rd123',
    ...overrides,
  };
}

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user with the default viewer role and never leaks the password hash', async () => {
      const body = credentials();
      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('viewer');
      expect(res.body.data.email).toBe(body.email);
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('rejects a duplicate email with 409', async () => {
      const body = credentials();
      await request(app).post('/api/auth/register').send(body).expect(201);

      const res = await request(app).post('/api/auth/register').send(body);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejects a weak password with 422', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(credentials({ password: 'short' }));
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('ignores a client-supplied role and never grants admin on self-registration', async () => {
      const body = { ...credentials(), role: 'admin' };
      const res = await request(app).post('/api/auth/register').send(body);
      expect(res.body.data.role).toBe('viewer');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials: returns accessToken and sets refresh cookie', async () => {
      const body = credentials();
      await request(app).post('/api/auth/register').send(body);

      const res = await request(app).post('/api/auth/login').send({
        email: body.email,
        password: body.password,
      });

      expect(res.status).toBe(200);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.user.email).toBe(body.email);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/HttpOnly/i);
      expect(refreshCookie).toMatch(/SameSite=Strict/i);
    });

    it('returns the exact same generic error for a non-existent user and a wrong password', async () => {
      const body = credentials();
      await request(app).post('/api/auth/register').send(body);

      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: body.email, password: 'WrongPassw0rd1' });
      const noSuchUser = await request(app)
        .post('/api/auth/login')
        .send({ email: 'no-such-user@example.com', password: 'WrongPassw0rd1' });

      expect(wrongPassword.status).toBe(401);
      expect(noSuchUser.status).toBe(401);
      expect(wrongPassword.body.error.message).toBe(noSuchUser.body.error.message);
    });
  });

  describe('POST /api/auth/refresh and /api/auth/logout', () => {
    it('rotates the refresh token and issues a working new access token', async () => {
      const body = credentials();
      await request(app).post('/api/auth/register').send(body);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: body.email, password: body.password });

      const cookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
        c.startsWith('refreshToken='),
      )!;

      const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
      expect(refreshRes.status).toBe(200);
      expect(typeof refreshRes.body.data.accessToken).toBe('string');

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe(body.email);

      // Старый refresh-токен уже использован (ротация) — повторное применение отклоняется.
      const reuse = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
      expect(reuse.status).toBe(401);
    });

    it('returns 401 when there is no refresh cookie at all', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('logout revokes the refresh token and clears the cookie', async () => {
      const body = credentials();
      await request(app).post('/api/auth/register').send(body);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: body.email, password: body.password });
      const cookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
        c.startsWith('refreshToken='),
      )!;

      const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);
      expect(logoutRes.status).toBe(204);

      const refreshAfterLogout = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
      expect(refreshAfterLogout.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects an invalid/garbage access token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });
  });

  describe('Login rate limiting', () => {
    it('blocks login attempts after the configured threshold (429)', async () => {
      const email = `ratelimit_${Date.now()}@example.com`;
      let lastStatus = 0;
      for (let i = 0; i < 15; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'wrong-password-1' });
        lastStatus = res.status;
        if (lastStatus === 429) break;
      }
      expect(lastStatus).toBe(429);
    });
  });
});
