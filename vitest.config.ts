import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { STATIC_PORT } from './tests/a11y/serve-static.setup'

// Source unique du port : le test a11y lit la même constante.
// Sans STORYBOOK_URL, tout pointe vers le statique servi par le globalSetup.
// Pour viser le dev live : STORYBOOK_URL=http://127.0.0.1:6006.
const STORYBOOK_URL = process.env.STORYBOOK_URL ?? `http://127.0.0.1:${STATIC_PORT}`

export default defineConfig({
  test: {
    // Serveur statique partagé (démarré une fois) : le projet storybook
    // ne dépend plus d'un serveur démarré par un autre projet.
    globalSetup: ['./tests/a11y/serve-static.setup.ts'],
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
        },
      },
    ],
  },
})
