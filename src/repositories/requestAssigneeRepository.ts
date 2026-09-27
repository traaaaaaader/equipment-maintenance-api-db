import type { Transaction } from 'sequelize';
import {
  RequestAssigneeModel,
  type AssigneeRole,
  type RequestAssigneeDto,
} from '../models/requestAssignee.model.js';
import { TechnicianModel } from '../models/technician.model.js';

export interface AssigneeInput {
  technicianId: string;
  role: AssigneeRole;
  plannedHours: number;
}

export class RequestAssigneeRepository {
  async findByRequestId(requestId: string): Promise<RequestAssigneeDto[]> {
    const links = (await RequestAssigneeModel.findAll({
      where: { requestId },
      include: [{ model: TechnicianModel, as: 'technician', attributes: ['id', 'fullName'] }],
      order: [['role', 'ASC']],
    })) as (RequestAssigneeModel & { technician?: TechnicianModel })[];

    return links.map((link) => ({
      technicianId: link.technicianId,
      fullName: link.technician?.fullName ?? '',
      role: link.role,
      plannedHours: Number(link.plannedHours),
    }));
  }

  async deleteForRequest(requestId: string, transaction: Transaction): Promise<void> {
    await RequestAssigneeModel.destroy({ where: { requestId }, transaction });
  }

  async createMany(
    requestId: string,
    assignees: AssigneeInput[],
    transaction: Transaction,
  ): Promise<void> {
    await RequestAssigneeModel.bulkCreate(
      assignees.map((a) => ({
        requestId,
        technicianId: a.technicianId,
        role: a.role,
        plannedHours: a.plannedHours,
      })),
      { transaction },
    );
  }

  async removeOne(requestId: string, technicianId: string): Promise<number> {
    return RequestAssigneeModel.destroy({ where: { requestId, technicianId } });
  }

  async countByRequestId(requestId: string, transaction?: Transaction): Promise<number> {
    return RequestAssigneeModel.count({ where: { requestId }, transaction });
  }
}

export const requestAssigneeRepository = new RequestAssigneeRepository();
