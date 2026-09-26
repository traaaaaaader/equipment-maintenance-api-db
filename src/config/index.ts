import dotenv from 'dotenv';
import { envSchema } from './env.schema.js';

dotenv.config({ quiet: true });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Указаны неверные переменные окружения:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  corsOrigins: env.CORS_ORIGINS,

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  weather: {
    apiUrl: env.WEATHER_API_URL,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    maxWindKmh: env.WEATHER_MAX_WIND_KMH,
  },

  bodyLimit: env.BODY_LIMIT,

  logLevel: env.LOG_LEVEL,

  apiKeys: env.API_KEYS,
} as const;
