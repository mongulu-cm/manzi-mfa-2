import { getCookie } from 'h3'
import { consentCookie, identityCookie, parseIdentity, exceptionProperties } from '../../shared/utils/analytics'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    // Sans requête consentie, les journaux Cloudflare restent le diagnostic serveur.
    if (!event || getCookie(event, consentCookie) !== 'accepted') return
    const config = useRuntimeConfig(event).public
    const identity = parseIdentity(getCookie(event, identityCookie))
    if (!config.posthogKey || !identity) return
    const report = async () => {
      try {
        // API de collecte compatible Workers ; aucun état partagé entre requêtes.
        await $fetch(`${config.posthogHost}/i/v0/e/`, {
          method: 'POST', timeout: 3000, retry: 0,
          body: {
            api_key: config.posthogKey, distinct_id: identity.id, event: '$exception',
            properties: {
              ...exceptionProperties(error, 'server'), $process_person_profile: identity.identified,
              $geoip_disable: true,
              surface: config.analyticsSurface, environment: config.analyticsEnvironment,
              schema_version: 1, runtime: 'server',
            },
          },
        })
      }
      catch { /* Ne jamais remplacer l'erreur applicative par une erreur PostHog. */ }
    }
    event.waitUntil(report())
  })
})
