import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { EquipmentModel } from './equipment.model.js';

export interface EquipmentPassportDto {
  id: string;
  manufacturer: string;
  model: string;
  ratedPowerKw: number;
  lastInspectionAt: string | null;
}

export class EquipmentPassportModel extends Model<
  InferAttributes<EquipmentPassportModel>,
  InferCreationAttributes<EquipmentPassportModel>
> {
  declare id: CreationOptional<string>;
  declare equipmentId: string;
  declare manufacturer: string;
  declare model: string;
  declare ratedPowerKw: number;
  declare lastInspectionAt: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

EquipmentPassportModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    equipmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'equipment_id' },
    manufacturer: { type: DataTypes.STRING(150), allowNull: false },
    model: { type: DataTypes.STRING(150), allowNull: false },
    ratedPowerKw: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'rated_power_kw' },
    lastInspectionAt: { type: DataTypes.DATEONLY, allowNull: true, field: 'last_inspection_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'EquipmentPassport',
    tableName: 'equipment_passports',
    timestamps: true,
    underscored: true,
  },
);

EquipmentModel.hasOne(EquipmentPassportModel, { foreignKey: 'equipmentId', as: 'passport' });
EquipmentPassportModel.belongsTo(EquipmentModel, { foreignKey: 'equipmentId', as: 'equipment' });
