import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins'
import { sentryPrivacyOptions } from './privacy'

export default defineNitroPlugin(sentryCloudflareNitroPlugin(() => {
  const { app, ...config } = useRuntimeConfig().public.sentry
  return {
    ...config,
    ...sentryPrivacyOptions(),
    enabled: Boolean(config.dsn),
    initialScope: { tags: { app, runtime: 'cloudflare' } },
    tracesSampleRate: 0,
    tracePropagationTargets: [/^https:\/\/(?:app\.)?manzi-mfa-2\.mongulu\.cm\//],
  }
}))
