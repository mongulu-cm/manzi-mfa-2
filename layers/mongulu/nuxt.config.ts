import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  $meta: { name: 'mongulu' },
  app: { head: { htmlAttrs: { lang: 'fr' } } },
  css: [
    '@fontsource/alegreya/700.css',
    '@fontsource/hanken-grotesk/400.css',
    '@fontsource/hanken-grotesk/600.css',
    fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url)),
  ],
  colorMode: { preference: 'light', fallback: 'light' },
  // Fontsource fournit déjà les polices locales, sans requête à un fournisseur.
  ui: { fonts: false },
  nitro: {
    publicAssets: [{ dir: fileURLToPath(new URL('./public', import.meta.url)), baseURL: '/' }],
  },
  typescript: { strict: true },
})
