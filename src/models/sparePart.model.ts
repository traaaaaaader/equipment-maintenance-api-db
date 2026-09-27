import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export class SparePartModel extends Model<
  InferAttributes<SparePartModel>,
  InferCreationAttributes<SparePartModel>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare sku: string;
  declare quantity: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toDto(): SparePart {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      quantity: this.quantity,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

SparePartModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    name: { type: DataTypes.STRING(150), allowNull: false },
    sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'SparePart',
    tableName: 'spare_parts',
    timestamps: true,
    underscored: true,
  },
);
