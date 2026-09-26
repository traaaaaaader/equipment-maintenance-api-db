import type { Express } from 'express';

export interface TestApp {
  app: Express;
  cleanup: () => Promise<void>;
}

export async function createTestApp(options: { apiKeys?: string } = {}): Promise<TestApp> {
  process.env.NODE_ENV = 'test';
  process.env.API_KEYS = options.apiKeys ?? '';
  process.env.CORS_ORIGINS = 'http://localhost:3000';

  const { createApp } = await import('../../src/app.js');

  return { app: createApp(), cleanup: async () => {} };
}
