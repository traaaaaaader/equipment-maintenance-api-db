import type { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository.js';
import { NotFoundError } from '../errors/index.js';
import type { ListUsersQuery, UpdateRoleDto, UserIdParam } from '../validators/user.schemas.js';

export async function list(req: Request, res: Response) {
  const query = req.valid.query as ListUsersQuery;
  const result = await userRepository.findAll({
    filters: { role: query.role },
    page: query.page,
    limit: query.limit,
  });
  res.json({
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
}

export async function updateRole(req: Request, res: Response) {
  const { id } = req.valid.params as UserIdParam;
  const { role, technicianId } = req.valid.body as UpdateRoleDto;

  const updated = await userRepository.updateRole(id, role, technicianId ?? null);
  if (!updated) throw new NotFoundError(`Пользователь ${id} не найден`);

  res.json({ data: updated });
}
