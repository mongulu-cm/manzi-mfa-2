import * as Sentry from '@sentry/nuxt'
import { sentryPrivacyOptions } from './privacy'

const { app, ...config } = useRuntimeConfig().public.sentry

Sentry.init({
  ...config,
  ...sentryPrivacyOptions(),
  enabled: Boolean(config.dsn),
  initialScope: { tags: { app, runtime: 'browser' } },
  tracesSampleRate: 0,
  tracePropagationTargets: [/^\/(?!\/)/, /^https:\/\/(?:app\.)?manzi-mfa-2\.mongulu\.cm\//],
})
