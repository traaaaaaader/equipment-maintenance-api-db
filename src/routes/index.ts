import { Router } from 'express';
import { equipmentRouter } from './equipment.routes.js';
import { requestsRouter } from './request.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({
    data: { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

routes.use('/equipment', equipmentRouter);
routes.use('/requests', requestsRouter);
