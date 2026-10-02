import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  parameters: {
    // Note : pas de `a11y.test` ici — l'audit addon crash au rendu en iframe
    // standalone. Le gate a11y est assuré par tests/a11y (axe sur chaque story).
  },
}

export default preview
