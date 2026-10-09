export function resolveAppUrl(baseUrl: string | undefined | null, path: string = '/'): string | null {
  if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return null
  }
  try {
    return new URL(path, baseUrl).href
  }
  catch {
    return null
  }
}

export function useAppNavigation() {
  const config = useRuntimeConfig()
  const supportEmail = 'collectif@mongulu.cm'
  const appBaseUrl = config.public?.appUrl as string | undefined

  const isAppConfigured = computed(() => {
    return resolveAppUrl(appBaseUrl, '/') !== null
  })

  function getLoginUrl(): string {
    const resolved = resolveAppUrl(appBaseUrl, '/login')
    if (resolved) {
      return resolved
    }
    return `mailto:${supportEmail}?subject=Contact%20Manzi-mfa`
  }

  return {
    getLoginUrl,
    isAppConfigured,
    supportEmail,
  }
}
