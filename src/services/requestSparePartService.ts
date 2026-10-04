import { sequelize } from '../db/sequelize.js';
import { requestRepository } from '../repositories/requestRepository.js';
import { requestSparePartRepository } from '../repositories/requestSparePartRepository.js';
import { sparePartRepository } from '../repositories/sparePartRepository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';

export class RequestSparePartService {
  async consume(requestId: string, sparePartId: string, quantityUsed: number): Promise<void> {
    await sequelize.transaction(async (transaction) => {
      const requestExists = await requestRepository.exists(requestId, transaction);
      if (!requestExists) throw new NotFoundError(`Заявка ${requestId} не найдена`);

      const sparePart = await sparePartRepository.findById(sparePartId, transaction);
      if (!sparePart) throw new NotFoundError(`Запчасть ${sparePartId} не найдена`);

      const decremented = await requestSparePartRepository.decrementStock(
        sparePartId,
        quantityUsed,
        transaction,
      );
      if (!decremented) {
        throw new ConflictError(
          `Недостаточно запчасти "${sparePart.name}" на складе (запрошено ${quantityUsed}, в наличии ${sparePart.quantity})`,
          [
            {
              field: 'quantityUsed',
              message: 'Запрошенное количество превышает остаток на складе',
            },
          ],
        );
      }

      await requestSparePartRepository.recordUsage(
        requestId,
        sparePartId,
        quantityUsed,
        transaction,
      );
    });
  }
}

export const requestSparePartService = new RequestSparePartService();
