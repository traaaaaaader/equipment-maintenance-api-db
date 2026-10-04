import type { Transaction } from 'sequelize';
import { TechnicianModel } from '../models/technician.model.js';

export class TechnicianRepository {
  async findExistingIds(ids: string[], transaction?: Transaction): Promise<Set<string>> {
    const technicians = await TechnicianModel.findAll({
      where: { id: ids },
      attributes: ['id'],
      transaction,
    });
    return new Set(technicians.map((t) => t.id));
  }
}

export const technicianRepository = new TechnicianRepository();
