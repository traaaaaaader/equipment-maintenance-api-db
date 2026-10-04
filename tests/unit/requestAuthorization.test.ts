import { assertCanChangeStatus } from '../../src/services/requestAuthorization.js';
import { ForbiddenError } from '../../src/errors/index.js';

describe('assertCanChangeStatus (unit, ABAC)', () => {
  it('allows admin regardless of the isAssigned flag', () => {
    expect(() =>
      assertCanChangeStatus({ id: 'admin-1', role: 'admin', technicianId: null }, false),
    ).not.toThrow();
  });

  it('allows technician when isAssigned is true (member of the brigade)', () => {
    expect(() =>
      assertCanChangeStatus({ id: 'tech-1', role: 'technician', technicianId: 'tech-row-1' }, true),
    ).not.toThrow();
  });

  it('forbids technician when isAssigned is false (not in this request brigade)', () => {
    expect(() =>
      assertCanChangeStatus(
        { id: 'tech-1', role: 'technician', technicianId: 'tech-row-1' },
        false,
      ),
    ).toThrow(ForbiddenError);
  });

  it('forbids technician with no linked technicianId at all', () => {
    expect(() =>
      assertCanChangeStatus({ id: 'tech-1', role: 'technician', technicianId: null }, false),
    ).toThrow(ForbiddenError);
  });
});
