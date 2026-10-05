import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/index.js';
import { ForbiddenError } from './errors/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { contextMiddleware } from './utils/context.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { metricsMiddleware, metricsHandler } from './middlewares/metrics.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { routes } from './routes/index.js';
import { openApiDocument } from './docs/openapi.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(httpLogger);
  app.use(contextMiddleware);
  app.use(metricsMiddleware);

  app.use(
    helmet({
      hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new ForbiddenError(`CORS: источник ${origin} не разрешён`));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }),
  );

  app.get('/metrics', metricsHandler);

  app.use('/api', apiRateLimiter);

  app.use(express.json({ limit: config.bodyLimit }));
  app.use(cookieParser());

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, { customSiteTitle: 'Equipment Maintenance API — docs' }),
  );
  app.get('/api/docs.json', (_req, res) => res.json(openApiDocument));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
