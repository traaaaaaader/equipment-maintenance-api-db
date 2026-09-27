import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;
let equipmentId: string;
let technicianId: string;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();

  const eq = await request(app).post('/api/equipment').send({
    name: 'Concurrency Test Equipment',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 1, lon: 1 },
    installedAt: '2020-01-01',
  });
  equipmentId = eq.body.data.id;

  const { TechnicianModel } = await import('../src/models/technician.model.js');
  const tech = await TechnicianModel.create({
    fullName: 'Concurrency Tech',
    specialization: 'Электрик',
    badgeNumber: `TECH-${Math.random().toString(36).slice(2, 8)}`,
  });
  technicianId = tech.id;
});

afterAll(closeDatabase);

describe('Concurrent status change on the same request', () => {
  it('only one of two simultaneous new -> in_progress requests succeeds, exactly one history entry is written', async () => {
    const created = await request(app)
      .post('/api/requests')
      .send({ equipmentId, title: 'Race condition target', priority: 'medium' });
    const id = created.body.data.id;

    await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({ assignees: [{ technicianId, role: 'lead', plannedHours: 4 }] })
      .expect(200);

    const [first, second] = await Promise.all([
      request(app).patch(`/api/requests/${id}/status`).send({ status: 'in_progress' }),
      request(app).patch(`/api/requests/${id}/status`).send({ status: 'in_progress' }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = first.status === 200 ? first : second;
    expect(winner.body.data.status).toBe('in_progress');

    const loser = first.status === 409 ? first : second;
    expect(loser.body.error.code).toBe('CONFLICT');

    const history = await request(app).get(`/api/requests/${id}/history`);
    expect(history.body.meta.total).toBe(1);
    expect(history.body.data[0]).toMatchObject({ previousStatus: 'new', newStatus: 'in_progress' });
  });
});
