import { describe, expect, it } from 'vitest'
import { DEFAULT_POLICY, idempotencyKey, parsePolicy, planNotifications } from '../../apps/plateforme/server/notifications/policy'
import { createdEvent, updatedAgainEvent, updatedEvent } from '../fixtures/quick-chat-events'

describe('politique de notification', () => {
  it('notifie par défaut le mentor et le mentoré', () => {
    const planned = planNotifications(createdEvent, DEFAULT_POLICY)
    expect(planned.map(item => [item.role, item.recipient.email])).toEqual([
      ['mentor', createdEvent.mentor.email],
      ['mentee', createdEvent.mentee.email],
    ])
  })

  it.each([undefined, null, ''])('utilise une copie de la politique par défaut pour une configuration vide (%s)', (raw) => {
    const policy = parsePolicy(raw)
    expect(policy).toEqual(DEFAULT_POLICY)
    policy.events['quick_chat.created'].recipients.pop()
    expect(DEFAULT_POLICY.events['quick_chat.created'].recipients).toEqual(['mentor', 'mentee'])
  })

  it('désactive un événement sans toucher à l’autre', () => {
    const policy = parsePolicy('{"events":{"quick_chat.updated":{"enabled":false,"recipients":["mentor","mentee"]}}}')
    expect(planNotifications(updatedEvent, policy)).toEqual([])
    expect(planNotifications(createdEvent, policy)).toHaveLength(2)
  })

  it('limite les destinataires et dédoublonne les rôles', () => {
    const policy = parsePolicy({ events: { 'quick_chat.created': { enabled: true, recipients: ['mentee', 'mentee'] } } })
    expect(planNotifications(createdEvent, policy).map(item => item.role)).toEqual(['mentee'])
  })

  it.each([
    ['JSON invalide', '{events'],
    ['sans événements', {}],
    ['événements non objet', { events: [] }],
    ['racine nulle', 'null'],
    ['événement inconnu', { events: { 'quick_chat.cancelled': { enabled: true, recipients: [] } } }],
    ['entrée non objet', { events: { 'quick_chat.created': true } }],
    ['enabled absent', { events: { 'quick_chat.created': { recipients: ['mentor'] } } }],
    ['recipients non tableau', { events: { 'quick_chat.created': { enabled: true, recipients: 'mentor' } } }],
    ['rôle inconnu', { events: { 'quick_chat.created': { enabled: true, recipients: ['admin'] } } }],
    ['clé racine inconnue', { events: {}, enabled: false }],
    ['clé d’événement inconnue', { events: { 'quick_chat.created': { enabled: true, recipients: ['mentor'], recipient: ['mentee'] } } }],
  ])('refuse une configuration avec %s', (_, raw) => {
    expect(() => parsePolicy(raw)).toThrow(expect.objectContaining({ code: 'config_invalid' }))
  })

  it('produit des clés stables, distinctes par rôle et par version', () => {
    expect(idempotencyKey(createdEvent, 'mentor'))
      .toBe('quick-chat:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d:v1:quick_chat.created:mentor')
    const keys = [createdEvent, updatedEvent, updatedAgainEvent]
      .flatMap(event => planNotifications(event, DEFAULT_POLICY).map(item => item.idempotencyKey))
    expect(new Set(keys).size).toBe(6)
    expect(planNotifications(createdEvent, DEFAULT_POLICY)).toEqual(planNotifications(createdEvent, DEFAULT_POLICY))
  })
})
