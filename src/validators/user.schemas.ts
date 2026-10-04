import { z } from 'zod';
import { idParamSchema, paginationSchema } from './common.schemas.js';
import { ROLES } from '../models/user.model.js';

export const listUsersQuerySchema = paginationSchema.extend({
  role: z.enum(ROLES).optional(),
});

export const userIdParamSchema = idParamSchema;

export const updateRoleSchema = z
  .object({
    role: z.enum(ROLES, { message: `role должен быть одним из: ${ROLES.join(', ')}` }),
    technicianId: z.uuid('technicianId должен быть корректным UUID').optional(),
  })
  .refine((data) => data.role !== 'technician' || data.technicianId !== undefined, {
    message: 'Для роли technician обязателен technicianId (ссылка на специалиста)',
    path: ['technicianId'],
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

export const listUsersSchemas = { query: listUsersQuerySchema };
export const updateRoleSchemas = { params: userIdParamSchema, body: updateRoleSchema };
