import { describe, expect, it, vi } from 'vitest'
import { PENDING_TTL_MS, createMemoryJournal, createSupabaseJournal, decideExisting } from '../../apps/plateforme/server/notifications/journal'
import { DEFAULT_POLICY, planNotifications } from '../../apps/plateforme/server/notifications/policy'
import { createdEvent } from '../fixtures/quick-chat-events'

const [planned] = planNotifications(createdEvent, DEFAULT_POLICY)
const attempt = (n: number) => ({ idempotencyKey: planned!.idempotencyKey, attempt: n })
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
    await journal.markSent(attempt(1), 'cf-1')
    expect(await journal.reserve(planned!, createdEvent, later(1))).toEqual({ decision: 'duplicate' })
    expect(journal.rows.get(planned!.idempotencyKey)).toMatchObject({ status: 'sent', providerMessageId: 'cf-1' })
  })

  it('autorise une nouvelle tentative après un échec', async () => {
    const journal = createMemoryJournal(() => start)
    await journal.reserve(planned!, createdEvent, start)
    await journal.markFailed(attempt(1), 'provider_unavailable', 'E_RATE_LIMIT_EXCEEDED')
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

  it('ignore la fin d’une tentative attardée', async () => {
    const journal = createMemoryJournal(() => start)
    await journal.reserve(planned!, createdEvent, start)
    await journal.markFailed(attempt(1), 'provider_unavailable')
    await journal.reserve(planned!, createdEvent, later(1))
    await expect(journal.markFailed(attempt(1), 'provider_unavailable')).rejects.toMatchObject({ code: 'journal_unavailable' })
    expect(journal.rows.get(planned!.idempotencyKey)).toMatchObject({ status: 'pending', attempts: 2 })
  })

  it('marque une issue inconnue', async () => {
    const journal = createMemoryJournal()
    await journal.reserve(planned!, createdEvent, start)
    await journal.markUncertain(attempt(1), 'provider_timeout')
    expect(journal.rows.get(planned!.idempotencyKey)).toMatchObject({ status: 'uncertain', lastErrorCode: 'provider_timeout' })
  })

  it('signale un journal indisponible ou une ligne absente', async () => {
    const journal = createMemoryJournal()
    await expect(journal.markSent({ idempotencyKey: 'inconnue', attempt: 1 }, 'cf-1')).rejects.toMatchObject({ code: 'journal_unavailable' })
    journal.unavailable = true
    await expect(journal.reserve(planned!, createdEvent, start)).rejects.toMatchObject({ code: 'journal_unavailable' })
  })
})

describe('journal Supabase', () => {
  type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown, error: unknown }>
  function client(...responses: Array<{ data: unknown, error?: unknown } | Error>) {
    const rpc = vi.fn<Rpc>(async () => {
      const next = responses.shift()!
      if (next instanceof Error) throw next
      return { data: next.data, error: next.error ?? null }
    })
    return { rpc, journal: createSupabaseJournal({ rpc } as unknown as Parameters<typeof createSupabaseJournal>[0]) }
  }

  it('réserve par la fonction SQL avec la clé, les identifiants et le délai d’expiration', async () => {
    const { rpc, journal } = client({ data: [{ decision: 'send', attempt: 1 }] })
    expect(await journal.reserve(planned!, createdEvent, start)).toEqual({ decision: 'send', attempt: 1 })
    expect(rpc).toHaveBeenCalledWith('reserve_notification_delivery', {
      p_idempotency_key: planned!.idempotencyKey,
      p_quick_chat_id: createdEvent.quickChatId,
      p_event_type: 'quick_chat.created',
      p_recipient_role: 'mentor',
      p_recipient_id: createdEvent.mentor.userId,
      p_pending_ttl_seconds: 120,
    })
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('@')
  })

  it.each(['duplicate', 'in_progress', 'uncertain'])('relaie la décision %s', async (decision) => {
    const { journal } = client({ data: [{ decision, attempt: null }] })
    expect(await journal.reserve(planned!, createdEvent, start)).toEqual({ decision })
  })

  it.each([
    ['une erreur Supabase', { data: null, error: { message: 'mentor@example.test' } }],
    ['une exception réseau', new Error('fetch failed')],
    ['une réponse vide', { data: [] }],
    ['une réponse non tableau', { data: { decision: 'send' } }],
    ['une décision inconnue', { data: [{ decision: 'maybe' }] }],
    ['une tentative absente', { data: [{ decision: 'send', attempt: null }] }],
  ])('traite %s comme un journal indisponible', async (_, response) => {
    const { journal } = client(response)
    const error = await journal.reserve(planned!, createdEvent, start).catch(caught => caught as Error)
    expect(error).toMatchObject({ code: 'journal_unavailable' })
    expect(JSON.stringify(error) + (error as Error).message).not.toContain('example.test')
  })

  it('enregistre l’issue de chaque envoi', async () => {
    const { rpc, journal } = client({ data: true }, { data: true }, { data: true })
    const reserved = { idempotencyKey: 'k', attempt: 2 }
    await journal.markSent(reserved, 'cf-1')
    await journal.markFailed(reserved, 'provider_rejected', 'E_RECIPIENT_SUPPRESSED')
    await journal.markUncertain(reserved, 'provider_timeout')
    expect(rpc.mock.calls.map(([, args]) => args)).toEqual([
      { p_idempotency_key: 'k', p_attempt: 2, p_status: 'sent', p_provider_message_id: 'cf-1', p_error_code: null, p_provider_code: null },
      { p_idempotency_key: 'k', p_attempt: 2, p_status: 'failed', p_provider_message_id: null, p_error_code: 'provider_rejected', p_provider_code: 'E_RECIPIENT_SUPPRESSED' },
      { p_idempotency_key: 'k', p_attempt: 2, p_status: 'uncertain', p_provider_message_id: null, p_error_code: 'provider_timeout', p_provider_code: null },
    ])
    expect(rpc.mock.calls.every(([fn]) => fn === 'finish_notification_delivery')).toBe(true)
  })

  it('signale une ligne absente', async () => {
    const { journal } = client({ data: false })
    await expect(journal.markSent({ idempotencyKey: 'absente', attempt: 1 }, 'cf-1')).rejects.toMatchObject({ code: 'journal_unavailable' })
  })
})
