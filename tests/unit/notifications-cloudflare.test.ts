import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCloudflareEmailTransport } from '../../apps/plateforme/server/notifications/cloudflare'
import type { EmailSendBinding } from '../../apps/plateforme/server/notifications/cloudflare'
import type { NotificationError } from '../../apps/plateforme/server/notifications/event'

const message = {
  to: 'mentee@example.test',
  from: { email: 'notifications@example.test', name: 'Manzi-mfa' },
  replyTo: 'collectif@example.test',
  subject: 'Quick Chat QC-A1B2C3 : nouvel horaire',
  text: 'texte',
  html: '<p>html</p>',
}

function binding(send: EmailSendBinding['send']): EmailSendBinding {
  return { send: vi.fn(send) }
}

function providerError(code?: unknown) {
  return Object.assign(new Error('mentee@example.test is suppressed'), code === undefined ? {} : { code })
}

function rejectWith(code?: unknown): EmailSendBinding['send'] {
  return () => Promise.reject(providerError(code))
}

async function failure(send: EmailSendBinding['send']): Promise<NotificationError> {
  return createCloudflareEmailTransport({ binding: binding(send) }).send(message).then(
    () => { throw new Error('envoi accepté à tort') },
    error => error as NotificationError,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('adaptateur Cloudflare Email Service', () => {
  it('exige la liaison send_email', () => {
    expect(() => createCloudflareEmailTransport({ binding: undefined }))
      .toThrow(expect.objectContaining({ code: 'config_missing' }))
  })

  it('transmet le message tel quel et renvoie l’identifiant Cloudflare', async () => {
    const email = binding(async () => ({ messageId: 'cf-123' }))
    expect(await createCloudflareEmailTransport({ binding: email }).send(message)).toEqual({ providerMessageId: 'cf-123' })
    expect(email.send).toHaveBeenCalledWith(message)
  })

  it('considère une réponse sans identifiant comme indisponible', async () => {
    const error = await failure(async () => ({ messageId: '' }))
    expect(error.code).toBe('provider_unavailable')
  })

  it.each([
    ['E_VALIDATION_ERROR', 'provider_rejected'],
    ['E_RECIPIENT_SUPPRESSED', 'provider_rejected'],
    ['E_SENDER_NOT_VERIFIED', 'provider_rejected'],
    ['E_HEADER_NOT_ALLOWED', 'provider_rejected'],
    ['E_HEADERS_TOO_LARGE', 'provider_rejected'],
    ['E_RATE_LIMIT_EXCEEDED', 'provider_unavailable'],
    ['E_DAILY_LIMIT_EXCEEDED', 'provider_unavailable'],
    ['E_INTERNAL_SERVER_ERROR', 'provider_unavailable'],
    ['E_SOMETHING_NEW', 'provider_unavailable'],
  ])('classe %s en %s et conserve le code', async (code, expected) => {
    const error = await failure(rejectWith(code))
    expect(error).toMatchObject({ code: expected, providerCode: code })
  })

  it.each([
    ['sans code', undefined],
    ['avec un code non conforme', 'contact mentee@example.test'],
    ['avec un code non textuel', 500],
  ])('traite une erreur %s comme indisponible, sans code fournisseur', async (_, code) => {
    const error = await failure(rejectWith(code))
    expect(error.code).toBe('provider_unavailable')
    expect(error.providerCode).toBeUndefined()
  })

  it('ne propage jamais le message brut du fournisseur', async () => {
    const error = await failure(rejectWith('E_RECIPIENT_SUPPRESSED'))
    expect(`${error.message} ${JSON.stringify(error)}`).not.toContain('example.test')
  })

  it('signale un délai dépassé comme issue inconnue', async () => {
    vi.useFakeTimers()
    const transport = createCloudflareEmailTransport({ binding: binding(() => new Promise(() => {})), timeoutMs: 50 })
    const pending = transport.send(message).then(() => undefined, error => error as NotificationError)
    await vi.advanceTimersByTimeAsync(50)
    const error = (await pending)!
    expect(error.code).toBe('provider_timeout')
    expect(error.providerCode).toBeUndefined()
  })
})
