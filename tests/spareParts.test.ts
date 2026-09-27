import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;
let equipmentId: string;
let sparePartId: string;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();

  const eq = await request(app).post('/api/equipment').send({
    name: 'Spare Part Test Equipment',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 1, lon: 1 },
    installedAt: '2020-01-01',
  });
  equipmentId = eq.body.data.id;

  const { SparePartModel } = await import('../src/models/sparePart.model.js');
  const part = await SparePartModel.create({
    name: 'Test Bearing',
    sku: `SKU-${Math.random().toString(36).slice(2, 8)}`,
    quantity: 10,
  });
  sparePartId = part.id;
});

afterAll(closeDatabase);

async function createRequest() {
  const res = await request(app)
    .post('/api/requests')
    .send({ equipmentId, title: 'Spare part usage', priority: 'low' });
  return res.body.data.id as string;
}

describe('Spare part consumption', () => {
  it('decrements stock atomically and records usage on the request', async () => {
    const id = await createRequest();

    const res = await request(app)
      .post(`/api/requests/${id}/spare-parts`)
      .send({ sparePartId, quantityUsed: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.spareParts).toEqual([
      { sparePartId, name: 'Test Bearing', sku: expect.any(String), quantityUsed: 3 },
    ]);

    const { SparePartModel } = await import('../src/models/sparePart.model.js');
    const part = await SparePartModel.findByPk(sparePartId);
    expect(part?.quantity).toBe(7);
  });

  it('accumulates quantityUsed across repeated consumption of the same part', async () => {
    const id = await createRequest();

    await request(app).post(`/api/requests/${id}/spare-parts`).send({ sparePartId, quantityUsed: 1 }).expect(200);
    const second = await request(app)
      .post(`/api/requests/${id}/spare-parts`)
      .send({ sparePartId, quantityUsed: 2 });

    expect(second.body.data.spareParts).toEqual([
      { sparePartId, name: 'Test Bearing', sku: expect.any(String), quantityUsed: 3 },
    ]);
  });

  it('rejects consumption exceeding remaining stock (409) without changing the stock', async () => {
    const id = await createRequest();
    const { SparePartModel } = await import('../src/models/sparePart.model.js');
    const before = (await SparePartModel.findByPk(sparePartId))!.quantity;

    const res = await request(app)
      .post(`/api/requests/${id}/spare-parts`)
      .send({ sparePartId, quantityUsed: before + 1 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');

    const after = (await SparePartModel.findByPk(sparePartId))!.quantity;
    expect(after).toBe(before);
  });

  it('returns 404 for an unknown spare part', async () => {
    const id = await createRequest();

    const res = await request(app)
      .post(`/api/requests/${id}/spare-parts`)
      .send({ sparePartId: '00000000-0000-0000-0000-000000000000', quantityUsed: 1 });

    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown request', async () => {
    const res = await request(app)
      .post('/api/requests/00000000-0000-0000-0000-000000000000/spare-parts')
      .send({ sparePartId, quantityUsed: 1 });

    expect(res.status).toBe(404);
  });
});
