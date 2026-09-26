import { AppError } from './appError.js';

export class ConflictError extends AppError {
  constructor(message = 'Конфликт состояния ресурса', details?: unknown) {
    super(message, { status: 409, code: 'CONFLICT', details });
  }
}
