import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { SiteModel, type Site } from '../models/site.model.js';
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '../models/request.model.js';

export interface SiteSummary {
  siteId: string;
  totalRequests: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageCloseTimeHours: number | null;
}

export class SiteRepository {
  async findById(id: string): Promise<Site | null> {
    const site = await SiteModel.findByPk(id);
    return site ? site.toDto() : null;
  }

  async getSummary(siteId: string): Promise<SiteSummary> {
    const statusRows = await sequelize.query<{ status: string; count: number }>(
      `SELECT mr.status, count(*)::int AS count
         FROM maintenance_requests mr
         JOIN equipment e ON e.id = mr.equipment_id
        WHERE e.site_id = $1 AND e.deleted_at IS NULL
        GROUP BY mr.status`,
      { bind: [siteId], type: QueryTypes.SELECT },
    );

    const priorityRows = await sequelize.query<{ priority: string; count: number }>(
      `SELECT mr.priority, count(*)::int AS count
         FROM maintenance_requests mr
         JOIN equipment e ON e.id = mr.equipment_id
        WHERE e.site_id = $1 AND e.deleted_at IS NULL
        GROUP BY mr.priority`,
      { bind: [siteId], type: QueryTypes.SELECT },
    );

    const [closeTimeRow] = await sequelize.query<{ avg_seconds: number | null }>(
      `SELECT avg(extract(epoch FROM (mr.updated_at - mr.created_at)))::float AS avg_seconds
         FROM maintenance_requests mr
         JOIN equipment e ON e.id = mr.equipment_id
        WHERE e.site_id = $1 AND e.deleted_at IS NULL AND mr.status = 'done'`,
      { bind: [siteId], type: QueryTypes.SELECT },
    );

    const byStatus = Object.fromEntries(REQUEST_STATUSES.map((status) => [status, 0]));
    for (const row of statusRows) byStatus[row.status] = row.count;

    const byPriority = Object.fromEntries(REQUEST_PRIORITIES.map((priority) => [priority, 0]));
    for (const row of priorityRows) byPriority[row.priority] = row.count;

    const totalRequests = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    const avgSeconds = closeTimeRow?.avg_seconds ?? null;

    return {
      siteId,
      totalRequests,
      byStatus,
      byPriority,
      averageCloseTimeHours: avgSeconds !== null ? avgSeconds / 3600 : null,
    };
  }
}

export const siteRepository = new SiteRepository();
