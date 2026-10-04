import type { CookieOptions, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { config } from '../config/index.js';
import type { LoginDto, RegisterDto } from '../validators/auth.schemas.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: config.jwt.refreshTtlMs,
  };
}

function meta(req: Request) {
  return { userAgent: req.get('user-agent') ?? null, ip: req.ip ?? null };
}

export async function register(req: Request, res: Response) {
  const body = req.valid.body as RegisterDto;
  const user = await authService.register(body);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response) {
  const body = req.valid.body as LoginDto;
  const { user, accessToken, refreshToken } = await authService.login(body, meta(req));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.json({ data: { user, accessToken } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Отсутствует refresh-cookie', requestId: req.id },
    });
    return;
  }

  const { accessToken, refreshToken } = await authService.refresh(token, meta(req));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.json({ data: { accessToken } });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.me(req.user!.id);
  res.json({ data: user });
}
