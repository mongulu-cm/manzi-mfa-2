import { describe, expect, it, vi } from 'vitest'
import { resolveAppUrl, useAppNavigation } from '../../apps/vitrine/app/composables/useAppNavigation'

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

describe('composable useAppNavigation', () => {
  it('fournit l’URL de login et indique que l’app est configurée', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { appUrl: 'http://localhost:3001' } }))
    vi.stubGlobal('computed', (fn: () => unknown) => ({ value: fn() }))

    const nav = useAppNavigation()
    expect(nav.isAppConfigured.value).toBe(true)
    expect(nav.getLoginUrl()).toBe('http://localhost:3001/login')
    expect(nav.supportEmail).toBe('collectif@mongulu.cm')

    vi.unstubAllGlobals()
  })

  it('fournit le lien de contact de repli si l’app n’est pas configurée', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { appUrl: undefined } }))
    vi.stubGlobal('computed', (fn: () => unknown) => ({ value: fn() }))

    const nav = useAppNavigation()
    expect(nav.isAppConfigured.value).toBe(false)
    expect(nav.getLoginUrl()).toBe('mailto:collectif@mongulu.cm?subject=Contact%20Manzi-mfa')

    vi.unstubAllGlobals()
  })
})
