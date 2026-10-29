export default defineNuxtConfig({
  extends: ['../../layers/mongulu'],
  modules: ['@nuxt/eslint', '@vite-pwa/nuxt'],
  $test: { devtools: { enabled: false } },
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Espace connecté — Manzi-mfa',
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'theme-color', content: '#576F1F' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Manzi-mfa' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
        { rel: 'apple-touch-icon', href: '/logo.png' },
      ],
    },
  },
  runtimeConfig: {
    // Serveur uniquement : notifications Quick Chat (F-008), lues au point d'appel de F-007.
    notifications: {
      provider: 'log',
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
  routeRules: {
    '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' } },
    '/sw.js': { headers: { 'Cache-Control': 'no-cache' } },
    '/manifest.webmanifest': { headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/manifest+json' } },
  },
  compatibilityDate: '2026-10-01',
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: { deployConfig: true, nodeCompat: true },
  },
  eslint: { config: { stylistic: true } },
  pwa: {
    // Une mise à jour attend la fermeture des onglets, sans interrompre OAuth.
    registerType: 'prompt',
    manifest: {
      id: '/',
      name: 'Manzi-mfa — Collectif Mongulu',
      short_name: 'Manzi-mfa',
      description: 'Votre espace de mentorat avec les professionnels de la tech.',
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#F5F1E8',
      theme_color: '#576F1F',
      // Réutiliser le logo original, à sa taille réelle, sans le redessiner.
      icons: [{ src: '/logo.png', sizes: '2048x2048', type: 'image/png', purpose: 'any' }],
    },
    workbox: {
      // Seule la page de repli et l'identité publique sont conservées hors ligne.
      globPatterns: ['offline.html', 'logo.png'],
      // Éviter la réécriture HTML → route de Nuxt et toute ressource ajoutée implicitement.
      manifestTransforms: [entries => ({
        manifest: entries.filter(entry => ['offline.html', 'logo.png', 'manifest.webmanifest'].includes(entry.url)),
        warnings: [],
      })],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      runtimeCaching: [{
        urlPattern: ({ request, url, sameOrigin }) => sameOrigin
          && request.mode === 'navigate'
          && !/^\/(?:api|auth)(?:\/|$)/.test(url.pathname),
        handler: 'NetworkOnly',
        options: { precacheFallback: { fallbackURL: '/offline.html' } },
      }],
    },
  },
})
