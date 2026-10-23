import type { SupabaseClient } from '@supabase/supabase-js'
import { NotificationError } from './event'
import type { NotificationErrorCode, QuickChatEvent } from './event'
import type { PlannedNotification } from './policy'

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'uncertain'

export type Reservation
  = | { decision: 'send', attempt: number }
    | { decision: 'duplicate' | 'in_progress' | 'uncertain' }

// Codes acceptés par la colonne last_error_code (contrainte CHECK).
export type DeliveryErrorCode = Extract<NotificationErrorCode,
  'journal_unavailable' | 'provider_rejected' | 'provider_unavailable' | 'provider_timeout' | 'provider_uncertain'>

// Une fin d'envoi ne s'applique qu'à la tentative réservée : une tentative plus ancienne et
// attardée ne peut pas écraser l'état d'une tentative suivante.
export interface DeliveryAttempt {
  idempotencyKey: string
  attempt: number
}

export interface DeliveryJournal {
  reserve(planned: PlannedNotification, event: QuickChatEvent, now: Date): Promise<Reservation>
  markSent(delivery: DeliveryAttempt, providerMessageId: string): Promise<void>
  markFailed(delivery: DeliveryAttempt, errorCode: DeliveryErrorCode, providerCode?: string): Promise<void>
  markUncertain(delivery: DeliveryAttempt, errorCode: DeliveryErrorCode): Promise<void>
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
    async markSent(delivery, providerMessageId) {
      update(delivery, { status: 'sent', providerMessageId, lastErrorCode: undefined, lastProviderCode: undefined })
    },
    async markFailed(delivery, errorCode, providerCode) {
      update(delivery, { status: 'failed', lastErrorCode: errorCode, lastProviderCode: providerCode })
    },
    async markUncertain(delivery, errorCode) {
      update(delivery, { status: 'uncertain', lastErrorCode: errorCode, lastProviderCode: undefined })
    },
  }

  function available() {
    if (journal.unavailable) throw new NotificationError('journal_unavailable')
  }

  function update({ idempotencyKey, attempt }: DeliveryAttempt, changes: Partial<DeliveryRow>) {
    available()
    const row = rows.get(idempotencyKey)
    if (row?.attempts !== attempt) throw new NotificationError('journal_unavailable')
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

  async function finish(delivery: DeliveryAttempt, status: DeliveryStatus, values: Record<string, string | undefined> = {}) {
    const updated = await call('finish_notification_delivery', {
      p_idempotency_key: delivery.idempotencyKey,
      p_attempt: delivery.attempt,
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
    markSent: (delivery, providerMessageId) => finish(delivery, 'sent', { providerMessageId }),
    markFailed: (delivery, errorCode, providerCode) => finish(delivery, 'failed', { errorCode, providerCode }),
    markUncertain: (delivery, errorCode) => finish(delivery, 'uncertain', { errorCode }),
  }
}
