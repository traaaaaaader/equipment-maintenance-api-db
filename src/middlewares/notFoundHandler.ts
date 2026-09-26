import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors/index.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl} не найден`));
}
