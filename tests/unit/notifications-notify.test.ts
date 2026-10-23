import { describe, expect, it, vi } from 'vitest'
import { NotificationError } from '../../apps/plateforme/server/notifications/event'
import { PENDING_TTL_MS, createMemoryJournal } from '../../apps/plateforme/server/notifications/journal'
import { createNotificationLogger } from '../../apps/plateforme/server/notifications/logger'
import { notifyQuickChat } from '../../apps/plateforme/server/notifications/notify'
import type { NotifyDependencies } from '../../apps/plateforme/server/notifications/notify'
import { DEFAULT_POLICY, parsePolicy } from '../../apps/plateforme/server/notifications/policy'
import { createLogTransport, createMemoryTransport } from '../../apps/plateforme/server/notifications/transport'
import type { EmailTransport } from '../../apps/plateforme/server/notifications/transport'
import { createdEvent, mentee, mentor, updatedAgainEvent, updatedEvent } from '../fixtures/quick-chat-events'

function setup(overrides: Partial<NotifyDependencies> = {}) {
  let clock = new Date('2026-11-01T10:00:00Z')
  const lines: string[] = []
  const transport = createMemoryTransport()
  const journal = createMemoryJournal(() => clock)
  const deps: NotifyDependencies = {
    policy: DEFAULT_POLICY,
    transport,
    journal,
    logger: createNotificationLogger({ info: line => lines.push(line), error: line => lines.push(line) }),
    render: { appUrl: 'https://app.example.test', siteUrl: 'https://www.example.test', timeZone: 'Africa/Douala' },
    from: { email: 'notifications@example.test', name: 'Manzi-mfa' },
    replyTo: 'collectif@example.test',
    now: () => clock,
    ...overrides,
  }
  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms)
  }
  return { deps, transport, journal, lines, advance }
}

const statuses = (report: { results: { status: string }[] }) => report.results.map(result => result.status)

describe('notification d’un Quick Chat', () => {
  it('envoie un email au mentor et au mentoré pour une création', async () => {
    const { deps, transport, journal } = setup()
    expect(await notifyQuickChat(createdEvent, deps)).toEqual({
      results: [{ role: 'mentor', status: 'sent' }, { role: 'mentee', status: 'sent' }],
    })
    expect(transport.sent.map(message => message.to)).toEqual([mentor.email, mentee.email])
    expect(transport.sent[0]).toMatchObject({ from: deps.from, replyTo: 'collectif@example.test', subject: 'Nouvelle demande de Quick Chat QC-A1B2C3' })
    expect([...journal.rows.values()].map(row => row.status)).toEqual(['sent', 'sent'])
  })

  it('omet l’adresse de réponse lorsqu’elle n’est pas configurée', async () => {
    const { deps, transport } = setup({ replyTo: undefined })
    await notifyQuickChat(createdEvent, deps)
    expect(transport.sent[0]).not.toHaveProperty('replyTo')
  })

  it('ne renvoie rien quand le même événement est rejoué', async () => {
    const { deps, transport } = setup()
    await notifyQuickChat(createdEvent, deps)
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['duplicate', 'duplicate'])
    expect(transport.sent).toHaveLength(2)
  })

  it('envoie un nouvel email à chaque version modifiée', async () => {
    const { deps, transport } = setup()
    await notifyQuickChat(createdEvent, deps)
    await notifyQuickChat(updatedEvent, deps)
    await notifyQuickChat(updatedAgainEvent, deps)
    expect(transport.sent).toHaveLength(6)
    expect(transport.sent[4]!.text).toContain('Ancien horaire')
  })

  it('respecte un événement désactivé et un destinataire unique', async () => {
    const policy = parsePolicy({ events: {
      'quick_chat.created': { enabled: true, recipients: ['mentee'] },
      'quick_chat.updated': { enabled: false, recipients: ['mentor', 'mentee'] },
    } })
    const { deps, transport, lines } = setup({ policy })
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['skipped', 'sent'])
    expect(statuses(await notifyQuickChat(updatedEvent, deps))).toEqual(['skipped', 'skipped'])
    expect(transport.sent.map(message => message.to)).toEqual([mentee.email])
    expect(lines.filter(line => line.includes('email.skipped'))).toHaveLength(3)
  })

  it('renvoie après un échec et compte les tentatives', async () => {
    const { deps, transport, journal, lines } = setup()
    transport.failures.push(new NotificationError('provider_unavailable', 'E_RATE_LIMIT_EXCEEDED'))
    expect((await notifyQuickChat(createdEvent, deps)).results).toEqual([
      { role: 'mentor', status: 'failed', errorCode: 'provider_unavailable' },
      { role: 'mentee', status: 'sent' },
    ])
    expect(lines).toContainEqual(expect.stringContaining('"providerCode":"E_RATE_LIMIT_EXCEEDED"'))
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['sent', 'duplicate'])
    expect([...journal.rows.values()][0]).toMatchObject({ status: 'sent', attempts: 2 })
  })

  it('classe une erreur inattendue du transport comme indisponibilité', async () => {
    const { deps, transport } = setup()
    transport.failures.push(new Error('panne'))
    expect((await notifyQuickChat(createdEvent, deps)).results[0]).toEqual({ role: 'mentor', status: 'failed', errorCode: 'provider_unavailable' })
  })

  it('ne renvoie jamais un email dont l’issue est inconnue', async () => {
    const { deps, transport, journal, lines } = setup()
    transport.failures.push(new NotificationError('provider_timeout'))
    expect((await notifyQuickChat(createdEvent, deps)).results[0]).toEqual({ role: 'mentor', status: 'uncertain', errorCode: 'provider_timeout' })
    expect([...journal.rows.values()][0]).toMatchObject({ status: 'uncertain', lastErrorCode: 'provider_timeout' })
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['uncertain', 'duplicate'])
    expect(transport.sent).toHaveLength(1)
    expect(lines.filter(line => line.includes('email.uncertain'))).toHaveLength(2)
  })

  it('signale un envoi en cours puis interrompu sans le renvoyer', async () => {
    const { deps, transport, journal, advance } = setup()
    const planned = { role: 'mentor' as const, recipient: mentor, idempotencyKey: `quick-chat:${createdEvent.quickChatId}:v1:quick_chat.created:mentor` }
    await journal.reserve(planned, createdEvent, deps.now())
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['in_progress', 'sent'])
    advance(PENDING_TTL_MS)
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['uncertain', 'duplicate'])
    expect(transport.sent.map(message => message.to)).toEqual([mentee.email])
  })

  it('n’écrit rien dans le journal lors d’un envoi à blanc', async () => {
    const { deps, journal, lines } = setup({ transport: createLogTransport() })
    expect(statuses(await notifyQuickChat(createdEvent, deps))).toEqual(['dry_run', 'dry_run'])
    expect(journal.rows.size).toBe(0)
    expect(lines.filter(line => line.includes('email.dry_run'))).toHaveLength(2)
    // Un passage ultérieur au vrai fournisseur envoie bien les emails.
    expect(statuses(await notifyQuickChat(createdEvent, { ...deps, transport: createMemoryTransport() }))).toEqual(['sent', 'sent'])
  })

  it('traite une réponse sans identifiant comme une issue inconnue', async () => {
    const { deps, transport, journal } = setup()
    transport.failures.push(new NotificationError('provider_uncertain'))
    expect((await notifyQuickChat(createdEvent, deps)).results[0]).toEqual({ role: 'mentor', status: 'uncertain', errorCode: 'provider_uncertain' })
    expect([...journal.rows.values()][0]).toMatchObject({ status: 'uncertain', lastErrorCode: 'provider_uncertain' })
  })

  it('classe une erreur de configuration levée par le transport comme indisponibilité', async () => {
    const { deps, transport } = setup()
    transport.failures.push(new NotificationError('config_invalid'))
    expect((await notifyQuickChat(createdEvent, deps)).results[0]).toEqual({ role: 'mentor', status: 'failed', errorCode: 'provider_unavailable' })
  })

  it('garde email.uncertain quand l’issue inconnue ne peut pas être enregistrée', async () => {
    const { deps, transport, journal, lines } = setup()
    transport.failures.push(new NotificationError('provider_timeout'))
    vi.spyOn(journal, 'markUncertain').mockRejectedValue(new NotificationError('journal_unavailable'))
    await notifyQuickChat(createdEvent, deps)
    expect(lines.filter(line => line.includes('"errorCode":"journal_unavailable"'))).toEqual([expect.stringContaining('"event":"email.uncertain"')])
  })

  it('n’envoie rien quand le journal est indisponible', async () => {
    const { deps, transport, journal } = setup()
    journal.unavailable = true
    expect((await notifyQuickChat(createdEvent, deps)).results).toEqual([
      { role: 'mentor', status: 'failed', errorCode: 'journal_unavailable' },
      { role: 'mentee', status: 'failed', errorCode: 'journal_unavailable' },
    ])
    expect(transport.sent).toEqual([])
  })

  it('signale un email parti mais non enregistré', async () => {
    const { deps, journal, lines } = setup()
    const markSent = vi.spyOn(journal, 'markSent').mockRejectedValue(new NotificationError('journal_unavailable'))
    expect((await notifyQuickChat(createdEvent, deps)).results[0]).toEqual({ role: 'mentor', status: 'sent', errorCode: 'journal_unavailable' })
    expect(markSent).toHaveBeenCalled()
    expect(lines).toContainEqual(expect.stringContaining('"errorCode":"journal_unavailable"'))
  })

  it('signale un échec d’envoi que le journal n’a pas pu enregistrer', async () => {
    const { deps, transport, journal, lines } = setup()
    transport.failures.push(new NotificationError('provider_rejected', 'E_RECIPIENT_SUPPRESSED'))
    vi.spyOn(journal, 'markFailed').mockRejectedValue(new NotificationError('journal_unavailable'))
    expect((await notifyQuickChat(createdEvent, deps)).results[0]).toEqual({ role: 'mentor', status: 'failed', errorCode: 'provider_rejected' })
    expect(lines).toContainEqual(expect.stringContaining('"errorCode":"journal_unavailable"'))
  })

  it('refuse un événement invalide ou une configuration invalide avant toute réservation', async () => {
    const { deps, transport, journal } = setup()
    await expect(notifyQuickChat({ ...createdEvent, version: 0 }, deps)).rejects.toMatchObject({ code: 'invalid_event' })
    await expect(notifyQuickChat(createdEvent, { ...deps, render: { ...deps.render, timeZone: 'Mars/Olympus' } }))
      .rejects.toMatchObject({ code: 'config_invalid' })
    expect(journal.rows.size).toBe(0)
    expect(transport.sent).toEqual([])
  })

  it('n’écrit ni adresse ni nom dans les journaux', async () => {
    const failing: EmailTransport = { send: () => Promise.reject(new Error(`refusé pour ${mentee.email}`)) }
    const { deps, lines } = setup({ transport: failing })
    await notifyQuickChat(createdEvent, deps)
    const output = lines.join('\n')
    for (const value of [mentor.email, mentee.email, mentor.displayName, mentee.displayName, 'Quick Chat QC']) {
      expect(output).not.toContain(value)
    }
  })
})
