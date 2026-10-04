import type { Express } from 'express';

export interface TestApp {
  app: Express;
  cleanup: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGINS = 'http://localhost:3000';

  const { createApp } = await import('../../src/app.js');

  return { app: createApp(), cleanup: async () => {} };
}
