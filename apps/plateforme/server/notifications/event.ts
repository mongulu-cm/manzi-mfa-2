export const QUICK_CHAT_EVENT_TYPES = ['quick_chat.created', 'quick_chat.updated'] as const
export const PARTICIPANT_ROLES = ['mentor', 'mentee'] as const

export type QuickChatEventType = typeof QUICK_CHAT_EVENT_TYPES[number]
export type ParticipantRole = typeof PARTICIPANT_ROLES[number]

export interface QuickChatParticipant {
  userId: string
  displayName: string | null
  // Lu côté serveur depuis Supabase Auth par l'appelant, jamais fourni par le navigateur.
  email: string
}

export interface QuickChatEvent {
  type: QuickChatEventType
  quickChatId: string
  version: number
  startsAt: string
  durationMinutes: number
  previousStartsAt?: string
  mentor: QuickChatParticipant
  mentee: QuickChatParticipant
}

export type NotificationErrorCode
  = | 'invalid_event'
    | 'config_invalid'
    | 'config_missing'
    | 'journal_unavailable'
    | 'provider_rejected'
    | 'provider_unavailable'
    | 'provider_timeout'
    | 'provider_uncertain'

// Message générique : aucune valeur d'entrée (adresse, nom, réponse du fournisseur) n'y figure.
export class NotificationError extends Error {
  readonly code: NotificationErrorCode
  readonly providerCode?: string

  constructor(code: NotificationErrorCode, providerCode?: string) {
    super(`Notification failed: ${code}`)
    this.name = 'NotificationError'
    this.code = code
    this.providerCode = providerCode
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})$/
// Volontairement strict : ni espace, ni chevron, ni virgule, ni point en tête, en fin ou doublé,
// ce qui écarte toute injection d'en-tête.
const EMAIL = /^[^\s@<>,;".]+(?:\.[^\s@<>,;".]+)*@[^\s@<>,;".]+(?:\.[^\s@<>,;".]+)+$/
// eslint-disable-next-line no-control-regex -- les caractères de contrôle sont précisément ce qui est refusé.
const CONTROL = /[\u0000-\u001F\u007F]/

function invalid(): never {
  throw new NotificationError('invalid_event')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function timestamp(value: unknown): string {
  if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value) || Number.isNaN(Date.parse(value))) invalid()
  // Date.parse reporte un jour inexistant (31 février → 3 mars) au lieu de le refuser.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number) as [number, number, number]
  if (new Date(Date.UTC(year, month - 1, day)).getUTCDate() !== day) invalid()
  return value
}

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) invalid()
  return value.toLowerCase()
}

function emailAddress(value: unknown): string {
  if (typeof value !== 'string' || value.length > 254 || CONTROL.test(value) || !EMAIL.test(value)) invalid()
  return value
}

function displayName(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || value.length > 200 || CONTROL.test(value)) invalid()
  return value.trim() || null
}

function participant(value: unknown): QuickChatParticipant {
  if (!isRecord(value)) invalid()
  return { userId: uuid(value.userId), displayName: displayName(value.displayName), email: emailAddress(value.email) }
}

export function validateQuickChatEvent(input: unknown): QuickChatEvent {
  if (!isRecord(input)) invalid()
  const { type, version, durationMinutes, previousStartsAt } = input
  if (!QUICK_CHAT_EVENT_TYPES.includes(type as QuickChatEventType)) invalid()
  const quickChatId = uuid(input.quickChatId)
  if (!Number.isInteger(version) || (version as number) < 1) invalid()
  if (!Number.isInteger(durationMinutes) || (durationMinutes as number) < 15 || (durationMinutes as number) > 30) invalid()
  if (previousStartsAt !== undefined && type !== 'quick_chat.updated') invalid()
  const mentor = participant(input.mentor)
  const mentee = participant(input.mentee)
  if (mentor.userId === mentee.userId || mentor.email.toLowerCase() === mentee.email.toLowerCase()) invalid()
  return {
    type: type as QuickChatEventType,
    quickChatId,
    version: version as number,
    startsAt: timestamp(input.startsAt),
    durationMinutes: durationMinutes as number,
    ...(previousStartsAt === undefined ? {} : { previousStartsAt: timestamp(previousStartsAt) }),
    mentor,
    mentee,
  }
}
