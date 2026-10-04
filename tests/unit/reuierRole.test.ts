import { jest } from '@jest/globals';
import type { Request, Response } from 'express';
import { requireRole } from '../../src/middlewares/requireRole.js';
import { ForbiddenError, UnauthorizedError } from '../../src/errors/index.js';

function mockReq(user?: { id: string; role: 'viewer' | 'technician' | 'admin' }): Request {
  return { user: user ? { ...user, technicianId: null } : undefined } as Request;
}

describe('requireRole middleware (unit, RBAC)', () => {
  it('calls next() without error when the role is allowed', () => {
    const next = jest.fn();
    requireRole('admin', 'technician')(
      mockReq({ id: 'u1', role: 'technician' }),
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(UnauthorizedError) when req.user is missing', () => {
    const next = jest.fn();
    requireRole('admin')(mockReq(undefined), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('calls next(ForbiddenError) when the role is not allowed', () => {
    const next = jest.fn();
    requireRole('admin')(mockReq({ id: 'u1', role: 'viewer' }), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
