import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isTest ? 'silent' : config.logLevel,
  serializers: {
    err: pino.stdSerializers.err,
  },
  redact: [
    'req.headers.authorization',
    'req.headers["x-api-key"]',
    'req.headers.cookie',
    '*.password',
  ],
  ...(config.nodeEnv === 'development' && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
  }),
});
