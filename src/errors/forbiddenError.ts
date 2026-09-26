import { AppError } from './appError.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещён') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}
