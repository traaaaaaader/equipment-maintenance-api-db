import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import type { EquipmentPassportDto, EquipmentPassportModel } from './equipmentPassport.model.js';
import { SiteModel } from './site.model.js';
import type { MaintenanceRequestModel } from './request.model.js';

export const EQUIPMENT_TYPES = ['turbine', 'inverter', 'sensor', 'substation'] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EQUIPMENT_STATUSES = [
  'operational',
  'maintenance',
  'fault',
  'decommissioned',
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export interface Location {
  lat: number;
  lon: number;
}

export interface Equipment {
  id: string;
  siteId: string | null;
  name: string;
  type: EquipmentType;
  serialNumber: string;
  location: Location;
  status: EquipmentStatus;
  installedAt: string;
  createdAt: string;
  updatedAt: string;
  passport?: EquipmentPassportDto | null;
}

export interface EquipmentFilters {
  type?: EquipmentType;
  status?: EquipmentStatus;
  search?: string;
  siteId?: string;
}

export class EquipmentModel extends Model<
  InferAttributes<EquipmentModel, { omit: 'passport' | 'site' | 'requests' }>,
  InferCreationAttributes<EquipmentModel, { omit: 'passport' | 'site' | 'requests' }>
> {
  declare id: CreationOptional<string>;
  declare siteId: string | null;
  declare name: string;
  declare type: EquipmentType;
  declare serialNumber: string;
  declare locationLat: number;
  declare locationLon: number;
  declare status: CreationOptional<EquipmentStatus>;
  declare installedAt: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare passport?: EquipmentPassportModel | null;
  declare site?: SiteModel;
  declare requests?: MaintenanceRequestModel[];

  toDto(): Equipment {
    return {
      id: this.id,
      siteId: this.siteId,
      name: this.name,
      type: this.type,
      serialNumber: this.serialNumber,
      location: { lat: Number(this.locationLat), lon: Number(this.locationLon) },
      status: this.status,
      installedAt: this.installedAt,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      passport: this.passport
        ? {
            id: this.passport.id,
            manufacturer: this.passport.manufacturer,
            model: this.passport.model,
            ratedPowerKw: Number(this.passport.ratedPowerKw),
            lastInspectionAt: this.passport.lastInspectionAt,
          }
        : this.passport === null
          ? null
          : undefined,
    };
  }
}

EquipmentModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    siteId: { type: DataTypes.UUID, allowNull: true, field: 'site_id' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM(...EQUIPMENT_TYPES), allowNull: false },
    serialNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'serial_number',
    },
    locationLat: { type: DataTypes.DECIMAL(9, 6), allowNull: false, field: 'location_lat' },
    locationLon: { type: DataTypes.DECIMAL(9, 6), allowNull: false, field: 'location_lon' },
    status: {
      type: DataTypes.ENUM(...EQUIPMENT_STATUSES),
      allowNull: false,
      defaultValue: 'operational',
    },
    installedAt: { type: DataTypes.DATEONLY, allowNull: false, field: 'installed_at' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  },
  {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipment',
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

SiteModel.hasMany(EquipmentModel, { foreignKey: 'siteId', as: 'equipment' });
EquipmentModel.belongsTo(SiteModel, { foreignKey: 'siteId', as: 'site' });
