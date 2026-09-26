export interface AppErrorOptions {
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    const { status = 500, code = 'INTERNAL_ERROR', details, cause } = options;

    super(message, { cause });
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}
