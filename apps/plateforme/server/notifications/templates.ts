import { NotificationError } from './event'
import type { ParticipantRole, QuickChatEvent, QuickChatEventType } from './event'

export interface RenderOptions {
  appUrl: string
  siteUrl: string
  timeZone: string
}

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

const CONTACT = 'collectif@mongulu.cm'

const ACTIONS: Record<QuickChatEventType, Record<ParticipantRole, string>> = {
  'quick_chat.created': {
    mentor: 'Consultez la demande et confirmez votre disponibilité.',
    mentee: 'Votre demande est envoyée : ajoutez le créneau à votre agenda et préparez vos questions.',
  },
  'quick_chat.updated': {
    mentor: 'Vérifiez le nouvel horaire et prévenez le mentoré en cas d’empêchement.',
    mentee: 'Vérifiez le nouvel horaire et mettez à jour votre agenda.',
  },
}

const OTHER_FALLBACK: Record<ParticipantRole, string> = { mentor: 'votre mentoré', mentee: 'votre mentor' }

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`)
}

export function quickChatReference(quickChatId: string): string {
  return `QC-${quickChatId.replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

// Intl écrit les décalages négatifs avec le signe moins typographique (U+2212).
function utcOffset(zoneName: string): string {
  const match = /([+\-−])(\d{2}):?(\d{2})?$/.exec(zoneName)
  if (!match || (match[2] === '00' && (match[3] ?? '00') === '00')) return 'UTC'
  const sign = match[1] === '+' ? '+' : '-'
  const minutes = match[3] && match[3] !== '00' ? `:${match[3]}` : ''
  return `UTC${sign}${Number(match[2])}${minutes}`
}

// Ex. « jeudi 5 novembre 2026, 18 h 30 (heure de Douala, UTC+1) — 30 min ».
export function formatSchedule(startsAt: string, durationMinutes: number, timeZone: string): string {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset',
    }).formatToParts(new Date(startsAt))
  }
  catch {
    throw new NotificationError('config_invalid')
  }
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? ''
  const city = timeZone.includes('/') ? `heure de ${timeZone.split('/').pop()!.replace(/_/g, ' ')}, ` : ''
  return `${part('weekday')} ${part('day')} ${part('month')} ${part('year')}, `
    + `${part('hour')} h ${part('minute')} (${city}${utcOffset(part('timeZoneName'))}) — ${durationMinutes} min`
}

function absoluteUrl(path: string, base: string): string {
  try {
    const url = new URL(path, base)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new TypeError('protocol')
    return url.href
  }
  catch {
    throw new NotificationError('config_invalid')
  }
}

function subjectFor(event: QuickChatEvent, role: ParticipantRole, reference: string): string {
  if (event.type === 'quick_chat.updated') return `Quick Chat ${reference} : nouvel horaire`
  return role === 'mentor' ? `Nouvelle demande de Quick Chat ${reference}` : `Votre demande de Quick Chat ${reference} est envoyée`
}

function introFor(event: QuickChatEvent, role: ParticipantRole, other: string): string {
  if (event.type === 'quick_chat.updated') return `L’horaire de votre Quick Chat avec ${other} a été modifié.`
  return role === 'mentor' ? `${other} vous a envoyé une demande de Quick Chat.` : `Votre demande de Quick Chat avec ${other} est envoyée.`
}

// Le sujet ne contient aucun nom : seules la référence et la nature de l'événement y figurent.
export function renderEmail(event: QuickChatEvent, role: ParticipantRole, options: RenderOptions): RenderedEmail {
  const reference = quickChatReference(event.quickChatId)
  const self = event[role].displayName
  const other = event[role === 'mentor' ? 'mentee' : 'mentor'].displayName ?? OTHER_FALLBACK[role]
  const schedule = formatSchedule(event.startsAt, event.durationMinutes, options.timeZone)
  const previous = event.previousStartsAt && formatSchedule(event.previousStartsAt, event.durationMinutes, options.timeZone)
  const link = absoluteUrl(`/quick-chats/${event.quickChatId}`, options.appUrl)
  const privacy = absoluteUrl('/confidentialite', options.siteUrl)
  const greeting = self ? `Bonjour ${self},` : 'Bonjour,'
  const intro = introFor(event, role, other)
  const action = ACTIONS[event.type][role]

  const text = [
    greeting, '', intro, '',
    `Quick Chat ${reference}`,
    `Horaire : ${schedule}`,
    ...(previous ? [`Ancien horaire : ${previous}`] : []),
    '', `Action attendue : ${action}`, '',
    `Ouvrir le Quick Chat : ${link}`, '',
    '—', `Collectif Mongulu · ${CONTACT}`, `Confidentialité : ${privacy}`,
  ].join('\n')

  const html = [
    '<!doctype html><html lang="fr"><body>',
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(intro)}</p>`,
    `<p><strong>Quick Chat ${escapeHtml(reference)}</strong><br>Horaire : ${escapeHtml(schedule)}`,
    ...(previous ? [`<br>Ancien horaire : <s>${escapeHtml(previous)}</s>`] : []),
    '</p>',
    `<p><strong>Action attendue :</strong> ${escapeHtml(action)}</p>`,
    `<p><a href="${escapeHtml(link)}">Ouvrir le Quick Chat</a></p>`,
    `<hr><p>Collectif Mongulu · <a href="mailto:${CONTACT}">${CONTACT}</a> · `
    + `<a href="${escapeHtml(privacy)}">Confidentialité</a></p>`,
    '</body></html>',
  ].join('')

  return { subject: subjectFor(event, role, reference), text, html }
}
