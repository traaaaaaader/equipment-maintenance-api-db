import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { TechnicianModel, type Technician } from './technician.model.js';

export const ROLES = ['viewer', 'technician', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  technicianId: string | null;
  technician?: Technician | null;
  createdAt: string;
  updatedAt: string;
}

export class UserModel extends Model<
  InferAttributes<UserModel, { omit: 'technician' }>,
  InferCreationAttributes<UserModel, { omit: 'technician' }>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare name: string;
  declare role: CreationOptional<Role>;
  declare technicianId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare technician?: TechnicianModel | null;

  toDto(): User {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      technicianId: this.technicianId,
      technician: this.technician ? this.technician.toDto() : this.technician,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'viewer' },
    technicianId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      field: 'technician_id',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
  },
);

UserModel.belongsTo(TechnicianModel, { foreignKey: 'technicianId', as: 'technician' });
