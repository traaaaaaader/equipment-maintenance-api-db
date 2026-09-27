import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export interface Technician {
  id: string;
  fullName: string;
  specialization: string;
  badgeNumber: string;
  createdAt: string;
  updatedAt: string;
}

export class TechnicianModel extends Model<
  InferAttributes<TechnicianModel>,
  InferCreationAttributes<TechnicianModel>
> {
  declare id: CreationOptional<string>;
  declare fullName: string;
  declare specialization: string;
  declare badgeNumber: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toDto(): Technician {
    return {
      id: this.id,
      fullName: this.fullName,
      specialization: this.specialization,
      badgeNumber: this.badgeNumber,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

TechnicianModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
    specialization: { type: DataTypes.STRING(150), allowNull: false },
    badgeNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'badge_number',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'Technician',
    tableName: 'technicians',
    timestamps: true,
    underscored: true,
  },
);
