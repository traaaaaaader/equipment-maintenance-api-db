import type { Request, Response } from 'express';
import { requestService } from '../services/requestService.js';
import type {
  CreateRequestDto,
  ListRequestsQuery,
  RequestIdParam,
  UpdateRequestDto,
  ChangeStatusDto,
} from '../validators/request.schemas.js';

export async function list(req: Request, res: Response) {
  const query = req.valid.query as ListRequestsQuery;
  const result = await requestService.list({
    filters: {
      status: query.status,
      priority: query.priority,
      equipmentId: query.equipmentId,
      createdFrom: query.createdFrom,
      plannedFrom: query.plannedFrom,
      plannedTo: query.plannedTo,
    },
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
  const { id } = req.valid.params as RequestIdParam;
  const request = await requestService.getById(id);
  res.json({ data: request });
}

export async function create(req: Request, res: Response) {
  const body = req.valid.body as CreateRequestDto;
  const created = await requestService.create(body);
  res.status(201).location(`/api/requests/${created.id}`).json({ data: created });
}

export async function update(req: Request, res: Response) {
  const { id } = req.valid.params as RequestIdParam;
  const body = req.valid.body as UpdateRequestDto;
  const updated = await requestService.update(id, body);
  res.json({ data: updated });
}

export async function changeStatus(req: Request, res: Response) {
  const { id } = req.valid.params as RequestIdParam;
  const { status } = req.valid.body as ChangeStatusDto;
  const updated = await requestService.changeStatus(id, status);
  res.json({ data: updated });
}

export async function remove(req: Request, res: Response) {
  const { id } = req.valid.params as RequestIdParam;
  await requestService.remove(id);
  res.status(204).send();
}
