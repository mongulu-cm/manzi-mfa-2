import { afterEach, describe, expect, it, vi } from 'vitest'
import { exceptionProperties } from '../../layers/mongulu/shared/utils/analytics'

function frames(stack: string, runtime: 'browser' | 'server' = 'server') {
  const error = new Error('private message')
  error.stack = stack
  return exceptionProperties(error, runtime).$exception_list[0]!.stacktrace.frames
}

describe('stacktraces PostHog', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('ne symbolique pas les dépendances comme une entrée applicative et distingue les vendors', () => {
    expect(frames('Error\n at fn (file:///build/node_modules/package/index.mjs:1:2)\n at fn (file:///build/other/index.js:1:2)')).toEqual([])
    expect(frames('Error\n at fn (https://app.test/_nuxt/vendor-abc.js:3:4)', 'browser')[0]?.in_app).toBe(false)
  })
  it('associe chaque frame au chunk injecté, avant de retirer le chemin privé', () => {
    const id = '11111111-2222-4333-8444-555555555555'
    vi.stubGlobal('_posthogChunkIds', {
      'Error\n    at file:///private/index.js:1:20\n    at other (index.js:99:1)': id,
      'Error\n    at file:///private/worker.js:1:20': 'invalid',
      'Error': id,
    })
    expect(frames('Error\n    at handler (file:///private/index.js:15:3)')[0]).toMatchObject({
      platform: 'node:javascript', filename: '/server/index.js', chunk_id: id, lineno: 15, colno: 3,
    })
    expect(frames('Error\n    at handler (file:///private/worker.js:15:3)')).toEqual([])
  })
  it('conserve les frames Wrangler observées, sans chemin local, dans l’ordre des appels', () => {
    const result = frames(`Error: private message
    at createError (file:///home/private/repo/.output/server/.wrangler/tmp/dev-ABC/index.js:1931:14)
    at Object.handler (file:///home/private/repo/.output/server/.wrangler/tmp/dev-ABC/index.js:1561:118)
    at async file:///home/private/repo/.output/server/.wrangler/tmp/dev-ABC/index.js:2368:7`)
    expect(result).toEqual([
      { platform: 'node:javascript', function: '<anonymous>', filename: '/server/index.js', lineno: 2368, colno: 7, in_app: true },
      { platform: 'node:javascript', function: 'Object.handler', filename: '/server/index.js', lineno: 1561, colno: 118, in_app: true },
      { platform: 'node:javascript', function: 'createError', filename: '/server/index.js', lineno: 1931, colno: 14, in_app: true },
    ])
    expect(JSON.stringify(result)).not.toMatch(/private|home|file:|wrangler|dev-ABC/)
  })

  it.each(['worker.js', '_worker.js', 'index.mjs'])('reconnaît le bundle Cloudflare %s', (file) => {
    expect(frames(`Error\n    at async loadProfile (${file}:20:8)`)[0]).toMatchObject({ function: 'loadProfile', filename: `/server/${file}`, lineno: 20, colno: 8 })
    expect(frames(`Error\n    at loadProfile (${file}:20:8)`, 'browser')).toEqual([])
  })

  it('conserve les chunks Nitro et les noms de fonctions statiques', () => {
    expect(frames('Error\n    at new ProfileError (file:///private/.output/server/chunks/routes/api/profile.mjs:12:4)')[0]).toMatchObject({
      function: 'new ProfileError', filename: '/chunks/routes/api/profile.mjs', lineno: 12, colno: 4,
    })
    expect(frames('Error\nfn@https://app.test/_nuxt/abc.js:5:2', 'browser')[0]).toMatchObject({ function: '<redacted>', filename: '/_nuxt/abc.js' })
  })

  it('exclut les données dynamiques, les fichiers inconnus et les frames natives', () => {
    const result = frames(`Error: private message
    at private@example.invalid (index.js:1:2)
    at ${'x'.repeat(121)} (worker.js:3:4)
    at fn (https://app.test/customer/private.js:5:6)
    at fn (https://app.test/_nuxt/chunk.js?token=secret:7:8)
    at fn (file:///private/chunks/../secret.mjs:9:10)
    at fn (node:internal/process/task_queues:11:12)
    at fn (native)
not a frame`)
    expect(result).toHaveLength(2)
    expect(result.every(frame => frame.function === '<anonymous>')).toBe(true)
    expect(JSON.stringify(result)).not.toMatch(/private|secret|token|internal|native/)
  })

  it('borne le volume de la stacktrace', () => {
    const result = frames(`Error\n${Array.from({ length: 30 }, (_, index) => `    at fn (index.js:${index + 1}:1)`).join('\n')}`)
    expect(result).toHaveLength(20)
    expect(result[0]?.lineno).toBe(20)
    expect(result.at(-1)?.lineno).toBe(1)
  })
})
