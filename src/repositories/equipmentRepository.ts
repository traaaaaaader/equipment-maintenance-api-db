import { randomUUID } from 'node:crypto';
import type { Equipment, EquipmentFilters } from '../models/equipment.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { CreateEquipmentDto, UpdateEquipmentDto } from '../validators/equipment.schemas.js';

function applyFilters(items: Equipment[], filters: EquipmentFilters): Equipment[] {
  let result = items;

  if (filters.type) {
    result = result.filter((item) => item.type === filters.type);
  }
  if (filters.status) {
    result = result.filter((item) => item.status === filters.status);
  }
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.serialNumber.toLowerCase().includes(needle),
    );
  }

  return result;
}

function applySort(items: Equipment[], sort?: string): Equipment[] {
  if (!sort) return items;
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '') as keyof Equipment;

  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    return av > bv ? direction : -direction;
  });
}

export class EquipmentRepository {
  _items = new Map<string, Equipment>();

  async findAll({
    filters = {},
    sort,
    page = 1,
    limit = 20,
  }: ListParams<EquipmentFilters> = {}): Promise<ListResult<Equipment>> {
    const all = Array.from(this._items.values());
    const filtered = applySort(applyFilters(all, filters), sort);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { items, total, page, limit };
  }

  async findById(id: string): Promise<Equipment | null> {
    return this._items.get(id) ?? null;
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment | null> {
    for (const item of this._items.values()) {
      if (item.serialNumber === serialNumber) return item;
    }
    return null;
  }

  async create(data: CreateEquipmentDto): Promise<Equipment> {
    const now = new Date().toISOString();
    const entity: Equipment = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this._items.set(entity.id, entity);
    return entity;
  }

  async update(id: string, patch: UpdateEquipmentDto): Promise<Equipment | null> {
    const existing = this._items.get(id);
    if (!existing) return null;

    const updated: Equipment = {
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

export const equipmentRepository = new EquipmentRepository();
