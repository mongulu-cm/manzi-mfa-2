export interface EmailMessage {
  to: string
  from: { email: string, name?: string }
  replyTo?: string
  subject: string
  text: string
  html: string
}

export interface EmailTransport {
  // Envoi à blanc : rien ne part et rien n'est écrit dans le journal d'idempotence.
  readonly dryRun?: boolean
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

// N'envoie rien : notifyQuickChat le signale (email.dry_run) sans toucher au journal, de sorte
// qu'un passage ultérieur à un vrai fournisseur ne prenne pas ces envois pour des doublons.
export function createLogTransport(): EmailTransport {
  return {
    dryRun: true,
    async send() {
      return { providerMessageId: `log-${crypto.randomUUID()}` }
    },
  }
}
