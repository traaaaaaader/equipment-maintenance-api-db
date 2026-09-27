import { sequelize } from '../db/sequelize.js';
import { MaintenanceRequestModel } from '../models/request.model.js';
import { TechnicianModel } from '../models/technician.model.js';
import type { RequestAssigneeDto } from '../models/requestAssignee.model.js';
import {
  requestAssigneeRepository,
  type AssigneeInput,
} from '../repositories/requestAssigneeRepository.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';

export class RequestAssigneeService {
  async assign(requestId: string, assignees: AssigneeInput[]): Promise<RequestAssigneeDto[]> {
    const technicianIds = assignees.map((a) => a.technicianId);
    const uniqueIds = new Set(technicianIds);
    if (uniqueIds.size !== technicianIds.length) {
      throw new ConflictError('Один и тот же специалист указан в бригаде более одного раза');
    }

    const leadCount = assignees.filter((a) => a.role === 'lead').length;
    if (leadCount !== 1) {
      throw new ValidationError(
        [{ field: 'assignees', message: 'В бригаде должен быть ровно один специалист с ролью lead' }],
        'Некорректный состав бригады',
      );
    }

    await sequelize.transaction(async (transaction) => {
      const request = await MaintenanceRequestModel.findByPk(requestId, { transaction });
      if (!request) throw new NotFoundError(`Заявка ${requestId} не найдена`);

      // Снимаем прежние назначения до проверки новых специалистов: если кто-то
      // из присланного списка не найдётся, транзакция откатится и старая
      // бригада восстановится — это и есть сценарий отката для защиты.
      await requestAssigneeRepository.deleteForRequest(requestId, transaction);

      const technicians = await TechnicianModel.findAll({
        where: { id: [...uniqueIds] },
        transaction,
      });
      if (technicians.length !== uniqueIds.size) {
        const foundIds = new Set(technicians.map((t) => t.id));
        const missing = [...uniqueIds].filter((id) => !foundIds.has(id));
        throw new NotFoundError(`Специалист(ы) не найдены: ${missing.join(', ')}`);
      }

      await requestAssigneeRepository.createMany(requestId, assignees, transaction);
    });

    return requestAssigneeRepository.findByRequestId(requestId);
  }

  async remove(requestId: string, technicianId: string): Promise<void> {
    const request = await MaintenanceRequestModel.findByPk(requestId);
    if (!request) throw new NotFoundError(`Заявка ${requestId} не найдена`);

    const deleted = await requestAssigneeRepository.removeOne(requestId, technicianId);
    if (deleted === 0) {
      throw new NotFoundError(`Специалист ${technicianId} не назначен на заявку ${requestId}`);
    }
  }
}

export const requestAssigneeService = new RequestAssigneeService();
