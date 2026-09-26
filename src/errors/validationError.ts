import type { ZodError } from 'zod';
import { AppError } from './appError.js';

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  constructor(details: ValidationIssue[] = [], message = 'Некорректные данные запроса') {
    super(message, { status: 422, code: 'VALIDATION_ERROR', details });
  }

  static fromZodError(zodError: ZodError): ValidationError {
    const details: ValidationIssue[] = zodError.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    return new ValidationError(details);
  }
}
