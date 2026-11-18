import type { AnalyticsEvent } from '../../shared/utils/analytics'

export function useAnalytics() {
  const app = useNuxtApp()
  return {
    track: (event: AnalyticsEvent) => { if (import.meta.client) app.$analytics.track(event) },
    exception: (error: unknown) => { if (import.meta.client) app.$analytics.exception(error) },
  }
}
