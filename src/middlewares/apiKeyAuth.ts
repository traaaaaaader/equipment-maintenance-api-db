import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../errors/index.js';

export function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  if (config.apiKeys.length === 0) return next();

  const provided = req.headers['x-api-key'];
  if (typeof provided === 'string' && config.apiKeys.includes(provided)) {
    return next();
  }

  next(new UnauthorizedError('Отсутствует или неверен заголовок X-API-Key'));
}
