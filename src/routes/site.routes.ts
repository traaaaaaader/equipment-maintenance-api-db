import { Router } from 'express';
import * as controller from '../controllers/siteController.js';
import { validate } from '../middlewares/validate.js';
import { siteSummarySchemas } from '../validators/site.schemas.js';

export const sitesRouter = Router();

sitesRouter.get('/:id/summary', validate(siteSummarySchemas), controller.getSummary);
