import type { Transaction } from 'sequelize';
import { SparePartModel } from '../models/sparePart.model.js';

export interface SparePartStockInfo {
  id: string;
  name: string;
  quantity: number;
}

export class SparePartRepository {
  async findById(id: string, transaction?: Transaction): Promise<SparePartStockInfo | null> {
    const sparePart = await SparePartModel.findByPk(id, {
      attributes: ['id', 'name', 'quantity'],
      transaction,
    });
    return sparePart
      ? { id: sparePart.id, name: sparePart.name, quantity: sparePart.quantity }
      : null;
  }
}

export const sparePartRepository = new SparePartRepository();
