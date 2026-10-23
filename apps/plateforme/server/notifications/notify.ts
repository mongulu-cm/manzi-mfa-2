import { NotificationError, PARTICIPANT_ROLES, validateQuickChatEvent } from './event'
import type { NotificationErrorCode, ParticipantRole, QuickChatEvent } from './event'
import type { DeliveryErrorCode, DeliveryJournal } from './journal'
import type { NotificationLogger } from './logger'
import { planNotifications } from './policy'
import type { NotificationPolicy, PlannedNotification } from './policy'
import { renderEmail } from './templates'
import type { RenderOptions } from './templates'
import type { EmailMessage, EmailTransport } from './transport'

export interface NotifyDependencies {
  policy: NotificationPolicy
  transport: EmailTransport
  journal: DeliveryJournal
  logger: NotificationLogger
  render: RenderOptions
  from: EmailMessage['from']
  replyTo?: string
  now: () => Date
}

export type NotificationStatus = 'sent' | 'duplicate' | 'in_progress' | 'uncertain' | 'failed' | 'skipped' | 'dry_run'

export interface NotificationResult {
  role: ParticipantRole
  status: NotificationStatus
  errorCode?: NotificationErrorCode
}

export interface NotificationReport {
  results: NotificationResult[]
}

function errorCodeOf(error: unknown): NotificationErrorCode {
  return error instanceof NotificationError ? error.code : 'provider_unavailable'
}

const UNCERTAIN_CODES = new Set<NotificationErrorCode>(['provider_timeout', 'provider_uncertain'])
const SEND_CODES = new Set<NotificationErrorCode>(['provider_rejected', 'provider_unavailable', ...UNCERTAIN_CODES])

// Toute autre erreur levée par un transport est traitée comme une indisponibilité.
function sendErrorCode(error: unknown): DeliveryErrorCode {
  const code = errorCodeOf(error)
  return SEND_CODES.has(code) ? code as DeliveryErrorCode : 'provider_unavailable'
}

interface Delivery {
  planned: PlannedNotification
  message: EmailMessage
  context: { quickChatId: string, eventType: string, role: ParticipantRole }
  result: (status: NotificationStatus, errorCode?: NotificationErrorCode) => NotificationResult
}

// Envoi d'un message déjà réservé dans le journal (spec § 5.4, étapes 3 et 4).
async function sendReserved(delivery: Delivery, attempt: number, deps: NotifyDependencies): Promise<NotificationResult> {
  const { journal, logger } = deps
  const { context, result } = delivery
  const reserved = { idempotencyKey: delivery.planned.idempotencyKey, attempt }
  let providerMessageId: string
  try {
    ({ providerMessageId } = await deps.transport.send(delivery.message))
  }
  catch (error) {
    const errorCode = sendErrorCode(error)
    const providerCode = error instanceof NotificationError ? error.providerCode : undefined
    const uncertain = UNCERTAIN_CODES.has(errorCode)
    const event = uncertain ? 'email.uncertain' : 'email.failed'
    await (uncertain ? journal.markUncertain(reserved, errorCode) : journal.markFailed(reserved, errorCode, providerCode))
      .catch(() => logger.error(event, { ...context, attempt, errorCode: 'journal_unavailable' }))
    logger.error(event, { ...context, attempt, errorCode, providerCode })
    return result(uncertain ? 'uncertain' : 'failed', errorCode)
  }
  try {
    await journal.markSent(reserved, providerMessageId)
  }
  catch {
    // L'email est parti ; la ligne restée pending deviendra uncertain, jamais renvoyée.
    logger.error('email.sent', { ...context, attempt, errorCode: 'journal_unavailable' })
    return result('sent', 'journal_unavailable')
  }
  logger.info('email.sent', { ...context, attempt })
  return result('sent')
}

async function deliver(
  event: QuickChatEvent, planned: PlannedNotification, message: EmailMessage, deps: NotifyDependencies,
): Promise<NotificationResult> {
  const { logger } = deps
  const context = { quickChatId: event.quickChatId, eventType: event.type, role: planned.role }
  const result = (status: NotificationStatus, errorCode?: NotificationErrorCode): NotificationResult =>
    errorCode ? { role: planned.role, status, errorCode } : { role: planned.role, status }

  let reservation
  try {
    reservation = await deps.journal.reserve(planned, event, deps.now())
  }
  catch (error) {
    // Sans journal, aucun envoi : un échec visible plutôt qu'un doublon possible.
    logger.error('email.failed', { ...context, errorCode: errorCodeOf(error) })
    return result('failed', 'journal_unavailable')
  }
  if (reservation.decision === 'send') return sendReserved({ planned, message, context, result }, reservation.attempt, deps)
  if (reservation.decision === 'uncertain') {
    logger.error('email.uncertain', { ...context, status: 'uncertain' })
  }
  else {
    logger.info(`email.${reservation.decision}`, context)
  }
  return result(reservation.decision)
}

// Lève invalid_event ou config_invalid avant tout envoi ; un échec d'envoi figure dans le rapport.
export async function notifyQuickChat(input: unknown, deps: NotifyDependencies): Promise<NotificationReport> {
  const event = validateQuickChatEvent(input)
  const planned = planNotifications(event, deps.policy)
  // Rendu complet avant toute réservation : une configuration invalide ne laisse aucune ligne pending.
  const messages = planned.map(item => ({
    item,
    message: {
      ...renderEmail(event, item.role, deps.render),
      to: item.recipient.email,
      from: deps.from,
      ...(deps.replyTo ? { replyTo: deps.replyTo } : {}),
    },
  }))

  const results: NotificationResult[] = []
  for (const role of PARTICIPANT_ROLES) {
    const entry = messages.find(({ item }) => item.role === role)
    const context = { quickChatId: event.quickChatId, eventType: event.type, role }
    if (!entry) {
      deps.logger.info('email.skipped', context)
      results.push({ role, status: 'skipped' })
      continue
    }
    if (deps.transport.dryRun) {
      // Envoi à blanc : ni journal ni envoi, pour ne pas fausser l'idempotence d'un futur envoi réel.
      deps.logger.info('email.dry_run', context)
      results.push({ role, status: 'dry_run' })
      continue
    }
    // Séquentiel : l'échec d'un destinataire n'empêche pas l'envoi à l'autre.
    results.push(await deliver(event, entry.item, entry.message, deps))
  }
  return { results }
}
