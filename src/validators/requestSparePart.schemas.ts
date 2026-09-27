import { z } from 'zod';
import { idParamSchema } from './common.schemas.js';

export const consumeSparePartSchema = z.object({
  sparePartId: z.uuid('sparePartId должен быть корректным UUID'),
  quantityUsed: z.number().int('quantityUsed должен быть целым числом').positive('quantityUsed должен быть положительным'),
});

export type ConsumeSparePartDto = z.infer<typeof consumeSparePartSchema>;

export const consumeSparePartSchemas = { params: idParamSchema, body: consumeSparePartSchema };
