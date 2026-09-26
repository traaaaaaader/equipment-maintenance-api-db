import { Router } from 'express';
import * as controller from '../controllers/requestController.js';
import { validate } from '../middlewares/validate.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js';
import {
  listRequestSchemas,
  getRequestSchemas,
  createRequestSchemas,
  updateRequestSchemas,
  statusRequestSchemas,
  removeRequestSchemas,
} from '../validators/request.schemas.js';

export const requestsRouter = Router();

requestsRouter.get('/', validate(listRequestSchemas), controller.list);

requestsRouter.post('/', apiKeyAuth, validate(createRequestSchemas), controller.create);

requestsRouter.get('/:id', validate(getRequestSchemas), controller.getOne);

requestsRouter.patch(
  '/:id/status',
  apiKeyAuth,
  validate(statusRequestSchemas),
  controller.changeStatus,
);

requestsRouter.patch('/:id', apiKeyAuth, validate(updateRequestSchemas), controller.update);

requestsRouter.delete('/:id', apiKeyAuth, validate(removeRequestSchemas), controller.remove);
