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

function sampleEquipment(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Turbine A1',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 55.75, lon: 37.61 },
    installedAt: '2023-01-01',
    ...overrides,
  };
}

describe('Equipment CRUD', () => {
  it('rejects invalid payload with 422 and field details', async () => {
    const res = await request(app).post('/api/equipment').send({ name: 'X' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('creates equipment and returns 201 with Location header', async () => {
    const res = await request(app).post('/api/equipment').send(sampleEquipment());

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/equipment/${res.body.data.id}`);
    expect(res.body.data).toMatchObject({ name: 'Turbine A1', status: 'operational' });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
  });

  it('rejects duplicate serial number with 409', async () => {
    const payload = sampleEquipment();
    await request(app).post('/api/equipment').send(payload).expect(201);

    const res = await request(app).post('/api/equipment').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('silently strips unknown/server-controlled fields on create', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .send({ ...sampleEquipment(), id: 'hacked-id', isAdmin: true });

    expect(res.status).toBe(201);
    expect(res.body.data.id).not.toBe('hacked-id');
    expect(res.body.data.isAdmin).toBeUndefined();
  });

  it('reads, updates and lists equipment with pagination metadata', async () => {
    const created = await request(app).post('/api/equipment').send(sampleEquipment({ name: 'Inverter Z' }));
    const id = created.body.data.id;

    const getRes = await request(app).get(`/api/equipment/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Inverter Z');

    const patchRes = await request(app).patch(`/api/equipment/${id}`).send({ status: 'maintenance' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe('maintenance');
    expect(patchRes.body.data.id).toBe(id);

    const listRes = await request(app).get('/api/equipment?page=1&limit=5');
    expect(listRes.status).toBe(200);
    expect(listRes.body.meta).toEqual(expect.objectContaining({ page: 1, limit: 5 }));
    expect(Array.isArray(listRes.body.data)).toBe(true);
  });

  it('returns 404 for unknown equipment id', async () => {
    const res = await request(app).get('/api/equipment/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('prevents deleting equipment with open requests (409) and allows it otherwise', async () => {
    const eq = await request(app).post('/api/equipment').send(sampleEquipment());
    const eqId = eq.body.data.id;

    await request(app)
      .post('/api/requests')
      .send({ equipmentId: eqId, title: 'Inspect blades', priority: 'medium' })
      .expect(201);

    const blocked = await request(app).delete(`/api/equipment/${eqId}`);
    expect(blocked.status).toBe(409);

    const eq2 = await request(app).post('/api/equipment').send(sampleEquipment());
    const deleted = await request(app).delete(`/api/equipment/${eq2.body.data.id}`);
    expect(deleted.status).toBe(204);
  });
});
