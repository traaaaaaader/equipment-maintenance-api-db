import type { Request, Response } from 'express';
import { equipmentService } from '../services/equipmentService.js';
import type {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  EquipmentIdParam,
  ListEquipmentQuery,
  EquipmentRequestsQuery,
} from '../validators/equipment.schemas.js';

export async function list(req: Request, res: Response) {
  const query = req.valid.query as ListEquipmentQuery;
  const result = await equipmentService.list({
    filters: { type: query.type, status: query.status, search: query.search },
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  });
  res.json({
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.valid.params as EquipmentIdParam;
  const equipment = await equipmentService.getById(id);
  res.json({ data: equipment });
}

export async function create(req: Request, res: Response) {
  const body = req.valid.body as CreateEquipmentDto;
  const created = await equipmentService.create(body);
  res.status(201).location(`/api/equipment/${created.id}`).json({ data: created });
}

export async function update(req: Request, res: Response) {
  const { id } = req.valid.params as EquipmentIdParam;
  const body = req.valid.body as UpdateEquipmentDto;
  const updated = await equipmentService.update(id, body);
  res.json({ data: updated });
}

export async function remove(req: Request, res: Response) {
  const { id } = req.valid.params as EquipmentIdParam;
  await equipmentService.remove(id);
  res.status(204).send();
}

export async function listRequestsForEquipment(req: Request, res: Response) {
  const { id } = req.valid.params as EquipmentIdParam;
  const query = req.valid.query as EquipmentRequestsQuery;
  const result = await equipmentService.listRequestsFor(id, {
    filters: { status: query.status, priority: query.priority },
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  });
  res.json({
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
}

export async function getWeather(req: Request, res: Response) {
  const { id } = req.valid.params as EquipmentIdParam;
  const forecast = await equipmentService.getWeather(id);
  res.json({ data: forecast });
}
