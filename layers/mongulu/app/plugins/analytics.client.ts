import { createAnalyticsService } from '../utils/analytics-service'
import { consentCookie, identityCookie, cookieDomain, cookieMaxAge, parseIdentity, sanitizeCapture } from '../../shared/utils/analytics'

export default defineNuxtPlugin({
  name: 'analytics',
  setup(nuxtApp) {
    const config = useRuntimeConfig().public
    const router = useRouter()
    const consent = useState<string>('analytics-consent', () => '')
    const domain = cookieDomain(location.hostname, config.analyticsCookieDomain)
    const cookieOptions = { path: '/', maxAge: cookieMaxAge, sameSite: 'lax' as const, secure: location.protocol === 'https:', domain }
    const read = (name: string) => {
      try {
        return decodeURIComponent(document.cookie.split('; ').find(item => item.startsWith(`${name}=`))?.slice(name.length + 1) ?? '')
      }
      catch {
        return ''
      }
    }
    const write = (name: string, value: string) => {
      document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${value ? cookieMaxAge : 0}; SameSite=Lax${cookieOptions.secure ? '; Secure' : ''}${domain ? `; Domain=${domain}` : ''}`
    }
    const allowed = () => read(consentCookie) === 'accepted'
    const analytics = createAnalyticsService({
      enabled: Boolean(config.posthogKey), surface: config.analyticsSurface,
      environment: config.analyticsEnvironment, origin: location.origin,
      consent: allowed,
      identity: () => parseIdentity(read(identityCookie)),
      saveIdentity: identity => write(identityCookie, identity ? JSON.stringify(identity) : ''),
      load: async (identity) => {
        const { PostHog } = await import('posthog-js/dist/module.no-external')
        const posthog = new PostHog()
        return posthog.init(config.posthogKey, {
          api_host: config.posthogHost, ui_host: 'https://eu.posthog.com',
          defaults: '2026-08-30', persistence: 'memory',
          opt_out_useragent_filter: ['test', 'validation'].includes(config.analyticsEnvironment),
          bootstrap: identity ? { distinctID: identity.id, isIdentifiedID: identity.identified } : {},
          autocapture: false, capture_pageview: false, capture_pageleave: false,
          capture_exceptions: false, capture_dead_clicks: false, capture_heatmaps: false,
          capture_performance: false, disable_session_recording: true,
          disable_surveys: true, disable_external_dependency_loading: true,
          advanced_disable_flags: true, advanced_disable_decide: true,
          save_referrer: false, save_campaign_params: false, ip: false,
          person_profiles: 'identified_only', request_batching: false, disable_compression: true,
          before_send: (event) => {
            if (!allowed()) return null
            return sanitizeCapture(event, {
              token: config.posthogKey,
              surface: config.analyticsSurface, environment: config.analyticsEnvironment,
            })
          },
        })!
      },
    })
    function refresh() {
      const choice = read(consentCookie)
      consent.value = choice
      if (choice === 'accepted') void analytics.start()
      else analytics.revoke()
    }
    const setConsent = (choice: 'accepted' | 'rejected') => {
      try {
        write(consentCookie, choice)
      }
      catch { /* Pas de persistance : aucun envoi. */ }
      refresh()
    }
    analytics.pageview(router.currentRoute.value.path)
    nuxtApp.hook('app:mounted', refresh)
    router.afterEach((to, _from, failure) => {
      if (!failure) analytics.pageview(to.path)
    })
    nuxtApp.hook('vue:error', error => analytics.exception(error))
    nuxtApp.hook('app:error', error => analytics.exception(error))
    const onError = (event: ErrorEvent) => analytics.exception(event.error)
    const onRejection = (event: PromiseRejectionEvent) => analytics.exception(event.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    if (import.meta.hot) import.meta.hot.dispose(() => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    })
    return { provide: { analytics, setAnalyticsConsent: setConsent } }
  },
})
