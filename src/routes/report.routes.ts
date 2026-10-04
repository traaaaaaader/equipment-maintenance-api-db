import { Router } from 'express';
import * as controller from '../controllers/reportController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { equipmentLoadReportSchemas } from '../validators/report.schemas.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get(
  '/equipment-load',
  validate(equipmentLoadReportSchemas),
  controller.getEquipmentLoad,
);
