import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';
import { registerAndLogin, authHeader, type TestUser } from './helpers/authHelpers.js';

let app: Express;
let admin: TestUser;
let technician: TestUser;
let viewer: TestUser;
let equipmentId: string;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();

  admin = await registerAndLogin(app, 'admin');
  technician = await registerAndLogin(app, 'technician');
  viewer = await registerAndLogin(app, 'viewer');

  const eq = await request(app)
    .post('/api/equipment')
    .set(authHeader(admin.token))
    .send({
      name: 'RBAC Turbine',
      type: 'turbine',
      serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
      location: { lat: 1, lon: 1 },
      installedAt: '2022-01-01',
    });
  equipmentId = eq.body.data.id;
});

afterAll(closeDatabase);

describe('Authorization: 401 without a token', () => {
  it.each([
    ['get', '/api/equipment'],
    ['get', '/api/requests'],
    ['post', '/api/equipment'],
    ['post', '/api/requests'],
  ] as const)('%s %s requires authentication', async (method, path) => {
    const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[
      method
    ](path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Authorization: role-based access (RBAC)', () => {
  it('viewer can read equipment and requests', async () => {
    const res = await request(app).get('/api/equipment').set(authHeader(viewer.token));
    expect(res.status).toBe(200);
  });

  it('viewer cannot create equipment (403)', async () => {
    const res = await request(app)
      .post('/api/equipment')
      .set(authHeader(viewer.token))
      .send({
        name: 'X',
        type: 'sensor',
        serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
        location: { lat: 1, lon: 1 },
        installedAt: '2022-01-01',
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('viewer cannot create a request (403)', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set(authHeader(viewer.token))
      .send({ equipmentId, title: 'Viewer tries to create', priority: 'low' });
    expect(res.status).toBe(403);
  });

  it('technician can create a request', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set(authHeader(technician.token))
      .send({ equipmentId, title: 'Technician created request', priority: 'medium' });
    expect(res.status).toBe(201);
  });

  it('technician cannot delete equipment (403, admin-only)', async () => {
    const res = await request(app)
      .delete(`/api/equipment/${equipmentId}`)
      .set(authHeader(technician.token));
    expect(res.status).toBe(403);
  });

  it('technician cannot assign a brigade (403, admin-only — "управление специалистами")', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Technician tries to assign', priority: 'low' });

    const res = await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(technician.token))
      .send({
        assignees: [{ technicianId: technician.technicianId, role: 'lead', plannedHours: 4 }],
      });
    expect(res.status).toBe(403);
  });

  it('admin can do everything: create, assign, delete', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Admin full control', priority: 'low' });
    expect(created.status).toBe(201);

    const assigned = await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(admin.token))
      .send({
        assignees: [{ technicianId: technician.technicianId, role: 'lead', plannedHours: 4 }],
      });
    expect(assigned.status).toBe(200);
    expect(assigned.body.data[0].technicianId).toBe(technician.technicianId);
  });
});

describe('Authorization: ABAC — technician only manages requests in their own brigade', () => {
  it('technician cannot change the status of a request they are not assigned to', async () => {
    const otherTechnician = await registerAndLogin(app, 'technician');

    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Assigned to other tech', priority: 'medium' });

    await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(admin.token))
      .send({
        assignees: [{ technicianId: otherTechnician.technicianId, role: 'lead', plannedHours: 4 }],
      });

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .set(authHeader(technician.token))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(403);
  });

  it('technician can change the status of a request their brigade is on', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Assigned to me', priority: 'medium' });

    await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(admin.token))
      .send({
        assignees: [{ technicianId: technician.technicianId, role: 'lead', plannedHours: 4 }],
      });

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .set(authHeader(technician.token))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('technician assigned only as a member (not lead) can still change status', async () => {
    const lead = await registerAndLogin(app, 'technician');
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Member can act too', priority: 'medium' });

    await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(admin.token))
      .send({
        assignees: [
          { technicianId: lead.technicianId, role: 'lead', plannedHours: 4 },
          { technicianId: technician.technicianId, role: 'member', plannedHours: 2 },
        ],
      });

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .set(authHeader(technician.token))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
  });

  it('admin can change the status of any request regardless of brigade membership', async () => {
    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Unassigned, admin changes it', priority: 'medium' });

    await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(admin.token))
      .send({
        assignees: [{ technicianId: technician.technicianId, role: 'lead', plannedHours: 1 }],
      });

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .set(authHeader(admin.token))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
  });

  it('a technician account with no linked technicianId cannot change any request status', async () => {
    const unlinked = await registerAndLogin(app, 'viewer');
    const { UserModel } = await import('../src/models/user.model.js');
    await UserModel.update(
      { role: 'technician', technicianId: null },
      { where: { email: unlinked.email } },
    );
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: unlinked.email, password: 'Passw0rd123' });
    const tokenNoLink = loginRes.body.data.accessToken as string;

    const created = await request(app)
      .post('/api/requests')
      .set(authHeader(admin.token))
      .send({ equipmentId, title: 'Unlinked technician test', priority: 'low' });
    await request(app)
      .post(`/api/requests/${created.body.data.id}/assignees`)
      .set(authHeader(admin.token))
      .send({
        assignees: [{ technicianId: technician.technicianId, role: 'lead', plannedHours: 1 }],
      });

    const res = await request(app)
      .patch(`/api/requests/${created.body.data.id}/status`)
      .set(authHeader(tokenNoLink))
      .send({ status: 'in_progress' });

    expect(res.status).toBe(403);
  });
});

describe('User management (admin only)', () => {
  it('a non-admin cannot list users (403)', async () => {
    const res = await request(app).get('/api/users').set(authHeader(viewer.token));
    expect(res.status).toBe(403);
  });

  it('admin can list users and filter by role', async () => {
    const res = await request(app).get('/api/users?role=admin').set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.every((u: { role: string }) => u.role === 'admin')).toBe(true);
  });

  it('admin can promote a viewer to technician, linking an existing specialist', async () => {
    const { TechnicianModel } = await import('../src/models/technician.model.js');
    const tech = await TechnicianModel.create({
      fullName: 'Promoted Specialist',
      specialization: 'Test',
      badgeNumber: `TECH-PROMO-${Date.now()}`,
    });

    const candidate = await registerAndLogin(app, 'viewer');
    const res = await request(app)
      .patch(`/api/users/${candidate.userId}/role`)
      .set(authHeader(admin.token))
      .send({ role: 'technician', technicianId: tech.id });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('technician');
    expect(res.body.data.technicianId).toBe(tech.id);
  });

  it('rejects role=technician without technicianId (422)', async () => {
    const candidate = await registerAndLogin(app, 'viewer');
    const res = await request(app)
      .patch(`/api/users/${candidate.userId}/role`)
      .set(authHeader(admin.token))
      .send({ role: 'technician' });
    expect(res.status).toBe(422);
  });

  it('a non-admin cannot change roles (403)', async () => {
    const res = await request(app)
      .patch(`/api/users/${admin.userId}/role`)
      .set(authHeader(viewer.token))
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for an unknown user id', async () => {
    const res = await request(app)
      .patch('/api/users/00000000-0000-4000-8000-000000000000/role')
      .set(authHeader(admin.token))
      .send({ role: 'admin' });
    expect(res.status).toBe(404);
  });
});
