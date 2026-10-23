import { describe, expect, it, vi } from 'vitest'
import { createNotificationLogger } from '../../apps/plateforme/server/notifications/logger'
import type { NotificationLogFields } from '../../apps/plateforme/server/notifications/logger'
import { createLogTransport, createMemoryTransport } from '../../apps/plateforme/server/notifications/transport'

const message = {
  to: 'mentee@example.test',
  from: { email: 'notifications@example.test', name: 'Manzi-mfa' },
  subject: 'Sujet confidentiel',
  text: 'Contenu confidentiel',
  html: '<p>Contenu confidentiel</p>',
}

function sink() {
  return { info: vi.fn<(line: string) => void>(), error: vi.fn<(line: string) => void>() }
}

describe('journaux structurés', () => {
  it('émet une ligne JSON limitée aux champs autorisés', () => {
    const output = sink()
    const fields = {
      quickChatId: 'qc', eventType: 'quick_chat.created', role: 'mentor', attempt: 2,
      errorCode: 'provider_unavailable', providerCode: 'E_RATE_LIMIT_EXCEEDED', status: 'failed',
      email: 'mentee@example.test', subject: 'Sujet confidentiel',
    } as NotificationLogFields
    createNotificationLogger(output).error('email.failed', fields)
    expect(JSON.parse(output.error.mock.calls[0]![0])).toEqual({
      scope: 'notifications', event: 'email.failed', quickChatId: 'qc', eventType: 'quick_chat.created',
      role: 'mentor', attempt: 2, errorCode: 'provider_unavailable', providerCode: 'E_RATE_LIMIT_EXCEEDED', status: 'failed',
    })
    expect(output.info).not.toHaveBeenCalled()
  })

  it('accepte une ligne sans champ et écrit par défaut sur la console', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    createNotificationLogger().info('email.sent')
    expect(info).toHaveBeenCalledWith('{"scope":"notifications","event":"email.sent"}')
    info.mockRestore()
  })
})

describe('transports de test et de développement', () => {
  it('conserve les messages en mémoire et rejoue les échecs programmés', async () => {
    const transport = createMemoryTransport()
    transport.failures.push(new Error('panne'))
    await expect(transport.send(message)).rejects.toThrow('panne')
    expect(await transport.send(message)).toEqual({ providerMessageId: 'memory-1' })
    expect(transport.sent).toEqual([message])
  })

  it('signale le transport log comme envoi à blanc', async () => {
    const transport = createLogTransport()
    expect(transport.dryRun).toBe(true)
    expect((await transport.send(message)).providerMessageId).toMatch(/^log-[0-9a-f-]{36}$/)
    expect(createMemoryTransport().dryRun).toBeUndefined()
  })
})
