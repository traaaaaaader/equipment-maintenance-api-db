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

  const eq = await request(app)
    .post('/api/equipment')
    .send({
      name: 'Substation Main',
      type: 'substation',
      serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
      location: { lat: 10, lon: 10 },
      installedAt: '2022-05-01',
    });
  equipmentId = eq.body.data.id;

  const { TechnicianModel } = await import('../src/models/technician.model.js');
  const technician = await TechnicianModel.create({
    fullName: 'Test Technician',
    specialization: 'Электрик',
    badgeNumber: `TECH-TEST-${Math.random().toString(36).slice(2, 8)}`,
  });
  technicianId = technician.id;
});

afterAll(closeDatabase);

describe('Maintenance requests', () => {
  it('rejects request for non-existent equipment with 404', async () => {
    const res = await request(app).post('/api/requests').send({
      equipmentId: '00000000-0000-0000-0000-000000000000',
      title: 'Ghost equipment',
      priority: 'low',
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('creates a request with default status "new"', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({ equipmentId, title: 'Replace fuse', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('new');
    expect(res.headers.location).toBe(`/api/requests/${res.body.data.id}`);
  });

  it('blocks in_progress without an assigned brigade (409)', async () => {
    const created = await request(app)
      .post('/api/requests')
      .send({ equipmentId, title: 'No brigade yet', priority: 'medium' });

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('enforces the status transition table', async () => {
    const created = await request(app)
      .post('/api/requests')
      .send({ equipmentId, title: 'Inspect wiring', priority: 'medium' });
    const id = created.body.data.id;

    const badJump = await request(app).patch(`/api/requests/${id}/status`).send({ status: 'done' });
    expect(badJump.status).toBe(409);
    expect(badJump.body.error.code).toBe('CONFLICT');

    await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({ assignees: [{ technicianId, role: 'lead', plannedHours: 4 }] })
      .expect(200);

    const toInProgress = await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: 'in_progress' });
    expect(toInProgress.status).toBe(200);
    expect(toInProgress.body.data.status).toBe('in_progress');

    const toDone = await request(app).patch(`/api/requests/${id}/status`).send({ status: 'done' });
    expect(toDone.status).toBe(200);
    expect(toDone.body.data.status).toBe('done');

    const fromTerminal = await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: 'rejected' });
    expect(fromTerminal.status).toBe(409);
  });

  it('lists requests for a specific equipment via the nested resource', async () => {
    const res = await request(app).get(`/api/equipment/${equipmentId}/requests`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { equipmentId: string }) => r.equipmentId === equipmentId)).toBe(
      true,
    );
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('deletes a request', async () => {
    const created = await request(app)
      .post('/api/requests')
      .send({ equipmentId, title: 'Temporary request', priority: 'low' });

    const res = await request(app).delete(`/api/requests/${created.body.data.id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/requests/${created.body.data.id}`);
    expect(getRes.status).toBe(404);
  });
});
