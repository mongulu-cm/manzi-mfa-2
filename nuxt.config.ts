export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/storybook', '@nuxt/ui'],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Manzi-mfa — Collectif Mongulu',
      meta: [{ name: 'description', content: 'Le pont vers l\'emploi dans l\'IT grâce à un échange d\'une heure avec un senior.' }],
    },
  },
  css: [
    '@fontsource/alegreya/700.css',
    '@fontsource/hanken-grotesk/400.css',
    '@fontsource/hanken-grotesk/600.css',
    '~/assets/css/main.css',
  ],
  compatibilityDate: '2026-10-01',
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
  typescript: { strict: true },
  eslint: { config: { stylistic: true } },
})
