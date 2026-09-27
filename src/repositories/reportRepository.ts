import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export interface EquipmentLoadRow {
  equipmentId: string;
  equipmentName: string;
  serialNumber: string;
  totalRequests: number;
  closedRequests: number;
  totalPlannedHours: number;
  lastMaintenanceAt: string | null;
}

export interface EquipmentLoadParams {
  dateFrom: string | null;
  dateTo: string | null;
  minRequests: number;
}

interface EquipmentLoadRawRow {
  equipment_id: string;
  equipment_name: string;
  serial_number: string;
  total_requests: number;
  closed_requests: number;
  total_planned_hours: number;
  last_maintenance_at: Date | null;
}

export class ReportRepository {
  async getEquipmentLoad({
    dateFrom,
    dateTo,
    minRequests,
  }: EquipmentLoadParams): Promise<EquipmentLoadRow[]> {
    const rows = await sequelize.query<EquipmentLoadRawRow>(
      `SELECT
         e.id AS equipment_id,
         e.name AS equipment_name,
         e.serial_number AS serial_number,
         count(DISTINCT mr.id)::int AS total_requests,
         count(DISTINCT mr.id) FILTER (WHERE mr.status = 'done')::int AS closed_requests,
         coalesce(sum(ra.planned_hours), 0)::float AS total_planned_hours,
         max(mr.updated_at) FILTER (WHERE mr.status = 'done') AS last_maintenance_at
       FROM equipment e
       LEFT JOIN maintenance_requests mr
         ON mr.equipment_id = e.id
        AND ($1::timestamptz IS NULL OR mr.created_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR mr.created_at <= $2::timestamptz)
       LEFT JOIN request_assignees ra ON ra.request_id = mr.id
       WHERE e.deleted_at IS NULL
       GROUP BY e.id, e.name, e.serial_number
       HAVING count(DISTINCT mr.id) >= $3
       ORDER BY e.name`,
      { bind: [dateFrom, dateTo, minRequests], type: QueryTypes.SELECT },
    );

    return rows.map((row) => ({
      equipmentId: row.equipment_id,
      equipmentName: row.equipment_name,
      serialNumber: row.serial_number,
      totalRequests: row.total_requests,
      closedRequests: row.closed_requests,
      totalPlannedHours: row.total_planned_hours,
      lastMaintenanceAt: row.last_maintenance_at ? new Date(row.last_maintenance_at).toISOString() : null,
    }));
  }
}

export const reportRepository = new ReportRepository();
