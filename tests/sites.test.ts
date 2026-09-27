import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;
let siteId: string;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();

  const { SiteModel } = await import('../src/models/site.model.js');
  const { EquipmentModel } = await import('../src/models/equipment.model.js');
  const { MaintenanceRequestModel } = await import('../src/models/request.model.js');

  const site = await SiteModel.create({
    name: 'Summary Test Site',
    code: `SITE-${Math.random().toString(36).slice(2, 8)}`,
    region: 'Test Region',
    locationLat: 1,
    locationLon: 1,
  });
  siteId = site.id;

  const equipment = await EquipmentModel.create({
    siteId,
    name: 'Summary Test Equipment',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    locationLat: 1,
    locationLon: 1,
    status: 'operational',
    installedAt: '2020-01-01',
  });

  await MaintenanceRequestModel.create({
    equipmentId: equipment.id,
    title: 'Open low priority request',
    description: null,
    priority: 'low',
    plannedAt: null,
    author: null,
  });
  await MaintenanceRequestModel.create({
    equipmentId: equipment.id,
    title: 'Closed high priority request',
    description: null,
    priority: 'high',
    status: 'done',
    plannedAt: null,
    author: null,
  });
});

afterAll(closeDatabase);

describe('Site summary', () => {
  it('returns counts by status and priority for its equipment', async () => {
    const res = await request(app).get(`/api/sites/${siteId}/summary`);

    expect(res.status).toBe(200);
    expect(res.body.data.siteId).toBe(siteId);
    expect(res.body.data.totalRequests).toBe(2);
    expect(res.body.data.byStatus).toMatchObject({ new: 1, done: 1, in_progress: 0, rejected: 0 });
    expect(res.body.data.byPriority).toMatchObject({ low: 1, high: 1, medium: 0, critical: 0 });
  });

  it('computes a non-negative average close time when there is a done request', async () => {
    const res = await request(app).get(`/api/sites/${siteId}/summary`);
    expect(typeof res.body.data.averageCloseTimeHours).toBe('number');
    expect(res.body.data.averageCloseTimeHours).toBeGreaterThanOrEqual(0);
  });

  it('returns null average close time for a site with no closed requests', async () => {
    const { SiteModel } = await import('../src/models/site.model.js');
    const emptySite = await SiteModel.create({
      name: 'Empty Site',
      code: `SITE-${Math.random().toString(36).slice(2, 8)}`,
      region: 'Nowhere',
      locationLat: 0,
      locationLon: 0,
    });

    const res = await request(app).get(`/api/sites/${emptySite.id}/summary`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalRequests).toBe(0);
    expect(res.body.data.averageCloseTimeHours).toBeNull();
  });

  it('returns 404 for an unknown site', async () => {
    const res = await request(app).get('/api/sites/00000000-0000-4000-8000-000000000000/summary');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 422 for a malformed id', async () => {
    const res = await request(app).get('/api/sites/not-a-uuid/summary');
    expect(res.status).toBe(422);
  });
});
