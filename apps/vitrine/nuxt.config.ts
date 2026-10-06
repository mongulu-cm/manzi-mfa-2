export default defineNuxtConfig({
  extends: ['../../layers/mongulu'],
  modules: ['@nuxt/eslint'],
  $test: { devtools: { enabled: false } },
  ssr: true,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Manzi-mfa — Collectif Mongulu',
      meta: [{ name: 'description', content: 'Le pont vers l\'emploi dans l\'IT grâce à un échange d\'une heure avec un senior.' }],
    },
  },
  css: ['~/assets/css/vitrine.css'],
  runtimeConfig: {
    public: { appUrl: 'https://app.manzi-mfa-2.mongulu.cm' },
  },
  compatibilityDate: '2026-10-01',
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: { deployConfig: true, nodeCompat: true },
  },
  eslint: { config: { stylistic: true } },
})
