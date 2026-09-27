import { Router } from 'express';
import * as controller from '../controllers/reportController.js';
import { validate } from '../middlewares/validate.js';
import { equipmentLoadReportSchemas } from '../validators/report.schemas.js';

export const reportsRouter = Router();

reportsRouter.get(
  '/equipment-load',
  validate(equipmentLoadReportSchemas),
  controller.getEquipmentLoad,
);
