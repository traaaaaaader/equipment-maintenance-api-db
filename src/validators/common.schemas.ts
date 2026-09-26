import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.uuid('id должен быть корректным UUID'),
});

export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int('page должен быть целым числом')
    .positive('page должен быть положительным')
    .default(1),
  limit: z.coerce
    .number()
    .int('limit должен быть целым числом')
    .min(1, 'limit не может быть меньше 1')
    .max(100, 'limit не может быть больше 100')
    .default(20),
});

export function sortSchema(allowedFields: readonly string[]) {
  return z
    .string()
    .optional()
    .refine(
      (value) => !value || allowedFields.includes(value.replace(/^-/, '')),
      `sort должен быть одним из: ${allowedFields.join(', ')} (с необязательным префиксом "-" для убывающего порядка)`,
    );
}

export const isoDateTimeString = z.iso.datetime({
  offset: true,
  message: 'Ожидается ISO-8601 дата-время',
});
export const isoDateString = z.iso.date({ message: 'Ожидается ISO-8601 дата (YYYY-MM-DD)' });

export type IdParam = z.infer<typeof idParamSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
