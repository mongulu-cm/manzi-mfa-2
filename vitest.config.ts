import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

// STORYBOOK_URL pointe vers le build statique servi (CI) ou le dev (:6006).
// STORYBOOK_URL pointe vers le dev (:6006) ou le statique servi par
// tests/a11y/serve-static.setup.ts (:6007, utilisé en CI).
const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          storybookTest({ storybookUrl: STORYBOOK_URL }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
      {
        test: {
          name: 'a11y',
          include: ['tests/a11y/**/*.test.ts'],
          globalSetup: ['./tests/a11y/serve-static.setup.ts'],
        },
      },
    ],
  },
})
