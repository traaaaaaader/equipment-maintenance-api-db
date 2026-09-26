import { Router } from 'express';
import * as controller from '../controllers/equipmentController.js';
import { validate } from '../middlewares/validate.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js';
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

equipmentRouter.get('/', validate(listEquipmentSchemas), controller.list);

equipmentRouter.post('/', apiKeyAuth, validate(createEquipmentSchemas), controller.create);

equipmentRouter.get('/:id', validate(getEquipmentSchemas), controller.getOne);

equipmentRouter.patch('/:id', apiKeyAuth, validate(updateEquipmentSchemas), controller.update);

equipmentRouter.delete('/:id', apiKeyAuth, validate(removeEquipmentSchemas), controller.remove);

equipmentRouter.get(
  '/:id/requests',
  validate(listRequestsForEquipmentSchemas),
  controller.listRequestsForEquipment,
);

equipmentRouter.get('/:id/weather', validate(weatherEquipmentSchemas), controller.getWeather);
