import { describe, expect, it, vi } from 'vitest'
import { createAnalyticsService } from '../../layers/mongulu/app/utils/analytics-service'
import { cookieDomain, exceptionProperties, filterProperties, parseIdentity, safePage, sanitizeCapture } from '../../layers/mongulu/shared/utils/analytics'

const anonymous = '11111111-1111-4111-8111-111111111111'
const user = '22222222-2222-4222-8222-222222222222'
const other = '33333333-3333-4333-8333-333333333333'
function fixture() {
  let id = anonymous
  let consent = true
  let identity: { id: string, identified: boolean } | undefined
  const client = {
    capture: vi.fn(), identify: vi.fn((value: string) => { id = value }),
    reset: vi.fn(() => { id = anonymous }), get_distinct_id: () => id,
  }
  const options = {
    enabled: true, surface: 'plateforme', environment: 'test', origin: 'https://app.example.test',
    consent: () => consent, identity: () => identity,
    saveIdentity: vi.fn((value: typeof identity) => { identity = value }),
    load: vi.fn(async () => client),
  }
  return {
    client, options, service: createAnalyticsService(options),
    setConsent: (value: boolean) => { consent = value },
    setIdentity: (value: typeof identity) => { identity = value },
  }
}

describe('confidentialité du contrat analytics', () => {
  it('préserve le transport sans profils automatiques ni collecte hors catalogue', () => {
    const context = { token: 'public-token', surface: 'vitrine', environment: 'test' }
    expect(sanitizeCapture(null, context)).toBeNull()
    expect(sanitizeCapture({ event: '$set', properties: {} }, context)).toBeNull()
    const event = sanitizeCapture({ event: '$pageview', properties: { email: 'private', $process_person_profile: true }, $set: { email: 'private' }, $set_once: { $initial_current_url: '?code=secret' } }, context)
    expect(event?.$set).toBeUndefined()
    expect(event?.$set_once).toBeUndefined()
    expect(event?.properties).toEqual({ ...context, schema_version: 1, runtime: 'browser', $geoip_disable: true, $ip: null, $process_person_profile: false })
    expect(sanitizeCapture({ event: '$identify', properties: {} }, context)?.properties.$process_person_profile).toBe(true)
    expect(sanitizeCapture({ event: 'profile.viewed', properties: { $is_identified: true } }, context)?.properties.$process_person_profile).toBe(true)
  })
  it('retire paramètres, fragments, routes inconnues et propriétés privées même sur identify', () => {
    expect(safePage('/login?code=secret#token')).toBe('/login')
    expect(safePage('/profile/private-id')).toBe('/other')
    expect(filterProperties({ email: 'private', $set: { name: 'private' }, $current_url: 'https://app.test/auth/callback?code=secret#token', $pathname: '/profile/secret', distinct_id: user })).toEqual({
      $current_url: 'https://app.test/auth/callback', $pathname: '/other', distinct_id: user,
    })
    expect(filterProperties({ $current_url: 'invalid' })).toEqual({})
    expect(filterProperties({ surface: 'vitrine' })).toEqual({ surface: 'vitrine' })
  })
  it('valide les identités et limite le domaine partagé', () => {
    expect(parseIdentity(JSON.stringify({ id: user, identified: true, email: 'ignored' }))).toEqual({ id: user, identified: true })
    for (const value of [null, '', '{', 'null', '{}', JSON.stringify({ id: user, identified: 'true' })]) expect(parseIdentity(value)).toBeUndefined()
    expect(cookieDomain('app.manzi.test', '.manzi.test')).toBe('manzi.test')
    expect(cookieDomain('manzi.test', 'manzi.test')).toBe('manzi.test')
    expect(cookieDomain('notmanzi.test', 'manzi.test')).toBeUndefined()
    expect(cookieDomain('localhost', '')).toBeUndefined()
  })
  it('conserve uniquement les emplacements de code des erreurs', () => {
    const error = new TypeError('email=private token=secret')
    error.stack = 'TypeError: private\n at fn (https://app.test/_nuxt/abc.js:12:5)\n at secret (https://third.test/customer/secret:1:2)'
    const result = exceptionProperties(error)
    expect(JSON.stringify(result)).not.toMatch(/private|secret|email|third/)
    expect(result.$exception_list[0]?.stacktrace.frames).toEqual([{ platform: 'custom', lang: 'javascript', function: '<redacted>', filename: '/_nuxt/abc.js', lineno: 12, colno: 5, in_app: true }])
    expect(exceptionProperties('secret').$exception_list[0]?.type).toBe('Error')
    error.name = 'private'
    error.stack = undefined
    expect(exceptionProperties(error).$exception_list[0]?.type).toBe('Error')
  })
})

describe('collecte indépendante du parcours utilisateur', () => {
  it('ne charge rien sans configuration ni consentement', async () => {
    const f = fixture()
    f.setConsent(false)
    await f.service.start()
    f.service.track('profile.viewed')
    f.service.identify(user)
    expect(f.options.load).not.toHaveBeenCalled()
    f.setConsent(true)
    f.options.enabled = false
    await f.service.start()
    expect(f.options.load).not.toHaveBeenCalled()
  })
  it('relie la visite anonyme au compte, puis isole déconnexion et changement de compte', async () => {
    const f = fixture()
    f.service.pageview('/login?code=secret')
    await Promise.all([f.service.start(), f.service.start()])
    expect(f.options.load).toHaveBeenCalledTimes(1)
    f.service.identify(user)
    expect(f.client.identify).toHaveBeenLastCalledWith(user)
    f.service.identify(other)
    expect(f.client.reset).toHaveBeenCalledWith(true)
    expect(f.client.identify).toHaveBeenLastCalledWith(other)
    f.service.identify(null)
    expect(f.options.saveIdentity).toHaveBeenLastCalledWith({ id: anonymous, identified: false })
    f.service.identify(null)
    f.service.track('profile.viewed')
    f.service.track('unknown' as 'profile.viewed')
    expect(f.client.capture).toHaveBeenLastCalledWith('profile.viewed', expect.objectContaining({ $current_url: 'https://app.example.test/login', schema_version: 1 }))
    await f.service.start()
    expect(f.options.load).toHaveBeenCalledTimes(1)
  })
  it('restaure le compte avant le premier événement et évite les doubles pages', async () => {
    const f = fixture()
    f.setIdentity({ id: user, identified: true })
    f.service.identify(user)
    await f.service.start()
    f.service.pageview('/')
    expect(f.client.capture).toHaveBeenCalledTimes(1)
    f.service.pageview('/ressources?email=private')
    expect(f.client.capture).toHaveBeenCalledTimes(2)
    f.service.exception(new Error('secret'))
    expect(f.client.capture).toHaveBeenLastCalledWith('$exception', expect.objectContaining({ $exception_level: 'error' }))
  })
  it('adopte les changements des autres onglets sans fusionner les comptes', async () => {
    const f = fixture()
    await f.service.start()
    f.service.identify(user)
    f.setIdentity({ id: other, identified: true })
    f.service.track('profile.viewed')
    expect(f.client.reset).toHaveBeenCalled()
    expect(f.client.identify).toHaveBeenLastCalledWith(other)
    f.setIdentity(undefined)
    f.service.track('profile.viewed')
    expect(f.client.get_distinct_id()).toBe(anonymous)
  })
  it('ne transmet rien après un refus, même pendant le chargement', async () => {
    const f = fixture()
    let finish!: () => void
    f.options.load.mockImplementation(async () => {
      await new Promise<void>((resolve) => {
        finish = resolve
      })
      return f.client
    })
    const pending = f.service.start()
    f.setConsent(false)
    f.service.revoke()
    finish()
    await pending
    expect(f.client.capture).not.toHaveBeenCalled()
    f.service.track('profile.viewed')
    expect(f.options.saveIdentity).toHaveBeenLastCalledWith(undefined)
  })
  it('absorbe les erreurs du SDK et du stockage', async () => {
    const f = fixture()
    f.options.load.mockRejectedValueOnce(new Error('offline'))
    await expect(f.service.start()).resolves.toBeUndefined()
    await f.service.start()
    f.client.capture.mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => f.service.track('profile.viewed')).not.toThrow()
    f.client.identify.mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => f.service.identify(user)).not.toThrow()
    f.client.reset.mockImplementation(() => {
      throw new Error('blocked')
    })
    f.options.saveIdentity.mockImplementation(() => {
      throw new Error('storage')
    })
    expect(() => f.service.revoke()).not.toThrow()
  })
})
