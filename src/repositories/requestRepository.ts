import { Op } from 'sequelize';
import {
  MaintenanceRequestModel,
  OPEN_STATUSES,
  type MaintenanceRequest,
  type RequestFilters,
  type RequestStatus,
} from '../models/request.model.js';
import { RequestAssigneeModel } from '../models/requestAssignee.model.js';
import { TechnicianModel } from '../models/technician.model.js';
import { RequestSparePartModel } from '../models/requestSparePart.model.js';
import { SparePartModel } from '../models/sparePart.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { CreateRequestDto, UpdateRequestDto } from '../validators/request.schemas.js';

type RequestPatch = UpdateRequestDto & { status?: RequestStatus };

const CARD_INCLUDE = [
  {
    model: RequestAssigneeModel,
    as: 'assigneeLinks' as const,
    include: [{ model: TechnicianModel, as: 'technician' as const, attributes: ['id', 'fullName'] }],
  },
  {
    model: RequestSparePartModel,
    as: 'partUsages' as const,
    include: [{ model: SparePartModel, as: 'sparePart' as const, attributes: ['id', 'name', 'sku'] }],
  },
];

function buildWhere(filters: RequestFilters) {
  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.equipmentId) where.equipmentId = filters.equipmentId;
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { [Op.gte]: filters.createdFrom } : {}),
      ...(filters.createdTo ? { [Op.lte]: filters.createdTo } : {}),
    };
  }
  if (filters.plannedFrom || filters.plannedTo) {
    where.plannedAt = {
      ...(filters.plannedFrom ? { [Op.gte]: filters.plannedFrom } : {}),
      ...(filters.plannedTo ? { [Op.lte]: filters.plannedTo } : {}),
    };
  }

  return where;
}

function buildOrder(sort?: string): [string, 'ASC' | 'DESC'][] {
  if (!sort) return [['createdAt', 'DESC']];
  const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
  return [[sort.replace(/^-/, ''), direction]];
}

export class RequestRepository {
  async findAll({
    filters = {},
    sort,
    page = 1,
    limit = 20,
  }: ListParams<RequestFilters> = {}): Promise<ListResult<MaintenanceRequest>> {
    const { rows, count } = await MaintenanceRequestModel.findAndCountAll({
      where: buildWhere(filters),
      include: CARD_INCLUDE,
      order: buildOrder(sort),
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return { items: rows.map((row) => row.toDto()), total: count, page, limit };
  }

  async findById(id: string): Promise<MaintenanceRequest | null> {
    const request = await MaintenanceRequestModel.findByPk(id, { include: CARD_INCLUDE });
    return request ? request.toDto() : null;
  }

  async findByEquipmentId(equipmentId: string): Promise<MaintenanceRequest[]> {
    const rows = await MaintenanceRequestModel.findAll({
      where: { equipmentId },
      include: CARD_INCLUDE,
    });
    return rows.map((row) => row.toDto());
  }

  async countOpenByEquipmentId(equipmentId: string): Promise<number> {
    return MaintenanceRequestModel.count({ where: { equipmentId, status: OPEN_STATUSES } });
  }

  async create(data: CreateRequestDto): Promise<MaintenanceRequest> {
    const created = await MaintenanceRequestModel.create({
      equipmentId: data.equipmentId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
      plannedAt: data.plannedAt ? new Date(data.plannedAt) : null,
      author: null,
    });

    return created.toDto();
  }

  async update(id: string, patch: RequestPatch): Promise<MaintenanceRequest | null> {
    const request = await MaintenanceRequestModel.findByPk(id);
    if (!request) return null;

    const { plannedAt, ...rest } = patch;
    await request.update({
      ...rest,
      ...(plannedAt !== undefined ? { plannedAt: plannedAt ? new Date(plannedAt) : null } : {}),
    });
    await request.reload({ include: CARD_INCLUDE });

    return request.toDto();
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await MaintenanceRequestModel.destroy({ where: { id } });
    return deleted > 0;
  }
}

export const requestRepository = new RequestRepository();
