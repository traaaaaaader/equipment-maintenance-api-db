import { randomUUID } from 'node:crypto';
import {
  OPEN_STATUSES,
  type MaintenanceRequest,
  type RequestFilters,
  type RequestStatus,
} from '../models/request.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { CreateRequestDto, UpdateRequestDto } from '../validators/request.schemas.js';

type RequestPatch = UpdateRequestDto & { status?: RequestStatus };

function applyFilters(items: MaintenanceRequest[], filters: RequestFilters): MaintenanceRequest[] {
  let result = items;

  if (filters.status) {
    result = result.filter((item) => item.status === filters.status);
  }
  if (filters.priority) {
    result = result.filter((item) => item.priority === filters.priority);
  }
  if (filters.equipmentId) {
    result = result.filter((item) => item.equipmentId === filters.equipmentId);
  }
  if (filters.createdFrom) {
    const from = filters.createdFrom;
    result = result.filter((item) => item.createdAt >= from);
  }
  if (filters.createdTo) {
    const to = filters.createdTo;
    result = result.filter((item) => item.createdAt <= to);
  }
  if (filters.plannedFrom) {
    const from = filters.plannedFrom;
    result = result.filter((item) => item.plannedAt !== undefined && item.plannedAt >= from);
  }
  if (filters.plannedTo) {
    const to = filters.plannedTo;
    result = result.filter((item) => item.plannedAt !== undefined && item.plannedAt <= to);
  }

  return result;
}

function applySort(items: MaintenanceRequest[], sort?: string): MaintenanceRequest[] {
  if (!sort) return items;
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '') as keyof MaintenanceRequest;

  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined) return direction;
    if (bv === undefined) return -direction;
    return av > bv ? direction : -direction;
  });
}

export class RequestRepository {
  _items = new Map<string, MaintenanceRequest>();

  async findAll({
    filters = {},
    sort,
    page = 1,
    limit = 20,
  }: ListParams<RequestFilters> = {}): Promise<ListResult<MaintenanceRequest>> {
    const all = Array.from(this._items.values());
    const filtered = applySort(applyFilters(all, filters), sort);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total, page, limit };
  }

  async findById(id: string): Promise<MaintenanceRequest | null> {
    return this._items.get(id) ?? null;
  }

  async findByEquipmentId(equipmentId: string): Promise<MaintenanceRequest[]> {
    return Array.from(this._items.values()).filter((item) => item.equipmentId === equipmentId);
  }

  async countOpenByEquipmentId(equipmentId: string): Promise<number> {
    return Array.from(this._items.values()).filter(
      (item) => item.equipmentId === equipmentId && OPEN_STATUSES.includes(item.status),
    ).length;
  }

  async create(data: CreateRequestDto): Promise<MaintenanceRequest> {
    const now = new Date().toISOString();
    const entity: MaintenanceRequest = {
      id: randomUUID(),
      status: 'new',
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this._items.set(entity.id, entity);
    return entity;
  }

  async update(id: string, patch: RequestPatch): Promise<MaintenanceRequest | null> {
    const existing = this._items.get(id);
    if (!existing) return null;

    const updated: MaintenanceRequest = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this._items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this._items.delete(id);
  }
}

export const requestRepository = new RequestRepository();
