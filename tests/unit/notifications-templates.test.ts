import { describe, expect, it } from 'vitest'
import type { ParticipantRole } from '../../apps/plateforme/server/notifications/event'
import {
  escapeHtml, formatSchedule, quickChatReference, renderEmail,
} from '../../apps/plateforme/server/notifications/templates'
import {
  anonymousMenteeEvent, anonymousMentorEvent, createdEvent, hostileNamesEvent, updatedEvent,
} from '../fixtures/quick-chat-events'

const options = { appUrl: 'https://app.example.test', siteUrl: 'https://www.example.test', timeZone: 'Africa/Douala' }

describe('gabarits d’email', () => {
  it('dérive une référence courte de l’identifiant', () => {
    expect(quickChatReference(createdEvent.quickChatId)).toBe('QC-A1B2C3')
  })

  it.each([
    ['Africa/Douala', '2026-11-05T17:30:00Z', 'jeudi 5 novembre 2026, 18 h 30 (heure de Douala, UTC+1) — 30 min'],
    ['Europe/Paris', '2026-07-01T07:05:00Z', 'mercredi 1 juillet 2026, 09 h 05 (heure de Paris, UTC+2) — 30 min'],
    ['America/St_Johns', '2026-01-10T12:00:00Z', 'samedi 10 janvier 2026, 08 h 30 (heure de St Johns, UTC-3:30) — 30 min'],
    ['UTC', '2026-11-05T17:30:00Z', 'jeudi 5 novembre 2026, 17 h 30 (UTC) — 30 min'],
  ])('affiche l’horaire avec le fuseau %s', (timeZone, startsAt, expected) => {
    expect(formatSchedule(startsAt, 30, timeZone)).toBe(expected)
  })

  it('refuse un fuseau inconnu', () => {
    expect(() => formatSchedule(createdEvent.startsAt, 30, 'Mars/Olympus'))
      .toThrow(expect.objectContaining({ code: 'config_invalid' }))
  })

  it.each([
    ['quick_chat.created', 'mentor', 'Nouvelle demande de Quick Chat QC-A1B2C3', 'Jean Ndongo vous a envoyé une demande', 'confirmez votre disponibilité'],
    ['quick_chat.created', 'mentee', 'Votre demande de Quick Chat QC-A1B2C3 est envoyée', 'avec Awa Mbappé est envoyée', 'préparez vos questions'],
    ['quick_chat.updated', 'mentor', 'Quick Chat QC-A1B2C3 : nouvel horaire', 'avec Jean Ndongo a été modifié', 'prévenez le mentoré'],
    ['quick_chat.updated', 'mentee', 'Quick Chat QC-A1B2C3 : nouvel horaire', 'avec Awa Mbappé a été modifié', 'mettez à jour votre agenda'],
  ] as const)('rédige l’email %s pour le rôle %s', (type, role: ParticipantRole, subject, intro, action) => {
    const event = type === 'quick_chat.created' ? createdEvent : updatedEvent
    const email = renderEmail(event, role, options)
    const schedule = formatSchedule(event.startsAt, event.durationMinutes, options.timeZone)
    expect(email.subject).toBe(subject)
    for (const body of [email.text, email.html]) {
      expect(body).toContain('QC-A1B2C3')
      expect(body).toContain(intro)
      expect(body).toContain(action)
      expect(body).toContain(`https://app.example.test/quick-chats/${createdEvent.quickChatId}`)
      expect(body).toContain('https://www.example.test/confidentialite')
      expect(body).toContain('collectif@mongulu.cm')
    }
    expect(email.text).toContain(`Horaire : ${schedule}`)
    expect(email.html).toContain(schedule)
  })

  it('rappelle l’ancien horaire seulement pour une modification', () => {
    // L'ancienne durée n'est pas connue : l'ancien horaire est affiché sans durée.
    const previous = formatSchedule(createdEvent.startsAt, undefined, options.timeZone)
    expect(previous).toBe('jeudi 5 novembre 2026, 18 h 30 (heure de Douala, UTC+1)')
    const updated = renderEmail(updatedEvent, 'mentee', options)
    expect(updated.text).toContain(`Ancien horaire : ${previous}`)
    expect(updated.html).toContain(`<s>${previous}</s>`)
    const created = renderEmail(createdEvent, 'mentee', options)
    expect(created.text).not.toContain('Ancien horaire')
    expect(created.html).not.toContain('<s>')
  })

  it('utilise un libellé générique quand un nom manque', () => {
    const forMentor = renderEmail(anonymousMenteeEvent, 'mentor', options)
    expect(forMentor.text).toContain('\n\nVotre mentoré vous a envoyé une demande')
    const forMentee = renderEmail(anonymousMenteeEvent, 'mentee', options)
    expect(forMentee.text.startsWith('Bonjour,\n')).toBe(true)
  })

  it('utilise « votre mentor » quand le nom du mentor manque', () => {
    const forMentee = renderEmail(anonymousMentorEvent, 'mentee', options)
    expect(forMentee.text).toContain('Votre demande de Quick Chat avec votre mentor est envoyée.')
    expect(renderEmail(anonymousMentorEvent, 'mentor', options).text.startsWith('Bonjour,\n')).toBe(true)
  })

  it.each(['mentor', 'mentee'] as const)('échappe le nom du destinataire dans la salutation (%s)', (role) => {
    const email = renderEmail(hostileNamesEvent, role, options)
    const name = hostileNamesEvent[role].displayName!
    expect(email.html).toContain(`<p>Bonjour ${escapeHtml(name)},</p>`)
    expect(email.html).not.toMatch(/<script>|<img/)
  })

  it('échappe toutes les valeurs dynamiques du HTML et garde le sujet sans nom', () => {
    const email = renderEmail(hostileNamesEvent, 'mentee', options)
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain(escapeHtml(hostileNamesEvent.mentor.displayName!))
    expect(escapeHtml(hostileNamesEvent.mentor.displayName!)).toMatch(/^&#60;script&#62;alert\(&#34;x&#34;\)&#60;\/script&#62; &#38; Très long nom( Très long nom){9}$/)
    expect(email.subject).not.toContain('script')
    expect(escapeHtml(`'`)).toBe('&#39;')
  })

  it.each([
    ['URL d’application invalide', { ...options, appUrl: 'pas une url' }],
    ['protocole non web', { ...options, siteUrl: 'javascript:alert(1)' }],
  ])('refuse une configuration avec %s', (_, invalid) => {
    expect(() => renderEmail(createdEvent, 'mentor', invalid)).toThrow(expect.objectContaining({ code: 'config_invalid' }))
  })
})
