export function isPkceChallenge(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

export async function linkedInAuthorizationUrl(
  supabaseUrl: string, origin: string, codeChallenge: string, request: typeof fetch = fetch,
): Promise<string> {
  // Seul le projet configuré est contacté ; aucune URL fournie par le navigateur.
  const authorize = new URL('/auth/v1/authorize', supabaseUrl)
  authorize.search = new URLSearchParams({
    provider: 'linkedin_oidc', redirect_to: `${origin}/auth/callback`,
    scopes: 'openid profile email', code_challenge: codeChallenge, code_challenge_method: 's256',
  }).toString()
  const response = await request(authorize, {
    redirect: 'manual', signal: AbortSignal.timeout(10_000),
  })
  if (response.status !== 302) throw new Error('OAuth unavailable')
  const destination = new URL(response.headers.get('location') ?? '')
  if (destination.protocol !== 'https:' || destination.username || destination.password || destination.port
    || !['api.linkedin.com', 'www.linkedin.com'].includes(destination.hostname)
    || destination.pathname !== '/oauth/v2/authorization'
    || !destination.searchParams.get('state')
    || destination.searchParams.get('redirect_uri') !== new URL('/auth/v1/callback', supabaseUrl).href) {
    throw new Error('Invalid OAuth destination')
  }
  // Conserver l'état généré par Supabase et tous les paramètres du fournisseur.
  // www reçoit le cookie de session LinkedIn ; api demande une nouvelle identification.
  destination.hostname = 'www.linkedin.com'
  return destination.href
}
