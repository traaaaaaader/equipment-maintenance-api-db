import type { ErrorRequestHandler } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { mapDatabaseError } from '../errors/databaseErrorMapper.js';

const KNOWN_CODES = new Set(['entity.parse.failed', 'entity.too.large']);

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const isBodyParserError = KNOWN_CODES.has(err.type) || err.status === 400 || err.status === 413;
  // Ошибки БД, не перехваченные заранее в сервисах (например, гонка на UNIQUE
  // при параллельных запросах) — переводим по SQLSTATE, а не отдаём как 500.
  const dbError = mapDatabaseError(err);

  const status = dbError?.status ?? err.status ?? err.statusCode ?? 500;
  const isOperational = err.isOperational === true || isBodyParserError || dbError !== null;

  const code = dbError?.code ?? err.code ?? (isBodyParserError ? 'BAD_REQUEST' : 'INTERNAL_ERROR');
  const message = dbError?.message ?? (isOperational ? err.message : 'Внутренняя ошибка сервера');

  const log = req.log ?? logger;
  log[status >= 500 ? 'error' : 'warn']({ err, status, requestId: req.id }, 'request failed');

  const body: { error: Record<string, unknown> } = {
    error: { code, message, requestId: req.id },
  };

  if (isOperational && err.details && !dbError) {
    body.error.details = err.details;
  }

  if (!config.isProduction && status >= 500) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
};
