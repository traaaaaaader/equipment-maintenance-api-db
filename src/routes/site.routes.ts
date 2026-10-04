import { Router } from 'express';
import * as controller from '../controllers/siteController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { siteSummarySchemas } from '../validators/site.schemas.js';

export const sitesRouter = Router();

sitesRouter.use(authenticate);

sitesRouter.get('/:id/summary', validate(siteSummarySchemas), controller.getSummary);
