import { QueryTypes, type Transaction } from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { RequestSparePartModel } from '../models/requestSparePart.model.js';

export class RequestSparePartRepository {
  async decrementStock(
    sparePartId: string,
    quantityUsed: number,
    transaction: Transaction,
  ): Promise<{ id: string; quantity: number } | null> {
    const rows = await sequelize.query<{ id: string; quantity: number }>(
      `UPDATE spare_parts
          SET quantity = quantity - $1, updated_at = now()
        WHERE id = $2 AND quantity >= $1
        RETURNING id, quantity`,
      { bind: [quantityUsed, sparePartId], transaction, type: QueryTypes.SELECT },
    );
    return rows[0] ?? null;
  }

  async recordUsage(
    requestId: string,
    sparePartId: string,
    quantityUsed: number,
    transaction: Transaction,
  ): Promise<void> {
    const [usage, created] = await RequestSparePartModel.findOrCreate({
      where: { requestId, sparePartId },
      defaults: { requestId, sparePartId, quantityUsed },
      transaction,
    });

    if (!created) {
      await usage.increment('quantityUsed', { by: quantityUsed, transaction });
    }
  }
}

export const requestSparePartRepository = new RequestSparePartRepository();
