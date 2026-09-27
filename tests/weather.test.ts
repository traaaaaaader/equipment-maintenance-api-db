import type { Express } from 'express';
import { jest } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;
let equipmentId: string;
let originalFetch: typeof fetch;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();
  originalFetch = global.fetch;

  const eq = await request(app).post('/api/equipment').send({
    name: 'Turbine Weather',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 55, lon: 37 },
    installedAt: '2022-01-01',
  });
  equipmentId = eq.body.data.id;
});

afterAll(closeDatabase);

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchOk(current: Record<string, unknown>) {
  global.fetch = jest
    .fn<() => Promise<{ ok: boolean; json: () => Promise<{ current: Record<string, unknown> }> }>>()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ current }),
    }) as unknown as typeof fetch;
}

describe('Equipment weather endpoint', () => {
  it('reports the location suitable when there is no rain and low wind', async () => {
    mockFetchOk({ precipitation: 0, wind_speed_10m: 5 });

    const res = await request(app).get(`/api/equipment/${equipmentId}/weather`);

    expect(res.status).toBe(200);
    expect(res.body.data.outdoorWorkWindow.suitable).toBe(true);
    expect(res.body.data.outdoorWorkWindow.reasons).toHaveLength(0);
  });

  it('reports the location unsuitable when wind exceeds the threshold', async () => {
    mockFetchOk({ precipitation: 0, wind_speed_10m: 999 });

    const res = await request(app).get(`/api/equipment/${equipmentId}/weather`);

    expect(res.status).toBe(200);
    expect(res.body.data.outdoorWorkWindow.suitable).toBe(false);
    expect(res.body.data.outdoorWorkWindow.reasons.length).toBeGreaterThan(0);
  });

  it('does not crash the service when the external API is unreachable, returns 503', async () => {
    global.fetch = jest
      .fn<() => Promise<never>>()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    const res = await request(app).get(`/api/equipment/${equipmentId}/weather`);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('returns 404 when the equipment does not exist', async () => {
    const res = await request(app).get('/api/equipment/00000000-0000-0000-0000-000000000000/weather');
    expect(res.status).toBe(404);
  });
});
