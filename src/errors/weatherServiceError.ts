import { AppError } from './appError.js';

export class WeatherServiceError extends AppError {
  constructor(message = 'Внешний сервис временно недоступен', cause?: unknown) {
    super(message, { status: 503, code: 'SERVICE_UNAVAILABLE', cause });
  }
}
