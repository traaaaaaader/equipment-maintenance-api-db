import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { listUsersSchemas, updateRoleSchemas } from '../validators/user.schemas.js';

export const userRouter = Router();

userRouter.use(authenticate, requireRole('admin'));

userRouter.get('/', validate(listUsersSchemas), controller.list);

userRouter.patch('/:id/role', validate(updateRoleSchemas), controller.updateRole);
