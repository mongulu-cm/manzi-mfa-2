export default defineNuxtConfig({
  extends: ['../../layers/mongulu'],
  modules: ['@nuxt/eslint'],
  $test: { devtools: { enabled: false } },
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Espace connecté — Manzi-mfa',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://manzi-mfa-2.mongulu.cm',
      supabaseUrl: '',
      supabasePublishableKey: '',
    },
  },
  routeRules: { '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' } } },
  compatibilityDate: '2026-10-01',
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: { deployConfig: true, nodeCompat: true },
  },
  eslint: { config: { stylistic: true } },
})
