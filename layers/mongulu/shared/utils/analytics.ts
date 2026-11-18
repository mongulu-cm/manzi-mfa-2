import type { CaptureResult } from 'posthog-js'
import { exceptionFrames } from './analytics-stack'

// Ce catalogue est le contrat commun : aucune propriété libre ni contenu utilisateur.
export const analyticsEvents = {
  'auth.login_started': [],
  'auth.login_succeeded': [],
  'auth.login_failed': [],
  'auth.logout_succeeded': [],
  'profile.viewed': [],
  'profile.load_failed': [],
  'matching.started': [],
  'matching.completed': [],
  'booking.started': [],
  'booking.completed': [],
  'booking.failed': [],
  'job_board.viewed': [],
  'job_board.application_started': [],
} as const
export type AnalyticsEvent = keyof typeof analyticsEvents

export const consentCookie = 'manzi_analytics_consent_v2'
export const identityCookie = 'manzi_analytics_identity_v1'
export const cookieMaxAge = 60 * 60 * 24 * 180

export function safePage(path: string) {
  const pathname = path.split(/[?#]/)[0]
  return ['/', '/login', '/auth/callback', '/confidentialite', '/ressources'].includes(pathname ?? '') ? pathname! : '/other'
}

export function cookieDomain(host: string, configured: string) {
  const domain = configured.replace(/^\./, '')
  return domain && (host === domain || host === `app.${domain}`) ? domain : undefined
}

export interface AnalyticsIdentity { id: string, identified: boolean }
export interface AnalyticsPerson { email?: string, name?: string, first_name?: string, last_name?: string }

export function analyticsPerson(value: unknown): AnalyticsPerson {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value).filter(([key, item]) =>
    ['email', 'name', 'first_name', 'last_name'].includes(key)
    && typeof item === 'string' && item.trim().length > 0 && item.length <= 254,
  ))
}

export function analyticsEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
export function parseIdentity(value: unknown): AnalyticsIdentity | undefined {
  if (typeof value !== 'string') return
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed.identified !== 'boolean') return
    if (parsed.identified ? analyticsEmail(parsed.id) : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id)) {
      return { id: parsed.id, identified: parsed.identified }
    }
  }
  catch { /* Cookie absent, ancien ou invalide. */ }
}

// Garder les emplacements du code, jamais le message, les causes, les variables ou l'URL de requête.
export function exceptionProperties(error: unknown, runtime: 'browser' | 'server' = 'browser') {
  const type = error instanceof Error && ['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError'].includes(error.name) ? error.name : 'Error'
  const frames = error instanceof Error ? exceptionFrames(error.stack ?? '', runtime) : []
  return {
    $exception_list: [{ type, value: 'Unexpected application error', mechanism: { type: 'generic', handled: false }, stacktrace: { type: 'raw', frames } }],
    $exception_level: 'error',
  }
}

// Liste fermée également appliquée aux propriétés ajoutées automatiquement par le SDK.
export function filterProperties(properties: Record<string, unknown>) {
  const keys = ['distinct_id', '$anon_distinct_id', '$device_id', '$user_id', '$is_identified', '$session_id', '$window_id', '$lib', '$lib_version', '$browser', '$browser_version', '$os', '$os_version', '$device_type', '$screen_height', '$screen_width', '$viewport_height', '$viewport_width', '$current_url', '$pathname', '$host', '$exception_list', '$exception_level', '$process_person_profile', 'surface', 'environment', 'schema_version', 'runtime']
  const result = Object.fromEntries(Object.entries(properties).filter(([key]) => keys.includes(key)))
  if (typeof result.$current_url === 'string') {
    try {
      const url = new URL(result.$current_url)
      result.$current_url = `${url.origin}${safePage(url.pathname)}`
    }
    catch { delete result.$current_url }
  }
  if (typeof result.$pathname === 'string') result.$pathname = safePage(result.$pathname)
  return result
}

export function sanitizeCapture(event: CaptureResult | null, context: { token: string, surface: string, environment: string }): CaptureResult | null {
  if (!event) return null
  if (!['$pageview', '$identify', '$set', '$exception', ...Object.keys(analyticsEvents)].includes(event.event)) return null
  const person = analyticsPerson(event.$set ?? event.properties.$set)
  const identified = analyticsEmail(event.properties.distinct_id)
  if (event.event === '$set' && (!identified || !Object.keys(person).length)) return null
  delete event.$set
  delete event.$set_once
  event.properties = {
    ...filterProperties(event.properties), ...context,
    schema_version: 1, runtime: 'browser', $geoip_disable: true, $ip: null,
    $process_person_profile: event.event === '$identify' || event.properties.$is_identified === true,
  }
  if (identified && ['$identify', '$set'].includes(event.event)) event.$set = person
  return event
}
