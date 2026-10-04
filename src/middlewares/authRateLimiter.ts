import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/index.js';

export const authRateLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  limit: config.authRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? '')}:${typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''}`,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Слишком много попыток входа, повторите попытку позже',
        requestId: req.id,
      },
    });
  },
});
