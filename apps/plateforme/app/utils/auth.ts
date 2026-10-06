import { reactive, readonly } from 'vue'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export const authMessages = {
  unavailable: 'La connexion est momentanément indisponible. Réessayez plus tard.',
  connection: 'La connexion a échoué. Vous pouvez réessayer avec LinkedIn.',
  callback: 'La connexion a été annulée ou a expiré. Réessayez avec LinkedIn.',
  session: 'Impossible de vérifier votre session. Vérifiez votre connexion et réessayez.',
  profile: 'Impossible de charger votre profil. Vous pouvez réessayer sans vous reconnecter.',
  logout: 'La déconnexion a échoué. Vérifiez votre connexion et réessayez.',
}

export function safeAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href
  }
  catch { /* Une image invalide utilise l’avatar de remplacement. */ }
}

// Une instance par application, créée par le plugin client ; aucun état global.
export function createAuthService(client: SupabaseClient | null) {
  const state = reactive({
    configured: Boolean(client),
    ready: false,
    user: null as { id: string, email?: string } | null,
    profile: null as Profile | null,
    profileLoading: false,
    profileError: '',
    sessionError: '',
    actionError: '',
    signingIn: false,
    signingOut: false,
  })
  let revision = 0
  let profileRequest = 0
  let initialization: Promise<void> | undefined
  let callback: Promise<boolean> | undefined
  let loginRecovery: ReturnType<typeof setTimeout> | undefined

  function resetLogin() {
    if (loginRecovery !== undefined) clearTimeout(loginRecovery)
    loginRecovery = undefined
    state.signingIn = false
  }

  function setUser(user: User | null) {
    revision++
    if (user) resetLogin()
    if (state.user?.id !== user?.id) {
      profileRequest++
      state.profile = null
      state.profileError = ''
      state.profileLoading = false
    }
    state.user = user ? { id: user.id, email: user.email } : null
  }

  async function loadProfile() {
    if (!client || !state.user) return
    const id = state.user.id
    const request = ++profileRequest
    const isCurrent = () => request === profileRequest
    state.profileLoading = true
    state.profileError = ''
    try {
      const { data, error } = await client.from('profiles')
        .select('id, display_name, avatar_url, created_at').eq('id', id).maybeSingle()
      if (!isCurrent()) return
      if (error || !data) throw new Error('profile unavailable')
      state.profile = data as Profile
    }
    catch {
      if (isCurrent()) state.profileError = authMessages.profile
    }
    finally {
      if (isCurrent()) state.profileLoading = false
    }
  }

  // Ne pas attendre une autre méthode Auth dans le listener : le SDK tient son verrou.
  const subscription = client?.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') return
    setUser(session?.user ?? null)
    state.sessionError = ''
  }).data.subscription

  async function restoredUser(): Promise<User | null> {
    if (!client) return null
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    if (!data.session) return null
    const result = await client.auth.getUser()
    if (!result.error) return result.data.user
    if ([401, 403].includes(result.error.status ?? 0)) return null
    throw result.error
  }

  function initialize(): Promise<void> {
    initialization ??= (async () => {
      if (!client) {
        state.ready = true
        return
      }
      const current = revision
      state.sessionError = ''
      try {
        const user = await restoredUser()
        if (current === revision) setUser(user)
      }
      catch {
        if (current === revision) state.sessionError = authMessages.session
      }
      finally { state.ready = true }
    })()
    return initialization
  }

  async function retrySession() {
    initialization = undefined
    await initialize()
  }

  async function startLogin(origin: string) {
    if (state.signingIn) return
    state.actionError = ''
    if (!client) {
      state.actionError = authMessages.unavailable
      return
    }
    state.signingIn = true
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: { redirectTo: `${origin}/auth/callback`, scopes: 'openid profile email' },
      })
      if (error) throw error
      // Garder le verrou pendant le départ, mais permettre de réessayer si la page reste ouverte.
      if (state.signingIn) {
        loginRecovery = setTimeout(() => {
          resetLogin()
          state.actionError = authMessages.connection
        }, 15_000)
      }
    }
    catch {
      state.actionError = authMessages.connection
      resetLogin()
    }
  }

  function completeCallback(params: URLSearchParams): Promise<boolean> {
    callback ??= (async () => {
      const code = params.get('code')
      if (!client || !code || params.has('error') || params.has('error_code')) {
        state.actionError = client ? authMessages.callback : authMessages.unavailable
        return false
      }
      try {
        const { data, error } = await client.auth.exchangeCodeForSession(code)
        if (error || !data.user) throw new Error('invalid callback')
        setUser(data.user)
        state.sessionError = ''
        return true
      }
      catch {
        state.actionError = authMessages.callback
        return false
      }
    })()
    return callback
  }

  async function logout(): Promise<boolean> {
    if (!client || state.signingOut) return false
    state.signingOut = true
    state.actionError = ''
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
      setUser(null)
      return true
    }
    catch {
      state.actionError = authMessages.logout
      return false
    }
    finally { state.signingOut = false }
  }

  return {
    state: readonly(state), initialize, retrySession, startLogin, completeCallback, loadProfile, logout,
    dispose: () => {
      resetLogin()
      subscription?.unsubscribe()
    },
  }
}
