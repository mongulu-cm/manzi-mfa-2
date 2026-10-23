import { describe, expect, it } from 'vitest'
import { createCloudflareEmailTransport } from '../../apps/plateforme/server/notifications/cloudflare'
import type { EmailSendBinding } from '../../apps/plateforme/server/notifications/cloudflare'
import { createMemoryJournal } from '../../apps/plateforme/server/notifications/journal'
import { createNotificationLogger } from '../../apps/plateforme/server/notifications/logger'
import { notifyQuickChat } from '../../apps/plateforme/server/notifications/notify'
import { DEFAULT_POLICY } from '../../apps/plateforme/server/notifications/policy'
import { createdEvent, updatedEvent } from '../fixtures/quick-chat-events'

// Smoke opt-in, hors CI : envoie de vrais emails par Cloudflare Email Service.
try {
  process.loadEnvFile('.env')
}
catch { /* Les variables peuvent également être exportées. */ }
const { E2E_EMAIL_TO: to, NUXT_NOTIFICATIONS_FROM_EMAIL: fromEmail, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env
const token = process.env.CLOUDFLARE_EMAIL_API_TOKEN
const configured = Boolean(to && fromEmail && accountId && token)

// La réception elle-même se vérifie dans la boîte de E2E_EMAIL_TO.
function restFailure(ok: boolean, body: { success?: boolean }): string | undefined {
  return ok && body.success === true ? undefined : 'E_INTERNAL_SERVER_ERROR'
}

// La liaison Workers n'existe pas sous Node : l'API REST joue son rôle, l'adaptateur reste celui de production.
function restBinding(): EmailSendBinding {
  return {
    async send(message) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: message.to,
          from: { address: message.from.email, name: message.from.name },
          reply_to: message.replyTo,
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(15_000),
      })
      // Ni le corps ni l'URL ne sont journalisés : seul un code générique remonte.
      const code = restFailure(response.ok, await response.json().catch(() => ({})))
      if (code) throw Object.assign(new Error('rest send failed'), { code })
      return { messageId: 'rest' }
    },
  }
}

function alias(address: string, tag: string): string {
  const [local, domain] = address.split('@')
  return `${local}+${tag}@${domain}`
}

// Le mentoré reçoit sur E2E_EMAIL_TO ; le mentor sur E2E_EMAIL_TO_MENTOR, ou à défaut sur l'alias
// +mentor (à vérifier dans Cloudflare tant que le domaine d'envoi n'est pas intégré).
const menteeTo = to
const mentorTo = process.env.E2E_EMAIL_TO_MENTOR || (to ? alias(to, 'mentor') : undefined)

describe.skipIf(!configured)('envoi réel par Cloudflare Email Service', () => {
  it('envoie création et modification, puis refuse le rejeu', async () => {
    const recipients = (event: typeof createdEvent) => ({
      ...event,
      mentor: { ...event.mentor, email: mentorTo! },
      mentee: { ...event.mentee, email: menteeTo! },
    })
    const deps = {
      policy: DEFAULT_POLICY,
      transport: createCloudflareEmailTransport({ binding: restBinding() }),
      journal: createMemoryJournal(),
      logger: createNotificationLogger(),
      render: { appUrl: 'https://app.manzi-mfa-2.mongulu.cm', siteUrl: 'https://manzi-mfa-2.mongulu.cm', timeZone: 'Africa/Douala' },
      from: { email: fromEmail!, name: process.env.NUXT_NOTIFICATIONS_FROM_NAME || 'Manzi-mfa' },
      replyTo: process.env.NUXT_NOTIFICATIONS_REPLY_TO || 'collectif@mongulu.cm',
      now: () => new Date(),
    }
    const statuses = async (event: typeof createdEvent) =>
      (await notifyQuickChat(recipients(event), deps)).results.map(result => result.status)

    expect(await statuses(createdEvent)).toEqual(['sent', 'sent'])
    expect(await statuses(updatedEvent)).toEqual(['sent', 'sent'])
    expect(await statuses(createdEvent)).toEqual(['duplicate', 'duplicate'])
  })
})
