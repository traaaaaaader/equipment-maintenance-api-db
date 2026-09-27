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
import type { RequestAssigneeDto, RequestAssigneeModel } from './requestAssignee.model.js';
import type { TechnicianModel } from './technician.model.js';
import type { RequestSparePartUsageDto, RequestSparePartModel } from './requestSparePart.model.js';
import type { SparePartModel } from './sparePart.model.js';
import type { RequestStatusHistoryModel } from './requestStatusHistory.model.js';

export const REQUEST_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = ['new', 'in_progress', 'done', 'rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const OPEN_STATUSES: RequestStatus[] = ['new', 'in_progress'];

export interface MaintenanceRequest {
  id: string;
  equipmentId: string;
  title: string;
  description?: string;
  priority: RequestPriority;
  status: RequestStatus;
  plannedAt?: string;
  author?: string | null;
  createdAt: string;
  updatedAt: string;
  assignees?: RequestAssigneeDto[];
  spareParts?: RequestSparePartUsageDto[];
}

export interface RequestFilters {
  status?: RequestStatus;
  priority?: RequestPriority;
  equipmentId?: string;
  createdFrom?: string;
  createdTo?: string;
  plannedFrom?: string;
  plannedTo?: string;
}

export class MaintenanceRequestModel extends Model<
  InferAttributes<
    MaintenanceRequestModel,
    { omit: 'assigneeLinks' | 'partUsages' | 'statusHistory' }
  >,
  InferCreationAttributes<
    MaintenanceRequestModel,
    { omit: 'assigneeLinks' | 'partUsages' | 'statusHistory' }
  >
> {
  declare id: CreationOptional<string>;
  declare equipmentId: string;
  declare title: string;
  declare description: string | null;
  declare priority: RequestPriority;
  declare status: CreationOptional<RequestStatus>;
  declare plannedAt: Date | null;
  declare author: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare assigneeLinks?: (RequestAssigneeModel & { technician?: TechnicianModel })[];
  declare partUsages?: (RequestSparePartModel & { sparePart?: SparePartModel })[];
  declare statusHistory?: RequestStatusHistoryModel[];

  toDto(): MaintenanceRequest {
    return {
      id: this.id,
      equipmentId: this.equipmentId,
      title: this.title,
      description: this.description ?? undefined,
      priority: this.priority,
      status: this.status,
      plannedAt: this.plannedAt ? this.plannedAt.toISOString() : undefined,
      author: this.author,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      assignees: this.assigneeLinks?.map((link) => ({
        technicianId: link.technicianId,
        fullName: link.technician?.fullName ?? '',
        role: link.role,
        plannedHours: Number(link.plannedHours),
      })),
      spareParts: this.partUsages?.map((usage) => ({
        sparePartId: usage.sparePartId,
        name: usage.sparePart?.name ?? '',
        sku: usage.sparePart?.sku ?? '',
        quantityUsed: usage.quantityUsed,
      })),
    };
  }
}

MaintenanceRequestModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    equipmentId: { type: DataTypes.UUID, allowNull: false, field: 'equipment_id' },
    title: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priority: { type: DataTypes.ENUM(...REQUEST_PRIORITIES), allowNull: false },
    status: {
      type: DataTypes.ENUM(...REQUEST_STATUSES),
      allowNull: false,
      defaultValue: 'new',
    },
    plannedAt: { type: DataTypes.DATE, allowNull: true, field: 'planned_at' },
    author: { type: DataTypes.STRING(150), allowNull: true },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'MaintenanceRequest',
    tableName: 'maintenance_requests',
    timestamps: true,
    underscored: true,
  },
);

EquipmentModel.hasMany(MaintenanceRequestModel, { foreignKey: 'equipmentId', as: 'requests' });
MaintenanceRequestModel.belongsTo(EquipmentModel, { foreignKey: 'equipmentId', as: 'equipment' });
