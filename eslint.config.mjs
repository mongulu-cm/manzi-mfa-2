import withNuxt from './apps/vitrine/.nuxt/eslint.config.mjs'

export default withNuxt(
  // Les noms de fichiers des routes et layouts sont imposés par Nuxt.
  {
    files: ['apps/*/app/pages/**/*.vue', 'apps/*/app/layouts/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  { ignores: ['**/.nuxt/**', '**/.output/**', '**/.wrangler/**', 'storybook-static/**'] },
)
