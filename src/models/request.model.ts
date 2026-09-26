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
  createdAt: string;
  updatedAt: string;
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
