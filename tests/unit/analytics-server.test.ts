import { afterEach, expect, it, vi } from 'vitest'

vi.mock('h3', () => ({ getCookie: (_event: unknown, name: string) => cookies[name] }))
const cookies: Record<string, string | undefined> = {}
afterEach(() => {
  vi.unstubAllGlobals()
})

it('signale les erreurs Nitro consenties en arrière-plan sans données de requête ni blocage réseau', async () => {
  vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
  const config = { public: { posthogKey: 'test', posthogHost: 'https://posthog.test.invalid', analyticsSurface: 'plateforme', analyticsEnvironment: 'test' } }
  vi.stubGlobal('useRuntimeConfig', () => config)
  const send = vi.fn().mockResolvedValue({ status: 1 })
  vi.stubGlobal('$fetch', send)
  const hook = vi.fn()
  const plugin = (await import('../../layers/mongulu/server/plugins/analytics')).default
  plugin({ hooks: { hook } } as never)
  const report = hook.mock.calls[0]![1] as (error: Error, context: { event?: { waitUntil: (promise: Promise<void>) => void } }) => void
  const waitUntil = vi.fn()
  const event = { waitUntil }
  const error = new Error('private email token')
  error.stack = 'Error: private email token\n    at Object.handler (file:///private/.wrangler/tmp/dev-test/index.js:1561:118)'
  report(error, {})
  report(error, { event })
  expect(send).not.toHaveBeenCalled()
  cookies.manzi_analytics_consent_v2 = 'accepted'
  report(error, { event })
  expect(send).not.toHaveBeenCalled()
  cookies.manzi_analytics_identity_v1 = JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', identified: false })
  config.public.posthogKey = ''
  report(error, { event })
  expect(send).not.toHaveBeenCalled()
  config.public.posthogKey = 'test'
  report(error, { event })
  await waitUntil.mock.calls[0]![0]
  expect(send).toHaveBeenCalledWith('https://posthog.test.invalid/i/v0/e/', expect.objectContaining({
    method: 'POST', timeout: 3000, retry: 0,
    body: expect.objectContaining({ event: '$exception', properties: expect.objectContaining({ $geoip_disable: true, runtime: 'server' }) }),
  }))
  expect(JSON.stringify(send.mock.calls)).not.toMatch(/private|email|token/)
  expect(send.mock.calls[0]![1].body.properties.$exception_list[0].stacktrace.frames).toEqual([
    { platform: 'node:javascript', function: 'Object.handler', filename: '/server/index.js', lineno: 1561, colno: 118, in_app: true },
  ])
  send.mockRejectedValueOnce(new Error('offline'))
  report(error, { event })
  await expect(waitUntil.mock.calls[1]![0]).resolves.toBeUndefined()
  cookies.manzi_analytics_identity_v1 = JSON.stringify({ id: 'membre@example.invalid', identified: true })
  report(error, { event })
  await waitUntil.mock.calls[2]![0]
  expect(send.mock.calls[2]![1].body).toMatchObject({
    distinct_id: 'membre@example.invalid', properties: { $process_person_profile: true, runtime: 'server' },
  })
})
