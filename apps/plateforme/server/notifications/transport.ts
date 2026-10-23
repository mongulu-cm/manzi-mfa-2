import type { NotificationLogger } from './logger'

export interface EmailMessage {
  to: string
  from: { email: string, name?: string }
  replyTo?: string
  subject: string
  text: string
  html: string
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<{ providerMessageId: string }>
}

export interface MemoryTransport extends EmailTransport {
  readonly sent: EmailMessage[]
  // Erreurs levées, dans l'ordre, par les prochains envois.
  readonly failures: Error[]
}

export function createMemoryTransport(): MemoryTransport {
  const sent: EmailMessage[] = []
  const failures: Error[] = []
  return {
    sent,
    failures,
    async send(message) {
      const failure = failures.shift()
      if (failure) throw failure
      sent.push(message)
      return { providerMessageId: `memory-${sent.length}` }
    },
  }
}

// N'envoie rien : signale seulement qu'un email aurait été transmis, sans adresse ni contenu.
export function createLogTransport(logger: NotificationLogger): EmailTransport {
  return {
    async send() {
      logger.info('email.logged')
      return { providerMessageId: `log-${crypto.randomUUID()}` }
    },
  }
}
