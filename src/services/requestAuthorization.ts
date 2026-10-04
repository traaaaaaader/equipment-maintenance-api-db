import { ForbiddenError } from '../errors/index.js';
import type { Role } from '../models/user.model.js';

export interface Actor {
  id: string;
  role: Role;
  technicianId: string | null;
}

export function assertCanChangeStatus(actor: Actor, isAssignedToRequest: boolean): void {
  if (actor.role === 'technician' && !isAssignedToRequest) {
    throw new ForbiddenError('Менять статус можно только у заявок, в бригаде которых вы состоите');
  }
}
