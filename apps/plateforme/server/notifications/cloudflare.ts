import { NotificationError } from './event'
import type { EmailMessage, EmailTransport } from './transport'

// Sous-ensemble de la liaison Workers send_email (Cloudflare Email Service) utilisé par F-008.
export interface EmailSendBinding {
  send(message: {
    to: string
    from: { email: string, name?: string }
    replyTo?: string
    subject: string
    text: string
    html: string
  }): Promise<{ messageId: string }>
}

const REJECTED = new Set([
  'E_VALIDATION_ERROR', 'E_FIELD_MISSING', 'E_TOO_MANY_RECIPIENTS', 'E_TOO_MANY_ATTACHMENTS',
  'E_CONTENT_TOO_LARGE', 'E_SENDER_NOT_VERIFIED', 'E_SENDER_DOMAIN_NOT_AVAILABLE',
  'E_RECIPIENT_NOT_ALLOWED', 'E_RECIPIENT_SUPPRESSED', 'E_ACCOUNT_SUSPENDED',
])

function providerCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' && /^E_[A-Z_]{1,64}$/.test(code) ? code : undefined
}

function isRejected(code: string): boolean {
  return REJECTED.has(code) || /^E_HEADERS?_/.test(code)
}

export function createCloudflareEmailTransport(
  { binding, timeoutMs = 10_000 }: { binding: EmailSendBinding | undefined, timeoutMs?: number },
): EmailTransport {
  if (!binding) throw new NotificationError('config_missing')
  return {
    async send(message: EmailMessage) {
      let timer: ReturnType<typeof setTimeout> | undefined
      // Abandonner l'attente n'annule pas l'envoi : l'issue devient inconnue (provider_timeout).
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new NotificationError('provider_timeout')), timeoutMs)
      })
      try {
        const result = await Promise.race([binding.send(message), timeout])
        // Appel abouti sans identifiant : rien ne prouve que le message n'est pas parti.
        if (!result?.messageId) throw new NotificationError('provider_uncertain')
        return { providerMessageId: result.messageId }
      }
      catch (error) {
        if (error instanceof NotificationError) throw error
        // Seul le code est conservé : le message d'origine peut citer l'adresse du destinataire.
        const code = providerCode(error)
        throw new NotificationError(code && isRejected(code) ? 'provider_rejected' : 'provider_unavailable', code)
      }
      finally {
        clearTimeout(timer)
      }
    },
  }
}
