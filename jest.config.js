/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['@swc/jest', { module: { type: 'es6' } }],
  },
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  // Тесты делят одну реальную тестовую БД (не in-memory) — файлы гоняются
  // последовательно, чтобы очистка таблиц в одном файле не задевала другой.
  maxWorkers: 1,
  testTimeout: 15000,
};
