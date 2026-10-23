import type { QuickChatEvent } from '../../apps/plateforme/server/notifications/event'

// Domaine réservé (RFC 2606) : aucune adresse réelle.
export const mentor = {
  userId: '11111111-1111-4111-8111-111111111111',
  displayName: 'Awa Mbappé',
  email: 'mentor@example.test',
}

export const mentee = {
  userId: '22222222-2222-4222-8222-222222222222',
  displayName: 'Jean Ndongo',
  email: 'mentee@example.test',
}

export const createdEvent: QuickChatEvent = {
  type: 'quick_chat.created',
  quickChatId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  version: 1,
  startsAt: '2026-11-05T17:30:00Z',
  durationMinutes: 30,
  mentor,
  mentee,
}

export const updatedEvent: QuickChatEvent = {
  ...createdEvent,
  type: 'quick_chat.updated',
  version: 2,
  startsAt: '2026-11-06T09:00:00+01:00',
  durationMinutes: 15,
  previousStartsAt: createdEvent.startsAt,
}

export const updatedAgainEvent: QuickChatEvent = {
  ...updatedEvent,
  version: 3,
  startsAt: '2026-11-07T10:15:00+01:00',
  previousStartsAt: updatedEvent.startsAt,
}

export const anonymousMenteeEvent: QuickChatEvent = {
  ...createdEvent,
  mentee: { ...mentee, displayName: null },
}

export const anonymousMentorEvent: QuickChatEvent = {
  ...createdEvent,
  mentor: { ...mentor, displayName: null },
}

export const hostileNamesEvent: QuickChatEvent = {
  ...createdEvent,
  mentor: { ...mentor, displayName: `<script>alert("x")</script> & ${'Très long nom '.repeat(10).trim()}` },
  mentee: { ...mentee, displayName: '<img src=x onerror=alert(1)> "Jean" & \'Ndongo\'' },
}
