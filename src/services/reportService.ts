import { reportRepository, type EquipmentLoadRow } from '../repositories/reportRepository.js';
import type { EquipmentLoadQuery } from '../validators/report.schemas.js';

export class ReportService {
  async getEquipmentLoad(query: EquipmentLoadQuery): Promise<EquipmentLoadRow[]> {
    return reportRepository.getEquipmentLoad({
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
      minRequests: query.minRequests ?? 0,
    });
  }
}

export const reportService = new ReportService();
