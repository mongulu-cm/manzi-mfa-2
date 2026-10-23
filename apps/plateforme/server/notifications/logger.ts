export type NotificationLogEvent
  = | 'email.sent'
    | 'email.duplicate'
    | 'email.in_progress'
    | 'email.uncertain'
    | 'email.skipped'
    | 'email.failed'
    | 'email.logged'

export interface NotificationLogFields {
  quickChatId?: string
  eventType?: string
  role?: string
  attempt?: number
  errorCode?: string
  providerCode?: string
  status?: string
}

export interface NotificationLogger {
  info(event: NotificationLogEvent, fields?: NotificationLogFields): void
  error(event: NotificationLogEvent, fields?: NotificationLogFields): void
}

// Liste blanche : aucun autre champ (adresse, nom, sujet, contenu) ne peut atteindre les journaux.
const ALLOWED_FIELDS = ['quickChatId', 'eventType', 'role', 'attempt', 'errorCode', 'providerCode', 'status'] as const

function line(event: NotificationLogEvent, fields: NotificationLogFields = {}): string {
  const entry: Record<string, unknown> = { scope: 'notifications', event }
  for (const key of ALLOWED_FIELDS) {
    if (fields[key] !== undefined) entry[key] = fields[key]
  }
  return JSON.stringify(entry)
}

export function createNotificationLogger(sink: Pick<Console, 'info' | 'error'> = console): NotificationLogger {
  return {
    info: (event, fields) => sink.info(line(event, fields)),
    error: (event, fields) => sink.error(line(event, fields)),
  }
}
