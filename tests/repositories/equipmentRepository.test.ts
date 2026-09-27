import type { EquipmentRepository } from '../../src/repositories/equipmentRepository.js';
import type { CreateEquipmentDto } from '../../src/validators/equipment.schemas.js';
import { closeDatabase, resetDatabase } from '../helpers/resetDb.js';

process.env.NODE_ENV = 'test';

let equipmentRepository: EquipmentRepository;

beforeAll(async () => {
  ({ equipmentRepository } = await import('../../src/repositories/equipmentRepository.js'));
  await resetDatabase();
});

afterAll(closeDatabase);

function sample(overrides: Partial<CreateEquipmentDto> = {}): CreateEquipmentDto {
  return {
    name: 'Repo Test Turbine',
    type: 'turbine',
    serialNumber: `SN-${Math.random().toString(36).slice(2, 10)}`,
    location: { lat: 1, lon: 1 },
    status: 'operational',
    installedAt: '2020-01-01',
    ...overrides,
  };
}

describe('EquipmentRepository', () => {
  it('creates with siteId null by default (no API contract for assigning a site)', async () => {
    const created = await equipmentRepository.create(sample());
    expect(created.siteId).toBeNull();
  });

  it('finds by id and by serial number', async () => {
    const serialNumber = `SN-${Math.random().toString(36).slice(2, 10)}`;
    const created = await equipmentRepository.create(sample({ serialNumber, name: 'Findable' }));

    expect((await equipmentRepository.findById(created.id))?.name).toBe('Findable');
    expect((await equipmentRepository.findBySerialNumber(serialNumber))?.id).toBe(created.id);
    expect(await equipmentRepository.findBySerialNumber('does-not-exist')).toBeNull();
  });

  it('filters by type at the database level', async () => {
    await equipmentRepository.create(sample({ type: 'sensor' }));
    await equipmentRepository.create(sample({ type: 'turbine' }));

    const { items } = await equipmentRepository.findAll({ filters: { type: 'sensor' } });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.type === 'sensor')).toBe(true);
  });

  it('paginates results', async () => {
    for (let i = 0; i < 5; i++) {
      await equipmentRepository.create(sample({ name: `Page item ${i}` }));
    }

    const page1 = await equipmentRepository.findAll({ page: 1, limit: 2 });
    const page2 = await equipmentRepository.findAll({ page: 2, limit: 2 });

    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    expect(page1.items.map((i) => i.id)).not.toEqual(page2.items.map((i) => i.id));
  });

  it('updates fields including the nested location object', async () => {
    const created = await equipmentRepository.create(sample());
    const updated = await equipmentRepository.update(created.id, { location: { lat: 9, lon: 9 } });

    expect(updated?.location).toEqual({ lat: 9, lon: 9 });
  });

  it('soft-deletes: the row disappears from findById afterwards (paranoid)', async () => {
    const created = await equipmentRepository.create(sample());

    expect(await equipmentRepository.delete(created.id)).toBe(true);
    expect(await equipmentRepository.findById(created.id)).toBeNull();
  });

  it('delete on an unknown id returns false', async () => {
    expect(await equipmentRepository.delete('00000000-0000-4000-8000-000000000000')).toBe(false);
  });

  it('allows reusing a serial number after the previous holder was soft-deleted', async () => {
    const serialNumber = `SN-${Math.random().toString(36).slice(2, 10)}`;
    const original = await equipmentRepository.create(sample({ serialNumber, name: 'Original' }));

    expect(await equipmentRepository.delete(original.id)).toBe(true);

    const replacement = await equipmentRepository.create(sample({ serialNumber, name: 'Replacement' }));
    expect(replacement.id).not.toBe(original.id);
    expect(replacement.serialNumber).toBe(serialNumber);
  });

  it('still rejects a duplicate serial number while the original is active', async () => {
    const serialNumber = `SN-${Math.random().toString(36).slice(2, 10)}`;
    await equipmentRepository.create(sample({ serialNumber }));

    await expect(equipmentRepository.create(sample({ serialNumber }))).rejects.toThrow();
  });
});
