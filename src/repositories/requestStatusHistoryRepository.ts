import type { Transaction } from 'sequelize';
import {
  RequestStatusHistoryModel,
  type RequestStatusHistoryEntry,
} from '../models/requestStatusHistory.model.js';
import type { RequestStatus } from '../models/request.model.js';
import type { ListResult } from '../models/model.js';

export interface CreateHistoryEntryInput {
  requestId: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedBy?: string | null;
  comment?: string | null;
}

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

  async create(entry: CreateHistoryEntryInput, transaction: Transaction): Promise<void> {
    await RequestStatusHistoryModel.create(
      {
        requestId: entry.requestId,
        previousStatus: entry.previousStatus,
        newStatus: entry.newStatus,
        changedBy: entry.changedBy ?? null,
        comment: entry.comment ?? null,
      },
      { transaction },
    );
  }
}

export const requestStatusHistoryRepository = new RequestStatusHistoryRepository();
