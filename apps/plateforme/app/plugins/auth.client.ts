import { createAuthService } from '../utils/auth'
import { createBrowserClient } from '../utils/supabase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const auth = createAuthService(createBrowserClient(config))
  if (import.meta.hot) import.meta.hot.dispose(auth.dispose)
  return { provide: { auth } }
})
