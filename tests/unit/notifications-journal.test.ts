import { describe, expect, it } from 'vitest'
import { PENDING_TTL_MS, createMemoryJournal, decideExisting } from '../../apps/plateforme/server/notifications/journal'
import { DEFAULT_POLICY, planNotifications } from '../../apps/plateforme/server/notifications/policy'
import { createdEvent } from '../fixtures/quick-chat-events'

const [planned] = planNotifications(createdEvent, DEFAULT_POLICY)
const start = new Date('2026-11-01T10:00:00Z')
const later = (ms: number) => new Date(start.getTime() + ms)

describe('décision sur une ligne existante', () => {
  it.each([
    ['sent', 0, 'duplicate'],
    ['uncertain', 0, 'uncertain'],
    ['failed', 0, 'retry'],
    ['pending', PENDING_TTL_MS - 1, 'in_progress'],
    ['pending', PENDING_TTL_MS, 'expire'],
  ] as const)('%s après %i ms → %s', (status, elapsed, expected) => {
    expect(decideExisting(status, start, later(elapsed))).toBe(expected)
  })
})

describe('journal en mémoire', () => {
  it('réserve un nouvel envoi sans aucune donnée de contact', async () => {
    const journal = createMemoryJournal(() => start)
    expect(await journal.reserve(planned!, createdEvent, start)).toEqual({ decision: 'send', attempt: 1 })
    const row = journal.rows.get(planned!.idempotencyKey)
    expect(row).toMatchObject({ status: 'pending', attempts: 1, recipientId: createdEvent.mentor.userId })
    expect(JSON.stringify(row)).not.toContain('@')
  })

  it('refuse le renvoi d’un email déjà parti', async () => {
    const journal = createMemoryJournal(() => start)
    await journal.reserve(planned!, createdEvent, start)
    await journal.markSent(planned!.idempotencyKey, 'cf-1')
    expect(await journal.reserve(planned!, createdEvent, later(1))).toEqual({ decision: 'duplicate' })
    expect(journal.rows.get(planned!.idempotencyKey)).toMatchObject({ status: 'sent', providerMessageId: 'cf-1' })
  })

  it('autorise une nouvelle tentative après un échec', async () => {
    const journal = createMemoryJournal(() => start)
    await journal.reserve(planned!, createdEvent, start)
    await journal.markFailed(planned!.idempotencyKey, 'provider_unavailable', 'E_RATE_LIMIT_EXCEEDED')
    expect(journal.rows.get(planned!.idempotencyKey)).toMatchObject({ lastErrorCode: 'provider_unavailable', lastProviderCode: 'E_RATE_LIMIT_EXCEEDED' })
    expect(await journal.reserve(planned!, createdEvent, later(1))).toEqual({ decision: 'send', attempt: 2 })
  })

  it('distingue un envoi en cours d’un envoi interrompu', async () => {
    const journal = createMemoryJournal(() => start)
    await journal.reserve(planned!, createdEvent, start)
    expect(await journal.reserve(planned!, createdEvent, later(1))).toEqual({ decision: 'in_progress' })
    expect(await journal.reserve(planned!, createdEvent, later(PENDING_TTL_MS))).toEqual({ decision: 'uncertain' })
    expect(journal.rows.get(planned!.idempotencyKey)?.status).toBe('uncertain')
    expect(await journal.reserve(planned!, createdEvent, later(2 * PENDING_TTL_MS))).toEqual({ decision: 'uncertain' })
  })

  it('marque une issue inconnue', async () => {
    const journal = createMemoryJournal()
    await journal.reserve(planned!, createdEvent, start)
    await journal.markUncertain(planned!.idempotencyKey, 'provider_timeout')
    expect(journal.rows.get(planned!.idempotencyKey)).toMatchObject({ status: 'uncertain', lastErrorCode: 'provider_timeout' })
  })

  it('signale un journal indisponible ou une ligne absente', async () => {
    const journal = createMemoryJournal()
    await expect(journal.markSent('inconnue', 'cf-1')).rejects.toMatchObject({ code: 'journal_unavailable' })
    journal.unavailable = true
    await expect(journal.reserve(planned!, createdEvent, start)).rejects.toMatchObject({ code: 'journal_unavailable' })
  })
})
