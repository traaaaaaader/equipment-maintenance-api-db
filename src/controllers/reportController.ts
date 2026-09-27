import type { Request, Response } from 'express';
import { reportService } from '../services/reportService.js';
import type { EquipmentLoadQuery } from '../validators/report.schemas.js';

export async function getEquipmentLoad(req: Request, res: Response) {
  const query = req.valid.query as EquipmentLoadQuery;
  const data = await reportService.getEquipmentLoad(query);
  res.json({ data });
}
