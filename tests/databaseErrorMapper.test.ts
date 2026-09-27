import { mapDatabaseError } from '../src/errors/databaseErrorMapper.js';

describe('mapDatabaseError', () => {
  it('maps unique_violation (23505) to 409 CONFLICT', () => {
    const result = mapDatabaseError({ parent: { code: '23505' } });
    expect(result).toEqual({ status: 409, code: 'CONFLICT', message: expect.any(String) });
  });

  it('maps foreign_key_violation (23503) to 422', () => {
    expect(mapDatabaseError({ original: { code: '23503' } })?.status).toBe(422);
  });

  it('maps not_null_violation (23502) to 400', () => {
    expect(mapDatabaseError({ parent: { code: '23502' } })?.status).toBe(400);
  });

  it('maps check_violation (23514) to 422', () => {
    expect(mapDatabaseError({ parent: { code: '23514' } })?.status).toBe(422);
  });

  it('maps serialization_failure (40001) and deadlock_detected (40P01) to 409', () => {
    expect(mapDatabaseError({ parent: { code: '40001' } })?.status).toBe(409);
    expect(mapDatabaseError({ parent: { code: '40P01' } })?.status).toBe(409);
  });

  it('falls back to a top-level .code when parent/original are absent (raw pg driver shape)', () => {
    expect(mapDatabaseError({ code: '23505' })?.status).toBe(409);
  });

  it('returns null for unrecognized SQLSTATE codes', () => {
    expect(mapDatabaseError({ parent: { code: '99999' } })).toBeNull();
  });

  it('returns null for non-database errors', () => {
    expect(mapDatabaseError(new Error('plain error'))).toBeNull();
    expect(mapDatabaseError(null)).toBeNull();
    expect(mapDatabaseError('a string')).toBeNull();
    expect(mapDatabaseError(undefined)).toBeNull();
  });

  it("does not confuse the app's own string error codes with a SQLSTATE", () => {
    expect(mapDatabaseError({ code: 'CONFLICT' })).toBeNull();
    expect(mapDatabaseError({ code: 'NOT_FOUND' })).toBeNull();
  });

  it('never leaks the raw database message — only status/code/message from the map', () => {
    const result = mapDatabaseError({
      parent: { code: '23505' },
      message: 'duplicate key value violates unique constraint "equipment_serial_number_key"',
    });
    expect(result?.message).not.toMatch(/constraint|equipment_serial_number_key/);
  });
});
