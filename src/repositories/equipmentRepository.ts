import { Op } from 'sequelize';
import { EquipmentModel, type Equipment, type EquipmentFilters } from '../models/equipment.model.js';
import { EquipmentPassportModel } from '../models/equipmentPassport.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { CreateEquipmentDto, UpdateEquipmentDto } from '../validators/equipment.schemas.js';

const PASSPORT_INCLUDE = [{ model: EquipmentPassportModel, as: 'passport' as const }];

function buildWhere(filters: EquipmentFilters) {
  const where: Record<string, unknown> = {};

  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.search) {
    where[Op.or as unknown as string] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { serialNumber: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  return where;
}

function buildOrder(sort?: string): [string, 'ASC' | 'DESC'][] {
  if (!sort) return [['createdAt', 'DESC']];
  const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
  return [[sort.replace(/^-/, ''), direction]];
}

export class EquipmentRepository {
  async findAll({
    filters = {},
    sort,
    page = 1,
    limit = 20,
  }: ListParams<EquipmentFilters> = {}): Promise<ListResult<Equipment>> {
    const { rows, count } = await EquipmentModel.findAndCountAll({
      where: buildWhere(filters),
      include: PASSPORT_INCLUDE,
      order: buildOrder(sort),
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return { items: rows.map((row) => row.toDto()), total: count, page, limit };
  }

  async findById(id: string): Promise<Equipment | null> {
    const equipment = await EquipmentModel.findByPk(id, { include: PASSPORT_INCLUDE });
    return equipment ? equipment.toDto() : null;
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment | null> {
    const equipment = await EquipmentModel.findOne({ where: { serialNumber } });
    return equipment ? equipment.toDto() : null;
  }

  async create(data: CreateEquipmentDto): Promise<Equipment> {
    const created = await EquipmentModel.create({
      name: data.name,
      type: data.type,
      serialNumber: data.serialNumber,
      locationLat: data.location.lat,
      locationLon: data.location.lon,
      status: data.status,
      installedAt: data.installedAt,
      siteId: null,
    });

    return created.toDto();
  }

  async update(id: string, patch: UpdateEquipmentDto): Promise<Equipment | null> {
    const equipment = await EquipmentModel.findByPk(id);
    if (!equipment) return null;

    const { location, ...rest } = patch;
    await equipment.update({
      ...rest,
      ...(location ? { locationLat: location.lat, locationLon: location.lon } : {}),
    });
    await equipment.reload({ include: PASSPORT_INCLUDE });

    return equipment.toDto();
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await EquipmentModel.destroy({ where: { id } });
    return deleted > 0;
  }
}

export const equipmentRepository = new EquipmentRepository();
