import { z } from 'zod';
import {
  idParamSchema,
  isoDateTimeString,
  paginationSchema,
  sortSchema,
} from './common.schemas.js';
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '../models/request.model.js';

export const REQUEST_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'plannedAt',
  'priority',
  'status',
] as const;
export type RequestSortField = (typeof REQUEST_SORT_FIELDS)[number];

export const createRequestSchema = z.object({
  equipmentId: z.uuid('equipmentId должен быть корректным UUID'),
  title: z
    .string()
    .trim()
    .min(5, 'title: минимум 5 символов')
    .max(120, 'title: максимум 120 символов'),
  description: z.string().max(2000, 'description: максимум 2000 символов').optional(),
  priority: z.enum(REQUEST_PRIORITIES, {
    message: `priority должен быть одним из: ${REQUEST_PRIORITIES.join(', ')}`,
  }),
  plannedAt: isoDateTimeString.optional(),
});

export const updateRequestSchema = z
  .object({
    title: z.string().trim().min(5).max(120).optional(),
    description: z.string().max(2000).optional(),
    priority: z.enum(REQUEST_PRIORITIES).optional(),
    plannedAt: isoDateTimeString.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Тело запроса не может быть пустым');

export const changeStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES, {
    message: `status должен быть одним из: ${REQUEST_STATUSES.join(', ')}`,
  }),
});

export const requestIdParamSchema = idParamSchema;

export const listRequestsQuerySchema = paginationSchema.extend({
  status: z.enum(REQUEST_STATUSES).optional(),
  priority: z.enum(REQUEST_PRIORITIES).optional(),
  equipmentId: z.uuid().optional(),
  createdFrom: isoDateTimeString.optional(),
  createdTo: isoDateTimeString.optional(),
  plannedFrom: isoDateTimeString.optional(),
  plannedTo: isoDateTimeString.optional(),
  sort: sortSchema(REQUEST_SORT_FIELDS),
});

export type CreateRequestDto = z.infer<typeof createRequestSchema>;
export type UpdateRequestDto = z.infer<typeof updateRequestSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
export type RequestIdParam = z.infer<typeof requestIdParamSchema>;
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;

export const listRequestSchemas = { query: listRequestsQuerySchema };
export const getRequestSchemas = { params: requestIdParamSchema };
export const createRequestSchemas = { body: createRequestSchema };
export const updateRequestSchemas = {
  params: requestIdParamSchema,
  body: updateRequestSchema,
};
export const statusRequestSchemas = {
  params: requestIdParamSchema,
  body: changeStatusSchema,
};
export const removeRequestSchemas = { params: requestIdParamSchema };
