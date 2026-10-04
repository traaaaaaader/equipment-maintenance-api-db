import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { Role } from '../models/user.model.js';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  technicianId: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: Math.floor(config.jwt.accessTtlMs / 1000),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload & jwt.JwtPayload;
}

export function signRefreshToken(userId: string): { token: string; jti: string; expiresAt: Date } {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + config.jwt.refreshTtlMs);
  const token = jwt.sign(
    { sub: userId, jti } satisfies RefreshTokenPayload,
    config.jwt.refreshSecret,
    {
      expiresIn: Math.floor(config.jwt.refreshTtlMs / 1000),
    },
  );
  return { token, jti, expiresAt };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload & jwt.JwtPayload;
}

export function decodeRefreshTokenUnsafe(token: string): RefreshTokenPayload | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) return null;
  return decoded as RefreshTokenPayload;
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
