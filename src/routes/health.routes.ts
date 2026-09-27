import { Router } from 'express';
import { sequelize } from '../db/sequelize.js';
import { logger } from '../utils/logger.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const base = { uptime: process.uptime(), timestamp: new Date().toISOString() };

  try {
    await sequelize.authenticate();
    res.json({ data: { status: 'ok', database: 'up', ...base } });
  } catch (err) {
    logger.error({ err }, 'health check: база данных недоступна');
    res.status(503).json({ data: { status: 'error', database: 'down', ...base } });
  }
});
