import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';
import { registerSchemas, loginSchemas } from '../validators/auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchemas), controller.register);

authRouter.post('/login', authRateLimiter, validate(loginSchemas), controller.login);

authRouter.post('/refresh', controller.refresh);

authRouter.post('/logout', controller.logout);

authRouter.get('/me', authenticate, controller.me);
