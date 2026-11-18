import { join } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import { SentryCli } from '@sentry/cli'

// SDK 11.14's uploader rewrites already-instrumented bundles in temporary files,
// shifting their source locations without changing the deployed JavaScript.
// Keep the SDK's debug IDs, and upload exact artifacts with the Rust CLI.
export default defineNuxtModule({
  meta: { name: 'manzi-sentry-source-maps' },
  setup(_options, nuxt) {
    if (nuxt.options.dev || nuxt.options._prepare) return
    if (!process.env.SENTRY_AUTH_TOKEN) {
      console.info('[Sentry] No build token: source-map upload skipped.')
      return
    }
    const cli = new SentryCli(null, {
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'mongulu',
      project: 'manzi-mfa-2',
    })
    const release = nuxt.options.runtimeConfig.public.sentry.release
    const upload = async (directory: string) => {
      await cli.execute(['sourcemaps', 'upload', '--no-rewrite', '--wait', '--strict', ...(release ? ['--release', release] : []), directory], false)
      console.info('[Sentry] Uploaded exact build source maps.')
    }
    nuxt.hooks.hookOnce('vite:compiled', () => upload(join(nuxt.options.buildDir, 'dist/client')))
    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('compiled', () => upload(nitro.options.output.serverDir))
    })
  },
})
