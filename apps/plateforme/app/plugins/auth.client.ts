import { createAuthService } from '../utils/auth'
import { createBrowserClient } from '../utils/supabase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const auth = createAuthService(createBrowserClient(config), async (authorizationUrl) => {
    const codeChallenge = new URL(authorizationUrl).searchParams.get('code_challenge')
    const { url } = await $fetch('/api/auth/linkedin', {
      method: 'POST', body: { codeChallenge }, timeout: 12_000,
    })
    window.location.assign(url)
  })
  if (import.meta.hot) import.meta.hot.dispose(auth.dispose)
  return { provide: { auth } }
})
