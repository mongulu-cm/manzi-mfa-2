import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  parameters: {
    // Les violations d'accessibilité font échouer les tests (CI).
    a11y: { test: 'error' },
  },
}

export default preview
