import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors/index.js';

type ValidatedPart = 'params' | 'query' | 'body';

export interface ValidationSchemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

const PARTS: readonly ValidatedPart[] = ['params', 'query', 'body'];

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.valid = { params: undefined, query: undefined, body: undefined };
    const allIssues: { field: string; message: string }[] = [];

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const input = part === 'body' ? (req.body ?? {}) : req[part];
      const result = schema.safeParse(input);

      if (!result.success) {
        for (const issue of result.error.issues) {
          allIssues.push({
            field: [part, ...issue.path].join('.'),
            message: issue.message,
          });
        }
        continue;
      }

      req.valid[part] = result.data;
    }

    if (allIssues.length > 0) {
      next(new ValidationError(allIssues));
      return;
    }

    next();
  };
}
