import { AppError } from './appError.js';

export class UnauthorizedError extends AppError {
  constructor(message = 'Требуется аутентификация') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
  }
}
