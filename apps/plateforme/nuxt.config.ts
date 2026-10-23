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
    // Serveur uniquement : notifications Quick Chat (F-008), lues au point d'appel de F-007.
    notifications: {
      provider: 'log',
      // Origine des liens envoyés par email : configurée, jamais déduite de la requête (en-tête Host).
      appUrl: 'https://app.manzi-mfa-2.mongulu.cm',
      fromEmail: '',
      fromName: 'Manzi-mfa',
      replyTo: 'collectif@mongulu.cm',
      timeZone: 'Africa/Douala',
      policy: '',
    },
    // Secret Cloudflare, transmis à createAdminClient pour le journal des envois.
    supabaseSecretKey: '',
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
