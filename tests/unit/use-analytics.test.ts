import { afterEach, expect, it, vi } from 'vitest'
import { useAnalytics } from '../../layers/mongulu/app/composables/useAnalytics'

afterEach(() => vi.unstubAllGlobals())

it('ne tente aucune collecte pendant le rendu serveur', () => {
  // Le plugin analytics est client-only : il est absent du NuxtApp SSR.
  vi.stubGlobal('useNuxtApp', () => ({}))
  const analytics = useAnalytics()
  expect(() => analytics.track('profile.viewed')).not.toThrow()
  expect(() => analytics.exception(new Error('SSR'))).not.toThrow()
})
