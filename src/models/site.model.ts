import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import type { EquipmentModel } from './equipment.model.js';

export interface Site {
  id: string;
  name: string;
  code: string;
  region: string;
  location: { lat: number; lon: number };
  createdAt: string;
  updatedAt: string;
}

export class SiteModel extends Model<
  InferAttributes<SiteModel, { omit: 'equipment' }>,
  InferCreationAttributes<SiteModel, { omit: 'equipment' }>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare code: string;
  declare region: string;
  declare locationLat: number;
  declare locationLon: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare equipment?: EquipmentModel[];

  toDto(): Site {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      region: this.region,
      location: { lat: Number(this.locationLat), lon: Number(this.locationLon) },
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

SiteModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    region: { type: DataTypes.STRING(150), allowNull: false },
    locationLat: { type: DataTypes.DECIMAL(9, 6), allowNull: false, field: 'location_lat' },
    locationLon: { type: DataTypes.DECIMAL(9, 6), allowNull: false, field: 'location_lon' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'Site',
    tableName: 'sites',
    timestamps: true,
    underscored: true,
  },
);
