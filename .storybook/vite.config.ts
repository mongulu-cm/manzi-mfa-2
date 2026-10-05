import { fileURLToPath } from 'node:url'

// Le preset Storybook-Nuxt charge le projet depuis la racine Vite.
export default {
  root: fileURLToPath(new URL('../apps/vitrine', import.meta.url)),
}
