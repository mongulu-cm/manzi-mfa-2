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
