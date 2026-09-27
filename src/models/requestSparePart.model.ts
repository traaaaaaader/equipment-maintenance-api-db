import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { MaintenanceRequestModel } from './request.model.js';
import { SparePartModel } from './sparePart.model.js';

export interface RequestSparePartUsageDto {
  sparePartId: string;
  name: string;
  sku: string;
  quantityUsed: number;
}

export class RequestSparePartModel extends Model<
  InferAttributes<RequestSparePartModel>,
  InferCreationAttributes<RequestSparePartModel>
> {
  declare id: CreationOptional<string>;
  declare requestId: string;
  declare sparePartId: string;
  declare quantityUsed: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RequestSparePartModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    requestId: { type: DataTypes.UUID, allowNull: false, field: 'request_id' },
    sparePartId: { type: DataTypes.UUID, allowNull: false, field: 'spare_part_id' },
    quantityUsed: { type: DataTypes.INTEGER, allowNull: false, field: 'quantity_used' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'RequestSparePart',
    tableName: 'request_spare_parts',
    timestamps: true,
    underscored: true,
  },
);

MaintenanceRequestModel.hasMany(RequestSparePartModel, {
  foreignKey: 'requestId',
  as: 'partUsages',
});
RequestSparePartModel.belongsTo(MaintenanceRequestModel, {
  foreignKey: 'requestId',
  as: 'request',
});
SparePartModel.hasMany(RequestSparePartModel, {
  foreignKey: 'sparePartId',
  as: 'usages',
});
RequestSparePartModel.belongsTo(SparePartModel, {
  foreignKey: 'sparePartId',
  as: 'sparePart',
});
MaintenanceRequestModel.belongsToMany(SparePartModel, {
  through: RequestSparePartModel,
  foreignKey: 'requestId',
  otherKey: 'sparePartId',
  as: 'spareParts',
});
SparePartModel.belongsToMany(MaintenanceRequestModel, {
  through: RequestSparePartModel,
  foreignKey: 'sparePartId',
  otherKey: 'requestId',
  as: 'requests',
});
