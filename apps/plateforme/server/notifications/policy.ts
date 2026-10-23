import { NotificationError, PARTICIPANT_ROLES, QUICK_CHAT_EVENT_TYPES } from './event'
import type { ParticipantRole, QuickChatEvent, QuickChatEventType, QuickChatParticipant } from './event'

interface EventPolicy {
  enabled: boolean
  recipients: ParticipantRole[]
}

export interface NotificationPolicy {
  events: Record<QuickChatEventType, EventPolicy>
}

export interface PlannedNotification {
  role: ParticipantRole
  recipient: QuickChatParticipant
  idempotencyKey: string
}

export const DEFAULT_POLICY: Readonly<NotificationPolicy> = {
  events: {
    'quick_chat.created': { enabled: true, recipients: ['mentor', 'mentee'] },
    'quick_chat.updated': { enabled: true, recipients: ['mentor', 'mentee'] },
  },
}

function configInvalid(): never {
  throw new NotificationError('config_invalid')
}

function onlyKeys(value: unknown, keys: string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) configInvalid()
  if (Object.keys(value).some(key => !keys.includes(key))) configInvalid()
  return value as Record<string, unknown>
}

function eventPolicy(value: unknown): EventPolicy {
  const { enabled, recipients } = onlyKeys(value, ['enabled', 'recipients'])
  if (typeof enabled !== 'boolean' || !Array.isArray(recipients)) configInvalid()
  if (!recipients.every(role => PARTICIPANT_ROLES.includes(role))) configInvalid()
  return { enabled, recipients: [...new Set(recipients as ParticipantRole[])] }
}

// Vide : copie de la politique par défaut. Un événement absent garde sa valeur par défaut ;
// toute clé ou valeur inconnue, ou mal formée, est refusée plutôt qu'ignorée.
export function parsePolicy(raw: unknown): NotificationPolicy {
  if (raw === undefined || raw === null || raw === '') return structuredClone(DEFAULT_POLICY)
  let value = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    }
    catch {
      configInvalid()
    }
  }
  const events = onlyKeys(onlyKeys(value, ['events']).events, [...QUICK_CHAT_EVENT_TYPES])
  const policy = structuredClone(DEFAULT_POLICY) as NotificationPolicy
  for (const [type, entry] of Object.entries(events)) {
    policy.events[type as QuickChatEventType] = eventPolicy(entry)
  }
  return policy
}

export function idempotencyKey(event: QuickChatEvent, role: ParticipantRole): string {
  return `quick-chat:${event.quickChatId}:v${event.version}:${event.type}:${role}`
}

export function planNotifications(event: QuickChatEvent, policy: NotificationPolicy): PlannedNotification[] {
  const { enabled, recipients } = policy.events[event.type]
  if (!enabled) return []
  return recipients.map(role => ({ role, recipient: event[role], idempotencyKey: idempotencyKey(event, role) }))
}
