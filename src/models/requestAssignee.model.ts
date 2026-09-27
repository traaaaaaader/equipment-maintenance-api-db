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
import { TechnicianModel } from './technician.model.js';

export const ASSIGNEE_ROLES = ['lead', 'member'] as const;
export type AssigneeRole = (typeof ASSIGNEE_ROLES)[number];

export interface RequestAssigneeDto {
  technicianId: string;
  fullName: string;
  role: AssigneeRole;
  plannedHours: number;
}

export class RequestAssigneeModel extends Model<
  InferAttributes<RequestAssigneeModel>,
  InferCreationAttributes<RequestAssigneeModel>
> {
  declare id: CreationOptional<string>;
  declare requestId: string;
  declare technicianId: string;
  declare role: AssigneeRole;
  declare plannedHours: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RequestAssigneeModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    requestId: { type: DataTypes.UUID, allowNull: false, field: 'request_id' },
    technicianId: { type: DataTypes.UUID, allowNull: false, field: 'technician_id' },
    role: { type: DataTypes.ENUM(...ASSIGNEE_ROLES), allowNull: false },
    plannedHours: { type: DataTypes.DECIMAL(6, 2), allowNull: false, field: 'planned_hours' },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'RequestAssignee',
    tableName: 'request_assignees',
    timestamps: true,
    underscored: true,
  },
);

MaintenanceRequestModel.hasMany(RequestAssigneeModel, {
  foreignKey: 'requestId',
  as: 'assigneeLinks',
});
RequestAssigneeModel.belongsTo(MaintenanceRequestModel, {
  foreignKey: 'requestId',
  as: 'request',
});
TechnicianModel.hasMany(RequestAssigneeModel, {
  foreignKey: 'technicianId',
  as: 'assigneeLinks',
});
RequestAssigneeModel.belongsTo(TechnicianModel, {
  foreignKey: 'technicianId',
  as: 'technician',
});
MaintenanceRequestModel.belongsToMany(TechnicianModel, {
  through: RequestAssigneeModel,
  foreignKey: 'requestId',
  otherKey: 'technicianId',
  as: 'technicians',
});
TechnicianModel.belongsToMany(MaintenanceRequestModel, {
  through: RequestAssigneeModel,
  foreignKey: 'technicianId',
  otherKey: 'requestId',
  as: 'requests',
});
