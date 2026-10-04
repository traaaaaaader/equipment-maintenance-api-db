import { requestRepository } from '../repositories/requestRepository.js';
import { requestStatusHistoryRepository } from '../repositories/requestStatusHistoryRepository.js';
import { NotFoundError } from '../errors/index.js';
import type { RequestStatusHistoryEntry } from '../models/requestStatusHistory.model.js';
import type { ListResult } from '../models/model.js';

export class RequestStatusHistoryService {
  async list(
    requestId: string,
    params: { page: number; limit: number },
  ): Promise<ListResult<RequestStatusHistoryEntry>> {
    const requestExists = await requestRepository.exists(requestId);
    if (!requestExists) throw new NotFoundError(`Заявка ${requestId} не найдена`);

    return requestStatusHistoryRepository.findByRequestId(requestId, params);
  }
}

export const requestStatusHistoryService = new RequestStatusHistoryService();
