import { Router } from 'express';
import * as controller from '../controllers/requestController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
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

requestsRouter.use(authenticate);

requestsRouter.get('/', validate(listRequestSchemas), controller.list);

requestsRouter.post('/', requireRole('technician', 'admin'), validate(createRequestSchemas), controller.create);

requestsRouter.get('/:id', validate(getRequestSchemas), controller.getOne);

requestsRouter.patch(
  '/:id/status',
  requireRole('technician', 'admin'),
  validate(statusRequestSchemas),
  controller.changeStatus,
);

requestsRouter.patch('/:id', requireRole('technician', 'admin'), validate(updateRequestSchemas), controller.update);

requestsRouter.delete('/:id', requireRole('admin'), validate(removeRequestSchemas), controller.remove);

requestsRouter.post(
  '/:id/assignees',
  requireRole('admin'),
  validate(assignBrigadeSchemas),
  controller.assignBrigade,
);

requestsRouter.delete(
  '/:id/assignees/:userId',
  requireRole('admin'),
  validate(removeAssigneeSchemas),
  controller.removeAssignee,
);

requestsRouter.get('/:id/history', validate(requestHistorySchemas), controller.listHistory);

requestsRouter.post(
  '/:id/spare-parts',
  requireRole('technician', 'admin'),
  validate(consumeSparePartSchemas),
  controller.consumeSparePart,
);
