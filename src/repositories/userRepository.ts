import { UserModel } from '../models/user.model.js';
import { TechnicianModel } from '../models/technician.model.js';
import type { ListParams, ListResult } from '../models/model.js';
import type { Role, User } from '../models/user.model.js';

export interface UserFilters {
  role?: Role;
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

const TECHNICIAN_INCLUDE = [{ model: TechnicianModel, as: 'technician' as const }];

export class UserRepository {
  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
  }): Promise<User> {
    const row = await UserModel.create(data);
    return row.toDto();
  }

  async findById(id: string): Promise<User | null> {
    const row = await UserModel.findByPk(id, { include: TECHNICIAN_INCLUDE });
    return row ? row.toDto() : null;
  }

  async findByEmail(email: string): Promise<UserWithPasswordHash | null> {
    const row = await UserModel.findOne({ where: { email }, include: TECHNICIAN_INCLUDE });
    return row ? { ...row.toDto(), passwordHash: row.passwordHash } : null;
  }

  async findAll({ filters = {}, page = 1, limit = 20 }: ListParams<UserFilters> = {}): Promise<
    ListResult<User>
  > {
    const where = filters.role ? { role: filters.role } : {};
    const { rows, count } = await UserModel.findAndCountAll({
      where,
      include: TECHNICIAN_INCLUDE,
      order: [['createdAt', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });
    return { items: rows.map((row) => row.toDto()), total: count, page, limit };
  }

  async updateRole(id: string, role: Role, technicianId: string | null): Promise<User | null> {
    const row = await UserModel.findByPk(id);
    if (!row) return null;
    row.role = role;
    row.technicianId = technicianId;
    await row.save();
    await row.reload({ include: TECHNICIAN_INCLUDE });
    return row.toDto();
  }
}

export const userRepository = new UserRepository();
