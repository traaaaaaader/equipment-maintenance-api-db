import { isTransitionAllowed } from '../../src/services/requestStatusTransitions.js';

describe('isTransitionAllowed (unit)', () => {
  it.each([
    ['new', 'in_progress', true],
    ['new', 'rejected', true],
    ['in_progress', 'done', true],
    ['in_progress', 'rejected', true],
  ] as const)('allows %s -> %s', (from, to, expected) => {
    expect(isTransitionAllowed(from, to)).toBe(expected);
  });

  it.each([
    ['new', 'done'],
    ['done', 'in_progress'],
    ['done', 'rejected'],
    ['rejected', 'new'],
    ['rejected', 'in_progress'],
    ['in_progress', 'new'],
  ] as const)('forbids %s -> %s', (from, to) => {
    expect(isTransitionAllowed(from, to)).toBe(false);
  });

  it('treats done and rejected as terminal: no outgoing transitions at all', () => {
    const statuses = ['new', 'in_progress', 'done', 'rejected'] as const;
    for (const to of statuses) {
      expect(isTransitionAllowed('done', to)).toBe(false);
      expect(isTransitionAllowed('rejected', to)).toBe(false);
    }
  });
});
