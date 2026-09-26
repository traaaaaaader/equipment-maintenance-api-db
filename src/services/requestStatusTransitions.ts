import type { RequestStatus } from '../models/request.model.js';

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

export function isTransitionAllowed(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
