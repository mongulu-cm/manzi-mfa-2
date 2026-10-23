import { defineConfig } from 'vitest/config'

// Smoke opt-in avec envoi réel (npm run test:email), hors CI.
export default defineConfig({
  test: {
    include: ['tests/smoke/**/*.smoke.ts'],
    environment: 'node',
    // Quatre envois séquentiels (délai de 10 s chacun au plus) puis le rejeu.
    testTimeout: 60_000,
  },
})
