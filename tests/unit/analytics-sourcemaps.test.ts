import { expect, it } from 'vitest'
import { normalizeSourcePaths } from '../../scripts/analytics-sourcemaps.mjs'

it('conserve le mapping TypeScript et son code sans répertoire privé de build', () => {
  const root = '/private/build/repository'
  const file = `${root}/apps/plateforme/.output/posthog/server/index.js.map`
  const map = {
    sourceRoot: `${root}/apps/plateforme/.output/posthog/server`,
    sources: ['../../../server/api/auth/linkedin.post.ts', '/private/toolchain/helper.js'],
    sourcesContent: ['throw createError()', 'helper()'], mappings: 'AAAA',
  }
  expect(normalizeSourcePaths(map, file, root)).toEqual({
    sourceRoot: '', sources: ['apps/plateforme/server/api/auth/linkedin.post.ts', expect.stringMatching(/^external\/[a-f0-9]{16}\/helper\.js$/)],
    sourcesContent: ['throw createError()', 'helper()'], mappings: 'AAAA',
  })
})

it('résout les maps du navigateur dépourvues de sourceRoot', () => {
  const root = '/private/build/repository'
  const map = { sources: ['../../../app/plugins/analytics.client.ts'] }
  expect(normalizeSourcePaths(map, `${root}/layers/mongulu/.output/posthog/client/page.js.map`, root).sources)
    .toEqual(['layers/mongulu/app/plugins/analytics.client.ts'])
})

it('distingue deux sources externes homonymes sans divulguer leurs répertoires', () => {
  const sources = normalizeSourcePaths({ sources: ['/private/a/index.js', '/private/b/index.js'] }, '/repo/bundle.js.map', '/repo').sources
  expect(new Set(sources).size).toBe(2)
  expect(sources.every((source: string) => /^external\/[a-f0-9]{16}\/index\.js$/.test(source))).toBe(true)
})
