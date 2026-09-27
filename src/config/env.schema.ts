import { z } from 'zod';

const csvToArray = (fallback: string[] = []) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return fallback;
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    });

const stringToNumber = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return fallback;
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    });

export const envSchema = z.object({
  PORT: stringToNumber(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  CORS_ORIGINS: csvToArray(['http://localhost:3000']),

  RATE_LIMIT_WINDOW_MS: stringToNumber(60_000),
  RATE_LIMIT_MAX: stringToNumber(100),

  WEATHER_API_URL: z.string().url().default('https://api.open-meteo.com/v1/forecast'),
  REQUEST_TIMEOUT_MS: stringToNumber(5000),
  WEATHER_MAX_WIND_KMH: stringToNumber(40),

  BODY_LIMIT: z.string().default('100kb'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  API_KEYS: csvToArray([]),

  PGHOST: z.string().default('localhost'),
  PGPORT: stringToNumber(5432),
  PGDATABASE: z.string().min(1, 'PGDATABASE обязателен'),
  PGDATABASE_TEST: z.string().optional(),
  PGUSER: z.string().min(1, 'PGUSER обязателен'),
  PGPASSWORD: z.string().min(1, 'PGPASSWORD обязателен'),

  DB_POOL_MAX: stringToNumber(10),
  DB_POOL_MIN: stringToNumber(0),
  DB_POOL_ACQUIRE_MS: stringToNumber(30_000),
  DB_POOL_IDLE_MS: stringToNumber(10_000),
});

export type Env = z.infer<typeof envSchema>;
