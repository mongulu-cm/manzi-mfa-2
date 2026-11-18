import type { AnalyticsEvent, AnalyticsIdentity } from '../../shared/utils/analytics'
import { analyticsEvents, exceptionProperties, safePage } from '../../shared/utils/analytics'

export interface AnalyticsClient {
  capture: (event: string, properties: Record<string, unknown>) => unknown
  identify: (id: string) => unknown
  register: (properties: { distinct_id: string, $device_id: string }) => unknown
  reset: (resetDeviceId: boolean) => unknown
  get_distinct_id: () => string
}

export function createAnalyticsService(options: {
  enabled: boolean
  surface: string
  environment: string
  origin: string
  consent: () => boolean
  identity: () => AnalyticsIdentity | undefined
  saveIdentity: (identity: AnalyticsIdentity | undefined) => void
  load: (identity?: AnalyticsIdentity) => Promise<AnalyticsClient>
}) {
  let client: AnalyticsClient | undefined
  let loading: Promise<void> | undefined
  let userId: string | null | undefined
  let page = '/'
  let lastPage: string | undefined
  let activeIdentity: AnalyticsIdentity | undefined

  function allowed() {
    return options.enabled && options.consent()
  }
  function save() {
    if (client) {
      activeIdentity = { id: client.get_distinct_id(), identified: Boolean(userId) }
      options.saveIdentity(activeIdentity)
    }
  }
  function synchronize() {
    if (!client) return
    const shared = options.identity()
    if (shared?.id !== activeIdentity?.id) {
      // Un autre onglet a changé de compte ou s'est déconnecté : ne jamais fusionner deux comptes.
      client.reset(true)
      if (shared?.identified) client.identify(shared.id)
      else if (shared) client.register({ distinct_id: shared.id, $device_id: shared.id })
      activeIdentity = shared
      // Un onglet plateforme obsolète ne doit pas réidentifier l'ancien compte.
      userId = undefined
    }
  }
  function emit(event: string, properties: Record<string, unknown> = {}) {
    try {
      if (!allowed() || !client) return
      synchronize()
      client.capture(event, {
        ...properties, surface: options.surface, environment: options.environment,
        schema_version: 1, runtime: 'browser',
        $current_url: `${options.origin}${page}`, $pathname: page,
      })
    }
    catch { /* L'instrumentation ne bloque jamais l'interface. */ }
  }
  function identify() {
    if (!client || userId === undefined) return
    if (userId === null) {
      if (activeIdentity?.identified) client.reset(true)
    }
    else if (client.get_distinct_id() !== userId) {
      if (activeIdentity?.identified) client.reset(true)
      client.identify(userId)
    }
    save()
  }
  async function start() {
    if (!allowed()) return
    if (client) return
    loading ??= (async () => {
      try {
        activeIdentity = options.identity()
        const loaded = await options.load(activeIdentity)
        if (!allowed()) return
        client = loaded
        if (userId !== undefined) identify()
        else if (!activeIdentity) save()
        pageview(page)
      }
      catch { /* Réseau indisponible, bloqueur ou stockage refusé : parcours inchangé. */ }
      finally { loading = undefined }
    })()
    await loading
  }
  function pageview(path: string) {
    page = safePage(path)
    if (!allowed() || !client || lastPage === page) return
    lastPage = page
    emit('$pageview')
  }
  return {
    start,
    pageview,
    track(event: AnalyticsEvent) {
      if (Object.hasOwn(analyticsEvents, event)) emit(event)
    },
    identify(id: string | null) {
      userId = id
      try {
        if (allowed()) identify()
      }
      catch { /* La connexion reste indépendante de PostHog. */ }
    },
    exception(error: unknown) {
      try {
        emit('$exception', exceptionProperties(error))
      }
      catch { /* Ne jamais signaler récursivement une erreur d'instrumentation. */ }
    },
    revoke() {
      try {
        client?.reset(true)
      }
      catch { /* Le nettoyage local continue même si le SDK échoue. */ }
      client = undefined
      activeIdentity = undefined
      lastPage = undefined
      try {
        options.saveIdentity(undefined)
      }
      catch { /* Stockage indisponible. */ }
    },
  }
}
