import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Artefacts générés : jamais lintés.
  { ignores: ['storybook-static/**', '.output/**', '.wrangler/**'] },
)
