import { requestRepository } from '../repositories/requestRepository.js';
import { equipmentRepository } from '../repositories/equipmentRepository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';
import { isTransitionAllowed } from './requestStatusTransitions.js';
import type { MaintenanceRequest, RequestFilters, RequestStatus } from '../models/request.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { CreateRequestDto, UpdateRequestDto } from '../validators/request.schemas.js';

export class RequestService {
  async list(query: ListParams<RequestFilters>): Promise<ListResult<MaintenanceRequest>> {
    const { items, total, page, limit } = await requestRepository.findAll(query);

    return { items, total, page, limit };
  }

  async getById(id: string): Promise<MaintenanceRequest> {
    const request = await requestRepository.findById(id);
    if (!request) throw new NotFoundError(`Заявка ${id} не найдена`);
    return request;
  }

  async create(data: CreateRequestDto): Promise<MaintenanceRequest> {
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) {
      throw new NotFoundError(`Оборудование ${data.equipmentId} не найдено`);
    }
    return requestRepository.create(data);
  }

  async update(id: string, patch: UpdateRequestDto): Promise<MaintenanceRequest> {
    await this.getById(id);
    return (await requestRepository.update(id, patch)) as MaintenanceRequest;
  }

  async changeStatus(id: string, nextStatus: RequestStatus): Promise<MaintenanceRequest> {
    const request = await this.getById(id);

    if (!isTransitionAllowed(request.status, nextStatus)) {
      throw new ConflictError(
        `Недопустимый переход статуса: ${request.status} -> ${nextStatus}`,
        [{ field: 'status', message: `Из статуса "${request.status}" переход в "${nextStatus}" запрещён` }],
      );
    }

    return (await requestRepository.update(id, { status: nextStatus })) as MaintenanceRequest;
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await requestRepository.delete(id);
  }
}

export const requestService = new RequestService();
