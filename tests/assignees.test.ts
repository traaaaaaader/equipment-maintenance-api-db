import type { Express } from 'express';
import request from 'supertest';
import { createTestApp } from './helpers/createTestApp.js';
import { closeDatabase, resetDatabase } from './helpers/resetDb.js';

let app: Express;
let equipmentId: string;
let techLeadId: string;
let techMemberId: string;

beforeAll(async () => {
  ({ app } = await createTestApp());
  await resetDatabase();

  const eq = await request(app).post('/api/equipment').send({
    name: 'Assignee Test Equipment',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 1, lon: 1 },
    installedAt: '2020-01-01',
  });
  equipmentId = eq.body.data.id;

  const { TechnicianModel } = await import('../src/models/technician.model.js');
  const makeTech = (name: string) =>
    TechnicianModel.create({
      fullName: name,
      specialization: 'Электрик',
      badgeNumber: `TECH-${Math.random().toString(36).slice(2, 8)}`,
    });

  techLeadId = (await makeTech('Lead One')).id;
  techMemberId = (await makeTech('Member One')).id;
});

afterAll(closeDatabase);

async function createRequest(title = 'Assignable request') {
  const res = await request(app).post('/api/requests').send({ equipmentId, title, priority: 'medium' });
  return res.body.data.id as string;
}

describe('Request assignees', () => {
  it('assigns a brigade with exactly one lead', async () => {
    const id = await createRequest();

    const res = await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({
        assignees: [
          { technicianId: techLeadId, role: 'lead', plannedHours: 5 },
          { technicianId: techMemberId, role: 'member', plannedHours: 3 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.find((a: { role: string }) => a.role === 'lead').technicianId).toBe(techLeadId);
  });

  it('rejects a brigade without exactly one lead (422)', async () => {
    const id = await createRequest();

    const res = await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({ assignees: [{ technicianId: techMemberId, role: 'member', plannedHours: 3 }] });

    expect(res.status).toBe(422);
  });

  it('rejects two leads in the same payload (422)', async () => {
    const id = await createRequest();

    const res = await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({
        assignees: [
          { technicianId: techLeadId, role: 'lead', plannedHours: 5 },
          { technicianId: techMemberId, role: 'lead', plannedHours: 3 },
        ],
      });

    expect(res.status).toBe(422);
  });

  it('rejects a duplicate technician in the same payload (409)', async () => {
    const id = await createRequest();

    const res = await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({
        assignees: [
          { technicianId: techLeadId, role: 'lead', plannedHours: 5 },
          { technicianId: techLeadId, role: 'member', plannedHours: 3 },
        ],
      });

    expect(res.status).toBe(409);
  });

  it('rejects an unknown technician (404) and rolls back — old brigade stays intact', async () => {
    const id = await createRequest();

    await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({ assignees: [{ technicianId: techLeadId, role: 'lead', plannedHours: 5 }] })
      .expect(200);

    const failed = await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({
        assignees: [
          { technicianId: techLeadId, role: 'lead', plannedHours: 5 },
          { technicianId: '00000000-0000-4000-8000-000000000000', role: 'member', plannedHours: 3 },
        ],
      });
    expect(failed.status).toBe(404);

    const card = await request(app).get(`/api/requests/${id}`);
    expect(card.body.data.assignees).toHaveLength(1);
    expect(card.body.data.assignees[0].technicianId).toBe(techLeadId);
  });

  it('removes an assignee, then 404 on removing the same one again', async () => {
    const id = await createRequest();

    await request(app)
      .post(`/api/requests/${id}/assignees`)
      .send({ assignees: [{ technicianId: techLeadId, role: 'lead', plannedHours: 5 }] })
      .expect(200);

    const del = await request(app).delete(`/api/requests/${id}/assignees/${techLeadId}`);
    expect(del.status).toBe(204);

    const delAgain = await request(app).delete(`/api/requests/${id}/assignees/${techLeadId}`);
    expect(delAgain.status).toBe(404);
  });

  it('404s when assigning to a non-existent request', async () => {
    const res = await request(app)
      .post('/api/requests/00000000-0000-4000-8000-000000000000/assignees')
      .send({ assignees: [{ technicianId: techLeadId, role: 'lead', plannedHours: 5 }] });

    expect(res.status).toBe(404);
  });
});
