import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/index.js';
import { verifyAccessToken } from '../services/tokenService.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    next(
      new UnauthorizedError('Требуется аутентификация: заголовок Authorization: Bearer <token>'),
    );
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, technicianId: payload.technicianId };
    next();
  } catch {
    next(new UnauthorizedError('Невалидный или истёкший access-токен'));
  }
}
