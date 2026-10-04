import { equipmentRepository } from '../repositories/equipmentRepository.js';
import { requestRepository } from '../repositories/requestRepository.js';
import { siteRepository } from '../repositories/siteRepository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';
import type { Equipment, EquipmentFilters } from '../models/equipment.model.js';
import type { MaintenanceRequest, RequestFilters } from '../models/request.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { CreateEquipmentDto, UpdateEquipmentDto } from '../validators/equipment.schemas.js';
import { getForecastForLocation, type WeatherForecast } from './weatherService.js';

export class EquipmentService {
  async list(query: ListParams<EquipmentFilters>): Promise<ListResult<Equipment>> {
    const { items, total, page, limit } = await equipmentRepository.findAll(query);

    return { items, total, page, limit };
  }

  async getById(id: string): Promise<Equipment> {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new NotFoundError(`Оборудование ${id} не найдено`);
    return equipment;
  }

  async create(data: CreateEquipmentDto): Promise<Equipment> {
    const existing = await equipmentRepository.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw new ConflictError(`Серийный номер "${data.serialNumber}" уже используется`, [
        { field: 'serialNumber', message: 'Значение должно быть уникальным' },
      ]);
    }
    if (data.siteId) {
      await this.assertSiteExists(data.siteId);
    }
    return equipmentRepository.create(data);
  }

  async update(id: string, patch: UpdateEquipmentDto): Promise<Equipment> {
    await this.getById(id);

    if (patch.serialNumber) {
      const duplicate = await equipmentRepository.findBySerialNumber(patch.serialNumber);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Серийный номер "${patch.serialNumber}" уже используется`, [
          { field: 'serialNumber', message: 'Значение должно быть уникальным' },
        ]);
      }
    }
    if (patch.siteId) {
      await this.assertSiteExists(patch.siteId);
    }

    return (await equipmentRepository.update(id, patch)) as Equipment;
  }

  private async assertSiteExists(siteId: string): Promise<void> {
    const site = await siteRepository.findById(siteId);
    if (!site) throw new NotFoundError(`Площадка ${siteId} не найдена`);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);

    const openRequests = await requestRepository.countOpenByEquipmentId(id);
    if (openRequests > 0) {
      throw new ConflictError(
        `Нельзя удалить оборудование: есть ${openRequests} незакрытых заявок`,
      );
    }

    await equipmentRepository.delete(id);
  }

  async listRequestsFor(
    id: string,
    query: ListParams<Pick<RequestFilters, 'status' | 'priority'>>,
  ): Promise<ListResult<MaintenanceRequest>> {
    await this.getById(id);
    const { items, total, page, limit } = await requestRepository.findAll({
      ...query,
      filters: { equipmentId: id, ...query.filters },
    });
    return { items, total, page, limit };
  }

  async getWeather(id: string): Promise<WeatherForecast> {
    const equipment = await this.getById(id);
    return getForecastForLocation(equipment.location);
  }
}

export const equipmentService = new EquipmentService();
