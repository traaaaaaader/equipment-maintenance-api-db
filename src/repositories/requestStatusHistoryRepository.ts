import {
  RequestStatusHistoryModel,
  type RequestStatusHistoryEntry,
} from '../models/requestStatusHistory.model.js';
import type { ListResult } from '../models/model.js';

export class RequestStatusHistoryRepository {
  async findByRequestId(
    requestId: string,
    { page, limit }: { page: number; limit: number },
  ): Promise<ListResult<RequestStatusHistoryEntry>> {
    const { rows, count } = await RequestStatusHistoryModel.findAndCountAll({
      where: { requestId },
      order: [['createdAt', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });

    return { items: rows.map((row) => row.toDto()), total: count, page, limit };
  }
}

export const requestStatusHistoryRepository = new RequestStatusHistoryRepository();
