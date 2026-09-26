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
});

export type Env = z.infer<typeof envSchema>;
