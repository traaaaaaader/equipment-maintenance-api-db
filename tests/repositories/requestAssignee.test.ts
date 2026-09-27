import type { RequestAssigneeRepository } from '../../src/repositories/requestAssigneeRepository.js';
import type { RequestAssigneeService } from '../../src/services/requestAssigneeService.js';
import type { EquipmentModel as EquipmentModelType } from '../../src/models/equipment.model.js';
import type { MaintenanceRequestModel as MaintenanceRequestModelType } from '../../src/models/request.model.js';
import type { TechnicianModel as TechnicianModelType } from '../../src/models/technician.model.js';
import type { Sequelize } from 'sequelize';
import { closeDatabase, resetDatabase } from '../helpers/resetDb.js';

process.env.NODE_ENV = 'test';

let requestAssigneeRepository: RequestAssigneeRepository;
let requestAssigneeService: RequestAssigneeService;
let EquipmentModel: typeof EquipmentModelType;
let MaintenanceRequestModel: typeof MaintenanceRequestModelType;
let TechnicianModel: typeof TechnicianModelType;
let sequelize: Sequelize;

beforeAll(async () => {
  ({ requestAssigneeRepository } =
    await import('../../src/repositories/requestAssigneeRepository.js'));
  ({ requestAssigneeService } = await import('../../src/services/requestAssigneeService.js'));
  ({ EquipmentModel } = await import('../../src/models/equipment.model.js'));
  ({ MaintenanceRequestModel } = await import('../../src/models/request.model.js'));
  ({ TechnicianModel } = await import('../../src/models/technician.model.js'));
  ({ sequelize } = await import('../../src/db/sequelize.js'));
  await resetDatabase();
});

afterAll(closeDatabase);

async function makeRequest(): Promise<string> {
  const equipment = await EquipmentModel.create({
    name: 'RA Test Equipment',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    locationLat: 1,
    locationLon: 1,
    status: 'operational',
    installedAt: '2020-01-01',
    siteId: null,
  });
  const req = await MaintenanceRequestModel.create({
    equipmentId: equipment.id,
    title: 'RA test request',
    description: null,
    priority: 'low',
    plannedAt: null,
    author: null,
  });
  return req.id;
}

async function makeTechnician(name: string): Promise<string> {
  const tech = await TechnicianModel.create({
    fullName: name,
    specialization: 'Электрик',
    badgeNumber: `TECH-${Math.random().toString(36).slice(2, 8)}`,
  });
  return tech.id;
}

describe('RequestAssigneeRepository (direct, bypassing the service)', () => {
  it('createMany + findByRequestId returns technician names via include', async () => {
    const requestId = await makeRequest();
    const techId = await makeTechnician('Repo Test Tech');

    await sequelize.transaction((t) =>
      requestAssigneeRepository.createMany(
        requestId,
        [{ technicianId: techId, role: 'lead', plannedHours: 5 }],
        t,
      ),
    );

    const list = await requestAssigneeRepository.findByRequestId(requestId);
    expect(list).toEqual([
      { technicianId: techId, fullName: 'Repo Test Tech', role: 'lead', plannedHours: 5 },
    ]);
  });

  it('deleteForRequest removes all rows for that request', async () => {
    const requestId = await makeRequest();
    const techId = await makeTechnician('To Delete');

    await sequelize.transaction((t) =>
      requestAssigneeRepository.createMany(
        requestId,
        [{ technicianId: techId, role: 'lead', plannedHours: 2 }],
        t,
      ),
    );
    await sequelize.transaction((t) => requestAssigneeRepository.deleteForRequest(requestId, t));

    expect(await requestAssigneeRepository.findByRequestId(requestId)).toHaveLength(0);
  });

  it('countByRequestId reflects the current assignee count', async () => {
    const requestId = await makeRequest();
    expect(await requestAssigneeRepository.countByRequestId(requestId)).toBe(0);

    const techId = await makeTechnician('Counted');
    await sequelize.transaction((t) =>
      requestAssigneeRepository.createMany(
        requestId,
        [{ technicianId: techId, role: 'lead', plannedHours: 1 }],
        t,
      ),
    );

    expect(await requestAssigneeRepository.countByRequestId(requestId)).toBe(1);
  });
});

describe('RequestAssigneeService — transactions and rollback', () => {
  it('rolls back the delete when a technician does not exist: old brigade stays intact', async () => {
    const requestId = await makeRequest();
    const leadId = await makeTechnician('Rollback Lead');
    const memberId = await makeTechnician('Rollback Member');

    await requestAssigneeService.assign(requestId, [
      { technicianId: leadId, role: 'lead', plannedHours: 5 },
      { technicianId: memberId, role: 'member', plannedHours: 3 },
    ]);

    await expect(
      requestAssigneeService.assign(requestId, [
        { technicianId: leadId, role: 'lead', plannedHours: 5 },
        { technicianId: '00000000-0000-4000-8000-000000000000', role: 'member', plannedHours: 1 },
      ]),
    ).rejects.toThrow();

    const survivors = await requestAssigneeRepository.findByRequestId(requestId);
    expect(survivors.map((s) => s.technicianId).sort()).toEqual([leadId, memberId].sort());
  });

  it('rejects a duplicate technician in the payload before touching the database', async () => {
    const requestId = await makeRequest();
    const techId = await makeTechnician('Dup Check');

    await expect(
      requestAssigneeService.assign(requestId, [
        { technicianId: techId, role: 'lead', plannedHours: 5 },
        { technicianId: techId, role: 'member', plannedHours: 2 },
      ]),
    ).rejects.toThrow();

    expect(await requestAssigneeRepository.countByRequestId(requestId)).toBe(0);
  });

  it('rejects a brigade without exactly one lead', async () => {
    const requestId = await makeRequest();
    const techId = await makeTechnician('No Lead');

    await expect(
      requestAssigneeService.assign(requestId, [
        { technicianId: techId, role: 'member', plannedHours: 5 },
      ]),
    ).rejects.toThrow();
  });

  it('remove() 404s when the technician is not assigned', async () => {
    const requestId = await makeRequest();
    const techId = await makeTechnician('Never Assigned');

    await expect(requestAssigneeService.remove(requestId, techId)).rejects.toThrow();
  });
});
