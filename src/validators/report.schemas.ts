import { z } from 'zod';
import { isoDateTimeString } from './common.schemas.js';

export const equipmentLoadQuerySchema = z.object({
  dateFrom: isoDateTimeString.optional(),
  dateTo: isoDateTimeString.optional(),
  minRequests: z.coerce
    .number()
    .int('minRequests должен быть целым числом')
    .nonnegative('minRequests не может быть отрицательным')
    .optional(),
});

export type EquipmentLoadQuery = z.infer<typeof equipmentLoadQuerySchema>;

export const equipmentLoadReportSchemas = { query: equipmentLoadQuerySchema };
