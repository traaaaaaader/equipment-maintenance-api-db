import { randomUUID } from 'node:crypto';
import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { MaintenanceRequestModel, REQUEST_STATUSES, type RequestStatus } from './request.model.js';

export interface RequestStatusHistoryEntry {
  id: string;
  requestId: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedBy: string | null;
  comment: string | null;
  createdAt: string;
}

export class RequestStatusHistoryModel extends Model<
  InferAttributes<RequestStatusHistoryModel>,
  InferCreationAttributes<RequestStatusHistoryModel>
> {
  declare id: CreationOptional<string>;
  declare requestId: string;
  declare previousStatus: RequestStatus | null;
  declare newStatus: RequestStatus;
  declare changedBy: string | null;
  declare comment: string | null;
  declare createdAt: CreationOptional<Date>;

  toDto(): RequestStatusHistoryEntry {
    return {
      id: this.id,
      requestId: this.requestId,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      changedBy: this.changedBy,
      comment: this.comment,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

RequestStatusHistoryModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    requestId: { type: DataTypes.UUID, allowNull: false, field: 'request_id' },
    previousStatus: {
      type: DataTypes.ENUM(...REQUEST_STATUSES),
      allowNull: true,
      field: 'previous_status',
    },
    newStatus: {
      type: DataTypes.ENUM(...REQUEST_STATUSES),
      allowNull: false,
      field: 'new_status',
    },
    changedBy: { type: DataTypes.STRING(150), allowNull: true, field: 'changed_by' },
    comment: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
  },
  {
    sequelize,
    modelName: 'RequestStatusHistory',
    tableName: 'request_status_history',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  },
);

MaintenanceRequestModel.hasMany(RequestStatusHistoryModel, {
  foreignKey: 'requestId',
  as: 'statusHistory',
});
RequestStatusHistoryModel.belongsTo(MaintenanceRequestModel, {
  foreignKey: 'requestId',
  as: 'request',
});
