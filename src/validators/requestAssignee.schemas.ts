import { z } from 'zod';
import { idParamSchema } from './common.schemas.js';
import { ASSIGNEE_ROLES } from '../models/requestAssignee.model.js';

const assigneeItemSchema = z.object({
  technicianId: z.uuid('technicianId должен быть корректным UUID'),
  role: z.enum(ASSIGNEE_ROLES, {
    message: `role должен быть одним из: ${ASSIGNEE_ROLES.join(', ')}`,
  }),
  plannedHours: z.number().positive('plannedHours должен быть положительным числом'),
});

export const assignBrigadeSchema = z.object({
  assignees: z.array(assigneeItemSchema).min(1, 'Нужно назначить хотя бы одного специалиста'),
});

export const removeAssigneeParamSchema = idParamSchema.extend({
  userId: z.uuid('userId должен быть корректным UUID'),
});

export type AssignBrigadeDto = z.infer<typeof assignBrigadeSchema>;
export type RemoveAssigneeParam = z.infer<typeof removeAssigneeParamSchema>;

export const assignBrigadeSchemas = { params: idParamSchema, body: assignBrigadeSchema };
export const removeAssigneeSchemas = { params: removeAssigneeParamSchema };
