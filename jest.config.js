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
};
