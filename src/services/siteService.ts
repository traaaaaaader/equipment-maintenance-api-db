import { siteRepository, type SiteSummary } from '../repositories/siteRepository.js';
import { NotFoundError } from '../errors/index.js';

export class SiteService {
  async getSummary(id: string): Promise<SiteSummary> {
    const site = await siteRepository.findById(id);
    if (!site) throw new NotFoundError(`Площадка ${id} не найдена`);

    return siteRepository.getSummary(id);
  }
}

export const siteService = new SiteService();
