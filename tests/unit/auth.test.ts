import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js'
import { authMessages, createAuthService, safeAvatarUrl } from '../../apps/plateforme/app/utils/auth'
import { createBrowserClient } from '../../apps/plateforme/app/utils/supabase'

const user = { id: 'user-a', email: 'test@example.invalid' } as User
const profile = { id: user.id, display_name: 'Test', avatar_url: null, created_at: '2026-10-06' }
function fixture() {
  let listener: (event: AuthChangeEvent, session: Session | null) => void = () => {}
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
  }
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user } }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn((callback) => {
        listener = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
    from: vi.fn(() => query),
  }
  return {
    client, query, service: createAuthService(client as unknown as SupabaseClient),
    event: (event: AuthChangeEvent, next: User | null) => listener(event, next ? { user: next } as Session : null),
  }
}

describe('session de la plateforme', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('initialise une seule fois et valide le compte restauré', async () => {
    const { service, client } = fixture()
    await Promise.all([service.initialize(), service.initialize()])
    expect(client.auth.getUser).toHaveBeenCalledTimes(1)
    expect(service.state.user).toEqual(user)
  })

  it('reste disponible sans configuration mais interdit OAuth', async () => {
    const service = createAuthService(null)
    await service.initialize()
    await service.startLogin('http://localhost:3001')
    expect(service.state.ready).toBe(true)
    expect(service.state.configured).toBe(false)
    expect(service.state.actionError).toBe(authMessages.unavailable)
  })

  it('empêche les départs OAuth multiples et utilise le callback fixe', async () => {
    vi.useFakeTimers()
    const { service, client } = fixture()
    await Promise.all([service.startLogin('http://localhost:3001'), service.startLogin('http://localhost:3001')])
    expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(1)
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'linkedin_oidc', options: { redirectTo: 'http://localhost:3001/auth/callback', scopes: 'openid profile email' },
    })
    await vi.advanceTimersByTimeAsync(14_999)
    await service.startLogin('http://localhost:3001')
    expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(1)
    expect(service.state.signingIn).toBe(true)
    service.dispose()
  })

  it('permet de réessayer si le départ OAuth ne quitte pas la page', async () => {
    vi.useFakeTimers()
    const { service, client } = fixture()
    await service.startLogin('http://localhost:3001')
    await vi.advanceTimersByTimeAsync(15_000)
    expect(service.state.signingIn).toBe(false)
    expect(service.state.actionError).toBe(authMessages.connection)
    await service.startLogin('http://localhost:3001')
    expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(2)
    expect(service.state.signingIn).toBe(true)
    expect(service.state.actionError).toBe('')
    service.dispose()
  })

  it('un échec OAuth libère le bouton et ne laisse aucun temporisateur', async () => {
    vi.useFakeTimers()
    const { service, client } = fixture()
    client.auth.signInWithOAuth.mockResolvedValueOnce({ error: { message: 'sensitive' } })
    await service.startLogin('http://localhost:3001')
    expect(service.state.signingIn).toBe(false)
    expect(service.state.actionError).toBe(authMessages.connection)
    expect(vi.getTimerCount()).toBe(0)
    await service.startLogin('http://localhost:3001')
    expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(2)
    service.dispose()
  })

  it('la destruction du service annule la récupération OAuth', async () => {
    vi.useFakeTimers()
    const { service } = fixture()
    await service.startLogin('http://localhost:3001')
    expect(vi.getTimerCount()).toBe(1)
    service.dispose()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(service.state.signingIn).toBe(false)
    expect(service.state.actionError).toBe('')
  })

  it.each(['SIGNED_IN', 'TOKEN_REFRESHED'] as const)('%s ne charge pas le profil et annule la récupération OAuth', async (authEvent) => {
    vi.useFakeTimers()
    const { service, query, event } = fixture()
    await service.startLogin('http://localhost:3001')
    event(authEvent, user)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(query.maybeSingle).not.toHaveBeenCalled()
    expect(service.state.signingIn).toBe(false)
    expect(service.state.actionError).toBe('')
    expect(vi.getTimerCount()).toBe(0)
    await service.loadProfile()
    expect(query.maybeSingle).toHaveBeenCalledTimes(1)
    expect(service.state.profile).toEqual(profile)
  })

  it('un échange de code réussi annule la récupération OAuth', async () => {
    vi.useFakeTimers()
    const { service } = fixture()
    await service.startLogin('http://localhost:3001')
    expect(await service.completeCallback(new URLSearchParams('code=test'))).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(service.state.actionError).toBe('')
    expect(service.state.signingIn).toBe(false)
  })

  it('une session reçue après le délai efface l’erreur de connexion', async () => {
    vi.useFakeTimers()
    const { service, event } = fixture()
    await service.startLogin('http://localhost:3001')
    await vi.advanceTimersByTimeAsync(15_000)
    expect(service.state.actionError).toBe(authMessages.connection)
    event('SIGNED_IN', user)
    expect(service.state.user?.id).toBe(user.id)
    expect(service.state.actionError).toBe('')
    expect(service.state.signingIn).toBe(false)
    service.dispose()
  })

  it('échange le code une seule fois, sans destination arbitraire', async () => {
    const { service, client } = fixture()
    const params = new URLSearchParams('code=test&next=https://evil.invalid')
    expect(await Promise.all([service.completeCallback(params), service.completeCallback(params)])).toEqual([true, true])
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1)
  })

  it.each(['', 'error=access_denied&error_description=secret'])('traite un retour invalide sans exposer les détails (%s)', async (query) => {
    const { service, client } = fixture()
    expect(await service.completeCallback(new URLSearchParams(query))).toBe(false)
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(service.state.actionError).toBe(authMessages.callback)
  })

  it('un code expiré ne supprime pas une session existante', async () => {
    const { service, client } = fixture()
    await service.initialize()
    client.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { user: null }, error: { message: 'sensitive' } })
    expect(await service.completeCallback(new URLSearchParams('code=expired'))).toBe(false)
    expect(service.state.user?.id).toBe(user.id)
    expect(service.state.actionError).not.toContain('sensitive')
  })

  it('un échec réseau est récupérable et ne vaut pas déconnexion', async () => {
    const { service, client } = fixture()
    client.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 0 } })
    await service.initialize()
    expect(service.state.sessionError).toBe(authMessages.session)
    await service.retrySession()
    expect(service.state.sessionError).toBe('')
    expect(service.state.user?.id).toBe(user.id)
  })

  it('un profil manquant conserve la session et peut être rechargé', async () => {
    const { service, query } = fixture()
    await service.initialize()
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await service.loadProfile()
    expect(service.state.user?.id).toBe(user.id)
    expect(service.state.profileError).toBe(authMessages.profile)
    await service.loadProfile()
    expect(service.state.profile?.display_name).toBe('Test')
  })

  it('ignore le profil en retard après une déconnexion', async () => {
    const { service, query, event } = fixture()
    await service.initialize()
    let resolve: (value: unknown) => void = () => {}
    query.maybeSingle.mockReturnValueOnce(new Promise((r) => {
      resolve = r
    }))
    const pending = service.loadProfile()
    event('SIGNED_OUT', null)
    resolve({ data: profile, error: null })
    await pending
    expect(service.state.profile).toBeNull()
    expect(service.state.user).toBeNull()
  })

  it('vide immédiatement le profil lorsque le compte change', async () => {
    const { service, event } = fixture()
    await service.initialize()
    await service.loadProfile()
    event('SIGNED_IN', { ...user, id: 'user-b' })
    expect(service.state.profile).toBeNull()
    expect(service.state.user?.id).toBe('user-b')
    service.dispose()
  })

  it('ignore le profil de l’ancien compte pendant un changement de compte', async () => {
    const { service, query, event } = fixture()
    await service.initialize()
    let resolve: (value: unknown) => void = () => {}
    query.maybeSingle.mockReturnValueOnce(new Promise((r) => {
      resolve = r
    }))
    const pending = service.loadProfile()
    event('SIGNED_IN', { ...user, id: 'user-b' })
    resolve({ data: profile, error: null })
    await pending
    expect(service.state.profile).toBeNull()
    const nextProfile = { ...profile, id: 'user-b', display_name: 'Autre compte' }
    query.maybeSingle.mockResolvedValueOnce({ data: nextProfile, error: null })
    await service.loadProfile()
    expect(service.state.profile).toEqual(nextProfile)
    expect(query.eq).toHaveBeenLastCalledWith('id', 'user-b')
  })

  it('une erreur de déconnexion garde le compte et permet de réessayer', async () => {
    const { service, client } = fixture()
    await service.initialize()
    client.auth.signOut.mockResolvedValueOnce({ error: { message: 'network' } })
    expect(await service.logout()).toBe(false)
    expect(service.state.user?.id).toBe(user.id)
    expect(await service.logout()).toBe(true)
    expect(service.state.user).toBeNull()
    expect(service.state.profile).toBeNull()
  })
})

describe('photo du profil', () => {
  it.each([null, '', 'http://image.invalid/a', 'javascript:alert(1)', 'https://user:pass@image.invalid/a'])('refuse une URL non sûre (%s)', (url) => {
    expect(safeAvatarUrl(url)).toBeUndefined()
  })
  it('accepte une photo HTTPS', () => {
    expect(safeAvatarUrl('https://image.invalid/photo.png')).toBe('https://image.invalid/photo.png')
  })
})

describe('configuration publique', () => {
  it.each([
    { supabaseUrl: '', supabasePublishableKey: '' },
    { supabaseUrl: 'https://project.supabase.co', supabasePublishableKey: 'sb_secret_forbidden' },
    { supabaseUrl: 'invalid-url', supabasePublishableKey: 'sb_publishable_test' },
  ])('refuse une configuration absente ou dangereuse', (config) => {
    expect(createBrowserClient(config)).toBeNull()
  })
})
