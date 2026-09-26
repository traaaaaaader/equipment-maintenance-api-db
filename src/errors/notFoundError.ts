import { AppError } from './appError.js';

export class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден', details?: unknown) {
    super(message, { status: 404, code: 'NOT_FOUND', details });
  }
}
