import { z } from 'zod';
import { idParamSchema } from './common.schemas.js';

export const siteIdParamSchema = idParamSchema;

export type SiteIdParam = z.infer<typeof siteIdParamSchema>;

export const siteSummarySchemas = { params: siteIdParamSchema };
