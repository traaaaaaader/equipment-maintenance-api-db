import { z } from 'zod';
import { idParamSchema, isoDateString, paginationSchema, sortSchema } from './common.schemas.js';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '../models/equipment.model.js';
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '../models/request.model.js';
import { REQUEST_SORT_FIELDS } from './request.schemas.js';

export const EQUIPMENT_SORT_FIELDS = [
  'name',
  'installedAt',
  'createdAt',
  'status',
  'type',
] as const;
export type EquipmentSortField = (typeof EQUIPMENT_SORT_FIELDS)[number];

const locationSchema = z.object({
  lat: z
    .number()
    .min(-90, 'lat должен быть в диапазоне [-90, 90]')
    .max(90, 'lat должен быть в диапазоне [-90, 90]'),
  lon: z
    .number()
    .min(-180, 'lon должен быть в диапазоне [-180, 180]')
    .max(180, 'lon должен быть в диапазоне [-180, 180]'),
});

const installedAtSchema = isoDateString.refine(
  (value) => new Date(value).getTime() <= Date.now(),
  'installedAt не может быть в будущем',
);

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(3, 'name: минимум 3 символа').max(100, 'name: максимум 100 символов'),
  type: z.enum(EQUIPMENT_TYPES, {
    message: `type должен быть одним из: ${EQUIPMENT_TYPES.join(', ')}`,
  }),
  serialNumber: z.string().trim().min(1, 'serialNumber обязателен'),
  location: locationSchema,
  status: z
    .enum(EQUIPMENT_STATUSES, {
      message: `status должен быть одним из: ${EQUIPMENT_STATUSES.join(', ')}`,
    })
    .default('operational'),
  installedAt: installedAtSchema,
});

export const updateEquipmentSchema = z
  .object({
    name: z.string().trim().min(3).max(100).optional(),
    type: z.enum(EQUIPMENT_TYPES).optional(),
    serialNumber: z.string().trim().min(1).optional(),
    location: locationSchema.optional(),
    status: z.enum(EQUIPMENT_STATUSES).optional(),
    installedAt: installedAtSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Тело запроса не может быть пустым',
  );

export const equipmentIdParamSchema = idParamSchema;

export const listEquipmentQuerySchema = paginationSchema.extend({
  type: z.enum(EQUIPMENT_TYPES).optional(),
  status: z.enum(EQUIPMENT_STATUSES).optional(),
  search: z.string().trim().min(1).optional(),
  sort: sortSchema(EQUIPMENT_SORT_FIELDS),
});

export const equipmentRequestsQuerySchema = paginationSchema.extend({
  status: z.enum(REQUEST_STATUSES).optional(),
  priority: z.enum(REQUEST_PRIORITIES).optional(),
  sort: sortSchema(REQUEST_SORT_FIELDS),
});

export type CreateEquipmentDto = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentDto = z.infer<typeof updateEquipmentSchema>;
export type EquipmentIdParam = z.infer<typeof equipmentIdParamSchema>;
export type ListEquipmentQuery = z.infer<typeof listEquipmentQuerySchema>;
export type EquipmentRequestsQuery = z.infer<typeof equipmentRequestsQuerySchema>;

export const listEquipmentSchemas = { query: listEquipmentQuerySchema };
export const getEquipmentSchemas = { params: equipmentIdParamSchema };
export const createEquipmentSchemas = { body: createEquipmentSchema };
export const updateEquipmentSchemas = {
  params: equipmentIdParamSchema,
  body: updateEquipmentSchema,
};
export const removeEquipmentSchemas = { params: equipmentIdParamSchema };
export const weatherEquipmentSchemas = { params: equipmentIdParamSchema };
export const listRequestsForEquipmentSchemas = {
  params: equipmentIdParamSchema,
  query: equipmentRequestsQuerySchema,
};
