import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';
import { registerAndLogin, authHeader, type TestUser } from './helpers/authHelpers.js';

let app: Express;
let admin: TestUser;
let equipmentId: string;
let technicianId: string;

beforeAll(async () => {
  ({ app } = await createTestApp());
});

beforeEach(async () => {
  await resetDatabase();
  admin = await registerAndLogin(app, 'admin');

  const eq = await request(app)
    .post('/api/equipment')
    .set(authHeader(admin.token))
    .send({
      name: 'History Test Equipment',
      type: 'turbine',
      serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
      location: { lat: 1, lon: 1 },
      installedAt: '2020-01-01',
    });
  equipmentId = eq.body.data.id;

  const { TechnicianModel } = await import('../src/models/technician.model.js');
  const tech = await TechnicianModel.create({
    fullName: 'Historian',
    specialization: 'Электрик',
    badgeNumber: `TECH-${Math.random().toString(36).slice(2, 8)}`,
  });
  technicianId = tech.id;
});

afterAll(closeDatabase);

describe('Request status history', () => {
  it('is empty for a freshly created request', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Fresh request', priority: 'low' });

    const res = await request(app)
      .get(`/api/requests/${created.body.data.id}/history`)
      .set(authHeader(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('records each status transition in chronological order, with changedBy set', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Tracked request', priority: 'medium' });
    const id = created.body.data.id;

    await request(app)
      .post(`/api/requests/${id}/assignees`)
      .set(authHeader(admin.token))
      .send({ assignees: [{ technicianId, role: 'lead', plannedHours: 4 }] })
      .expect(200);
    await request(app)
      .patch(`/api/requests/${id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'in_progress' })
      .expect(200);
    await request(app)
      .patch(`/api/requests/${id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'done' })
      .expect(200);

    const res = await request(app).get(`/api/requests/${id}/history`).set(authHeader(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.map((h: { newStatus: string }) => h.newStatus)).toEqual([
      'in_progress',
      'done',
    ]);
    expect(res.body.data[0].previousStatus).toBe('new');
    expect(res.body.data[1].previousStatus).toBe('in_progress');
    expect(res.body.data[0].changedBy).toBe(admin.userId);
  });

  it('returns 404 for a non-existent request', async () => {
    const res = await request(app)
      .get('/api/requests/00000000-0000-4000-8000-000000000000/history')
      .set(authHeader(admin.token));
    expect(res.status).toBe(404);
  });
});
