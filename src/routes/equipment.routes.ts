import { Router } from 'express';
import * as controller from '../controllers/equipmentController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import {
  listEquipmentSchemas,
  createEquipmentSchemas,
  getEquipmentSchemas,
  updateEquipmentSchemas,
  removeEquipmentSchemas,
  weatherEquipmentSchemas,
  listRequestsForEquipmentSchemas,
} from '../validators/equipment.schemas.js';

export const equipmentRouter = Router();

equipmentRouter.use(authenticate);

equipmentRouter.get('/', validate(listEquipmentSchemas), controller.list);

equipmentRouter.post(
  '/',
  requireRole('admin'),
  validate(createEquipmentSchemas),
  controller.create,
);

equipmentRouter.get('/:id', validate(getEquipmentSchemas), controller.getOne);

equipmentRouter.patch(
  '/:id',
  requireRole('admin'),
  validate(updateEquipmentSchemas),
  controller.update,
);

equipmentRouter.delete(
  '/:id',
  requireRole('admin'),
  validate(removeEquipmentSchemas),
  controller.remove,
);

equipmentRouter.get(
  '/:id/requests',
  validate(listRequestsForEquipmentSchemas),
  controller.listRequestsForEquipment,
);

equipmentRouter.get('/:id/weather', validate(weatherEquipmentSchemas), controller.getWeather);
