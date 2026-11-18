import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const release = process.env.SENTRY_RELEASE || process.env.WORKERS_CI_COMMIT_SHA || (() => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  }
  catch {
    console.warn('[Sentry] No Git metadata: set SENTRY_RELEASE to identify this build.')
    return ''
  }
})()

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@sentry/nuxt/module'],
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
  runtimeConfig: {
    public: {
      posthogKey: '',
      posthogHost: 'https://eu.i.posthog.com',
      analyticsSurface: 'vitrine',
      analyticsEnvironment: 'unconfigured',
      analyticsCookieDomain: '',
      sentry: {
        dsn: '',
        environment: 'unconfigured',
        release,
        app: '',
      },
    },
  },
  sourcemap: { client: 'hidden', server: true },
  nitro: {
    sourceMap: true,
    // Preserve Nitro's debug IDs and source maps instead of bundling a second time.
    cloudflare: {
      wrangler: {
        no_bundle: true,
        find_additional_modules: true,
        rules: [{ type: 'ESModule', globs: ['**/*.mjs'] }],
      },
    },
    plugins: [fileURLToPath(new URL('./monitoring/sentry-nitro.ts', import.meta.url))],
    publicAssets: [{ dir: fileURLToPath(new URL('./public', import.meta.url)), baseURL: '/' }],
  },
  typescript: { strict: true },
  sentry: {
    org: 'mongulu',
    project: 'manzi-mfa-2',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    configDir: fileURLToPath(new URL('./monitoring', import.meta.url)),
    release: { name: release },
    telemetry: false,
    sourcemaps: { disable: 'disable-upload', filesToDeleteAfterUpload: [] },
  },
})
