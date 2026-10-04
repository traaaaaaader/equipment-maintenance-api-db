import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'password: минимум 8 символов')
  .max(72, 'password: максимум 72 символа')
  .regex(/[A-Za-zА-Яа-я]/, 'password должен содержать хотя бы одну букву')
  .regex(/[0-9]/, 'password должен содержать хотя бы одну цифру');

export const registerSchema = z.object({
  email: z.email('Некорректный email').trim().toLowerCase(),
  name: z.string().trim().min(2, 'name: минимум 2 символа').max(150, 'name: максимум 150 символов'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email('Некорректный email').trim().toLowerCase(),
  password: z.string().min(1, 'password обязателен').max(200),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchemas = { body: registerSchema };
export const loginSchemas = { body: loginSchema };
