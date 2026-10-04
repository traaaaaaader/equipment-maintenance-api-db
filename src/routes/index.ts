import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { equipmentRouter } from './equipment.routes.js';
import { requestsRouter } from './request.routes.js';
import { sitesRouter } from './site.routes.js';
import { reportsRouter } from './report.routes.js';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/auth', authRouter);
routes.use('/users', userRouter);

routes.use('/equipment', equipmentRouter);
routes.use('/requests', requestsRouter);
routes.use('/sites', sitesRouter);
routes.use('/reports', reportsRouter);
