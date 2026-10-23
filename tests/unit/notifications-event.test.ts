import { describe, expect, it } from 'vitest'
import { NotificationError, validateQuickChatEvent } from '../../apps/plateforme/server/notifications/event'
import {
  anonymousMenteeEvent, createdEvent, hostileNamesEvent, updatedAgainEvent, updatedEvent,
} from '../fixtures/quick-chat-events'

function rejection(input: unknown): NotificationError {
  try {
    validateQuickChatEvent(input)
  }
  catch (error) {
    return error as NotificationError
  }
  throw new Error('événement accepté à tort')
}

describe('contrat d’événement Quick Chat', () => {
  it.each([
    ['création', createdEvent],
    ['modification', updatedEvent],
    ['seconde modification', updatedAgainEvent],
    ['mentoré sans nom', anonymousMenteeEvent],
    ['noms hostiles ou longs', hostileNamesEvent],
  ])('accepte la fixture %s', (_, event) => {
    expect(validateQuickChatEvent(event)).toEqual(event)
  })

  it('normalise les identifiants et les noms vides', () => {
    const event = validateQuickChatEvent({
      ...createdEvent,
      quickChatId: createdEvent.quickChatId.toUpperCase(),
      mentor: { ...createdEvent.mentor, userId: createdEvent.mentor.userId.toUpperCase(), displayName: '  ' },
      ignored: 'champ inconnu',
    })
    expect(event.quickChatId).toBe(createdEvent.quickChatId)
    expect(event.mentor).toEqual({ ...createdEvent.mentor, displayName: null })
    expect(event).not.toHaveProperty('ignored')
  })

  it.each([
    ['non objet', null],
    ['tableau', [createdEvent]],
    ['type inconnu', { ...createdEvent, type: 'quick_chat.cancelled' }],
    ['identifiant invalide', { ...createdEvent, quickChatId: 'qc-1' }],
    ['version nulle', { ...createdEvent, version: 0 }],
    ['version décimale', { ...createdEvent, version: 1.5 }],
    ['version textuelle', { ...createdEvent, version: '1' }],
    ['date sans fuseau', { ...createdEvent, startsAt: '2026-11-05T17:30:00' }],
    ['date impossible', { ...createdEvent, startsAt: '2026-13-45T17:30:00Z' }],
    ['date non textuelle', { ...createdEvent, startsAt: 1_700_000_000 }],
    ['jour inexistant', { ...createdEvent, startsAt: '2026-02-31T17:30:00Z' }],
    ['jour inexistant avec fuseau', { ...createdEvent, startsAt: '2026-04-31T10:00:00+01:00' }],
    ['durée trop courte', { ...createdEvent, durationMinutes: 10 }],
    ['durée trop longue', { ...createdEvent, durationMinutes: 45 }],
    ['ancien horaire sur une création', { ...createdEvent, previousStartsAt: createdEvent.startsAt }],
    ['ancien horaire invalide', { ...updatedEvent, previousStartsAt: 'hier' }],
    ['participant absent', { ...createdEvent, mentee: undefined }],
    ['participant sans uuid', { ...createdEvent, mentee: { ...createdEvent.mentee, userId: 'user' } }],
    ['email invalide', { ...createdEvent, mentee: { ...createdEvent.mentee, email: 'mentee@' } }],
    ['email avec caractère nul', { ...createdEvent, mentee: { ...createdEvent.mentee, email: 'mentee\u0000@example.test' } }],
    ['email avec en-tête injecté', { ...createdEvent, mentee: { ...createdEvent.mentee, email: 'a@b.test\nBcc: x@y.test' } }],
    ['email trop long', { ...createdEvent, mentee: { ...createdEvent.mentee, email: `${'a'.repeat(250)}@b.test` } }],
    ['nom non textuel', { ...createdEvent, mentee: { ...createdEvent.mentee, displayName: 42 } }],
    ['nom trop long', { ...createdEvent, mentee: { ...createdEvent.mentee, displayName: 'a'.repeat(201) } }],
    ['nom avec retour à la ligne', { ...createdEvent, mentee: { ...createdEvent.mentee, displayName: 'Jean\r\nBcc: x' } }],
    ['même utilisateur', { ...createdEvent, mentee: { ...createdEvent.mentee, userId: createdEvent.mentor.userId } }],
    ['même email', { ...createdEvent, mentee: { ...createdEvent.mentee, email: createdEvent.mentor.email.toUpperCase() } }],
  ])('refuse un événement avec %s', (_, input) => {
    const error = rejection(input)
    expect(error).toBeInstanceOf(NotificationError)
    expect(error.code).toBe('invalid_event')
  })

  it('ne recopie aucune valeur d’entrée dans l’erreur', () => {
    const error = rejection({ ...createdEvent, mentee: { ...createdEvent.mentee, email: 'secret@nowhere' } })
    const serialized = `${error.message} ${JSON.stringify(error)}`
    expect(serialized).not.toContain('secret')
    expect(serialized).not.toContain(createdEvent.mentor.email)
    expect(serialized).not.toContain(createdEvent.quickChatId)
  })
})
