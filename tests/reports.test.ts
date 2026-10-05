import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';
import { registerAndLogin, authHeader, type TestUser } from './helpers/authHelpers.js';

let app: Express;
let admin: TestUser;
let equipmentAId: string;
let equipmentBId: string;

async function createEquipment(name: string) {
  const res = await request(app)
    .post('/api/equipment')
    .set(authHeader(admin.token))
    .send({
      name,
      type: 'turbine',
      serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
      location: { lat: 1, lon: 1 },
      installedAt: '2020-01-01',
    });
  return res.body.data.id as string;
}

beforeAll(async () => {
  ({ app } = await createTestApp());
});

beforeEach(async () => {
  await resetDatabase();
  admin = await registerAndLogin(app, 'admin');

  equipmentAId = await createEquipment('Load Report A');
  equipmentBId = await createEquipment('Load Report B');

  for (let i = 0; i < 3; i++) {
    await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId: equipmentAId, title: `A request ${i}`, priority: 'low' });
  }
  await request(app)
    .post('/api/requests')
    .set(authHeader(admin.token))
    .send({ equipmentId: equipmentBId, title: 'B request', priority: 'low' });
});

afterAll(closeDatabase);

describe('Equipment load report', () => {
  it('returns per-equipment totals with a JOIN/GROUP BY aggregate', async () => {
    const res = await request(app).get('/api/reports/equipment-load').set(authHeader(admin.token));
    expect(res.status).toBe(200);

    const rowA = res.body.data.find((r: { equipmentId: string }) => r.equipmentId === equipmentAId);
    const rowB = res.body.data.find((r: { equipmentId: string }) => r.equipmentId === equipmentBId);

    expect(rowA.totalRequests).toBe(3);
    expect(rowA.closedRequests).toBe(0);
    expect(rowB.totalRequests).toBe(1);
  });

  it('filters out groups below minRequests (HAVING)', async () => {
    const res = await request(app)
      .get('/api/reports/equipment-load?minRequests=2')
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);

    const ids = res.body.data.map((r: { equipmentId: string }) => r.equipmentId);
    expect(ids).toContain(equipmentAId);
    expect(ids).not.toContain(equipmentBId);
  });

  it('excludes everything when the date range matches nothing', async () => {
    const res = await request(app)
      .get('/api/reports/equipment-load?dateFrom=2000-01-01T00:00:00Z&dateTo=2000-01-02T00:00:00Z')
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(
      res.body.data.find((r: { equipmentId: string }) => r.equipmentId === equipmentAId)
        .totalRequests,
    ).toBe(0);
  });

  it('rejects a negative minRequests', async () => {
    const res = await request(app)
      .get('/api/reports/equipment-load?minRequests=-1')
      .set(authHeader(admin.token));
    expect(res.status).toBe(422);
  });

  it('rejects a malformed date', async () => {
    const res = await request(app)
      .get('/api/reports/equipment-load?dateFrom=not-a-date')
      .set(authHeader(admin.token));
    expect(res.status).toBe(422);
  });
});
