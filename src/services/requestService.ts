import { sequelize } from '../db/sequelize.js';
import { requestRepository } from '../repositories/requestRepository.js';
import { equipmentRepository } from '../repositories/equipmentRepository.js';
import { requestAssigneeRepository } from '../repositories/requestAssigneeRepository.js';
import { requestStatusHistoryRepository } from '../repositories/requestStatusHistoryRepository.js';
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
    await this.getById(id);

    return sequelize.transaction(async (transaction) => {
      const locked = await requestRepository.findStatusForUpdate(id, transaction);
      if (!locked) throw new NotFoundError(`Заявка ${id} не найдена`);

      if (!isTransitionAllowed(locked.status, nextStatus)) {
        throw new ConflictError(
          `Недопустимый переход статуса: ${locked.status} -> ${nextStatus}`,
          [{ field: 'status', message: `Из статуса "${locked.status}" переход в "${nextStatus}" запрещён` }],
        );
      }

      if (nextStatus === 'in_progress') {
        const assigneeCount = await requestAssigneeRepository.countByRequestId(id, transaction);
        if (assigneeCount === 0) {
          throw new ConflictError('Нельзя перевести заявку в работу без назначенных исполнителей', [
            { field: 'status', message: 'Сначала назначьте бригаду через POST /requests/:id/assignees' },
          ]);
        }
      }

      const updated = (await requestRepository.update(
        id,
        { status: nextStatus },
        transaction,
      )) as MaintenanceRequest;

      await requestStatusHistoryRepository.create(
        { requestId: id, previousStatus: locked.status, newStatus: nextStatus },
        transaction,
      );

      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await requestRepository.delete(id);
  }
}

export const requestService = new RequestService();
