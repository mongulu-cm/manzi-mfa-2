import { defineConfig } from 'vitest/config'

// Smoke opt-in avec envoi réel (npm run test:email), hors CI.
export default defineConfig({
  test: {
    include: ['tests/smoke/**/*.smoke.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
})
