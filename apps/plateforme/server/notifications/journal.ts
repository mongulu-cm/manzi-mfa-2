import type { SupabaseClient } from '@supabase/supabase-js'
import { NotificationError } from './event'
import type { NotificationErrorCode, QuickChatEvent } from './event'
import type { PlannedNotification } from './policy'

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'uncertain'

export type Reservation
  = | { decision: 'send', attempt: number }
    | { decision: 'duplicate' | 'in_progress' | 'uncertain' }

export interface DeliveryJournal {
  reserve(planned: PlannedNotification, event: QuickChatEvent, now: Date): Promise<Reservation>
  markSent(idempotencyKey: string, providerMessageId: string): Promise<void>
  markFailed(idempotencyKey: string, errorCode: NotificationErrorCode, providerCode?: string): Promise<void>
  markUncertain(idempotencyKey: string, errorCode: NotificationErrorCode): Promise<void>
}

// Au-delà, une ligne pending ne correspond plus à un envoi en cours : son issue est inconnue.
export const PENDING_TTL_MS = 2 * 60_000

export type ExistingDecision = 'duplicate' | 'in_progress' | 'expire' | 'uncertain' | 'retry'

// Décision commune aux implémentations pour une ligne déjà présente (spec § 5.4).
export function decideExisting(status: DeliveryStatus, updatedAt: Date, now: Date): ExistingDecision {
  if (status === 'sent') return 'duplicate'
  if (status === 'uncertain') return 'uncertain'
  if (status === 'failed') return 'retry'
  return now.getTime() - updatedAt.getTime() < PENDING_TTL_MS ? 'in_progress' : 'expire'
}

interface DeliveryRow {
  quickChatId: string
  eventType: string
  recipientRole: string
  recipientId: string
  status: DeliveryStatus
  attempts: number
  providerMessageId?: string
  lastErrorCode?: string
  lastProviderCode?: string
  updatedAt: Date
}

export interface MemoryJournal extends DeliveryJournal {
  readonly rows: Map<string, DeliveryRow>
  // Simule une base injoignable : toute opération lève journal_unavailable.
  unavailable: boolean
}

export function createMemoryJournal(clock: () => Date = () => new Date()): MemoryJournal {
  const rows = new Map<string, DeliveryRow>()
  const journal: MemoryJournal = {
    rows,
    unavailable: false,
    async reserve(planned, event, now) {
      available()
      const row = rows.get(planned.idempotencyKey)
      if (!row) {
        rows.set(planned.idempotencyKey, {
          quickChatId: event.quickChatId, eventType: event.type, recipientRole: planned.role,
          recipientId: planned.recipient.userId, status: 'pending', attempts: 1, updatedAt: now,
        })
        return { decision: 'send', attempt: 1 }
      }
      const decision = decideExisting(row.status, row.updatedAt, now)
      if (decision === 'expire') {
        Object.assign(row, { status: 'uncertain', updatedAt: now })
        return { decision: 'uncertain' }
      }
      if (decision !== 'retry') return { decision }
      Object.assign(row, { status: 'pending', attempts: row.attempts + 1, updatedAt: now })
      return { decision: 'send', attempt: row.attempts }
    },
    async markSent(key, providerMessageId) {
      update(key, { status: 'sent', providerMessageId, lastErrorCode: undefined, lastProviderCode: undefined })
    },
    async markFailed(key, errorCode, providerCode) {
      update(key, { status: 'failed', lastErrorCode: errorCode, lastProviderCode: providerCode })
    },
    async markUncertain(key, errorCode) {
      update(key, { status: 'uncertain', lastErrorCode: errorCode })
    },
  }

  function available() {
    if (journal.unavailable) throw new NotificationError('journal_unavailable')
  }

  function update(key: string, changes: Partial<DeliveryRow>) {
    available()
    const row = rows.get(key)
    if (!row) throw new NotificationError('journal_unavailable')
    Object.assign(row, changes, { updatedAt: clock() })
  }

  return journal
}

const RESERVATIONS = new Set(['send', 'duplicate', 'in_progress', 'uncertain'])

// Client administrateur créé par l'appelant avec createAdminClient (@supabase/server, clé secret).
// Les fonctions SQL utilisent l'horloge de la base : le paramètre now n'y sert pas.
export function createSupabaseJournal(client: Pick<SupabaseClient, 'rpc'>): DeliveryJournal {
  async function call(fn: string, args: Record<string, unknown>): Promise<unknown> {
    try {
      const { data, error } = await client.rpc(fn, args)
      if (error) throw error
      return data
    }
    catch {
      // Le détail de l'erreur Supabase n'est pas propagé : il peut contenir des valeurs de la requête.
      throw new NotificationError('journal_unavailable')
    }
  }

  async function finish(key: string, status: DeliveryStatus, values: Record<string, string | undefined> = {}) {
    const updated = await call('finish_notification_delivery', {
      p_idempotency_key: key,
      p_status: status,
      p_provider_message_id: values.providerMessageId ?? null,
      p_error_code: values.errorCode ?? null,
      p_provider_code: values.providerCode ?? null,
    })
    if (updated !== true) throw new NotificationError('journal_unavailable')
  }

  return {
    async reserve(planned, event) {
      const rows = await call('reserve_notification_delivery', {
        p_idempotency_key: planned.idempotencyKey,
        p_quick_chat_id: event.quickChatId,
        p_event_type: event.type,
        p_recipient_role: planned.role,
        p_recipient_id: planned.recipient.userId,
        p_pending_ttl_seconds: PENDING_TTL_MS / 1000,
      })
      const row = Array.isArray(rows) ? rows[0] as { decision?: unknown, attempt?: unknown } | undefined : undefined
      if (!row || typeof row.decision !== 'string' || !RESERVATIONS.has(row.decision)) {
        throw new NotificationError('journal_unavailable')
      }
      if (row.decision !== 'send') return { decision: row.decision as 'duplicate' | 'in_progress' | 'uncertain' }
      if (!Number.isInteger(row.attempt)) throw new NotificationError('journal_unavailable')
      return { decision: 'send', attempt: row.attempt as number }
    },
    markSent: (key, providerMessageId) => finish(key, 'sent', { providerMessageId }),
    markFailed: (key, errorCode, providerCode) => finish(key, 'failed', { errorCode, providerCode }),
    markUncertain: (key, errorCode) => finish(key, 'uncertain', { errorCode }),
  }
}
