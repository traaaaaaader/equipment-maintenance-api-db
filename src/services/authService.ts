import { userRepository } from '../repositories/userRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { ConflictError, UnauthorizedError } from '../errors/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshTokenUnsafe,
  hashRefreshToken,
} from './tokenService.js';
import type { User } from '../models/user.model.js';

export interface RequestMeta {
  userAgent?: string | null;
  ip?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

const GENERIC_LOGIN_ERROR = 'Неверные учётные данные';

export class AuthService {
  async register(data: { email: string; name: string; password: string }): Promise<User> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Пользователь с таким email уже зарегистрирован', [
        { field: 'email', message: 'Значение должно быть уникальным' },
      ]);
    }

    const passwordHash = await hashPassword(data.password);
    return userRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
      role: 'viewer',
    });
  }

  async login(
    data: { email: string; password: string },
    meta: RequestMeta,
  ): Promise<{ user: User } & AuthTokens> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) throw new UnauthorizedError(GENERIC_LOGIN_ERROR);

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError(GENERIC_LOGIN_ERROR);

    const tokens = await this.issueTokens(user, meta);
    const { passwordHash: _ignored, ...publicUser } = user;
    return { user: publicUser, ...tokens };
  }

  async refresh(rawToken: string, meta: RequestMeta): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw new UnauthorizedError('Недействительный refresh-токен');
    }

    const tokenHash = hashRefreshToken(rawToken);
    const stored = await refreshTokenRepository.findActiveByHash(tokenHash);

    if (!stored) {
      const decoded = decodeRefreshTokenUnsafe(rawToken);
      if (decoded?.sub) await refreshTokenRepository.revokeAllForUser(decoded.sub);
      throw new UnauthorizedError('Недействительный refresh-токен');
    }

    await refreshTokenRepository.revokeByHash(tokenHash);

    const user = await userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedError('Пользователь не найден');

    return this.issueTokens(user, meta);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashRefreshToken(rawToken);
    await refreshTokenRepository.revokeByHash(tokenHash);
  }

  async me(userId: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('Пользователь не найден');
    return user;
  }

  private async issueTokens(user: User, meta: RequestMeta): Promise<AuthTokens> {
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      technicianId: user.technicianId,
    });
    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    });

    return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
  }
}

export const authService = new AuthService();
