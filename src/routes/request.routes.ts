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
  requestHistorySchemas,
} from '../validators/request.schemas.js';
import {
  assignBrigadeSchemas,
  removeAssigneeSchemas,
} from '../validators/requestAssignee.schemas.js';
import { consumeSparePartSchemas } from '../validators/requestSparePart.schemas.js';

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

requestsRouter.post(
  '/:id/assignees',
  apiKeyAuth,
  validate(assignBrigadeSchemas),
  controller.assignBrigade,
);

requestsRouter.delete(
  '/:id/assignees/:userId',
  apiKeyAuth,
  validate(removeAssigneeSchemas),
  controller.removeAssignee,
);

requestsRouter.get('/:id/history', validate(requestHistorySchemas), controller.listHistory);

requestsRouter.post(
  '/:id/spare-parts',
  apiKeyAuth,
  validate(consumeSparePartSchemas),
  controller.consumeSparePart,
);
