import type { Request, Response } from 'express';
import { siteService } from '../services/siteService.js';
import type { SiteIdParam } from '../validators/site.schemas.js';

export async function getSummary(req: Request, res: Response) {
  const { id } = req.valid.params as SiteIdParam;
  const summary = await siteService.getSummary(id);
  res.json({ data: summary });
}
