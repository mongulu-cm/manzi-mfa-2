import { describe, expect, it } from 'vitest'
import { resolveAppUrl } from '../../apps/vitrine/app/composables/useAppNavigation'

describe('résolution d’URL applicative', () => {
  it('construit l’URL de login avec une base valide', () => {
    expect(resolveAppUrl('http://localhost:3001', '/login')).toBe('http://localhost:3001/login')
    expect(resolveAppUrl('https://app.manzi-mfa-2.mongulu.cm/', '/login')).toBe('https://app.manzi-mfa-2.mongulu.cm/login')
  })

  it('renvoie null si la base est absente ou vide', () => {
    expect(resolveAppUrl(undefined, '/login')).toBeNull()
    expect(resolveAppUrl('', '/login')).toBeNull()
  })

  it('renvoie null si la base est une URL invalide', () => {
    expect(resolveAppUrl('not-a-valid-url', '/login')).toBeNull()
  })
})
