import { describe, expect, it, vi } from 'vitest'
import { isPkceChallenge, linkedInAuthorizationUrl } from '../../apps/plateforme/server/utils/linkedin'

const supabaseUrl = 'https://supabase.test.invalid'
const origin = 'http://localhost:3001'
const challenge = 'a'.repeat(43)
const destination = 'https://api.linkedin.com/oauth/v2/authorization?state=supabase-state&client_id=existing-client&scope=openid+email+profile&redirect_uri=https%3A%2F%2Fsupabase.test.invalid%2Fauth%2Fv1%2Fcallback'
function upstream(location = destination, status = 302) {
  return vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status, headers: { location } }))
}

describe('redirection LinkedIn avec session existante', () => {
  it('conserve le fournisseur, le callback, PKCE et l’état Supabase en remplaçant seulement le domaine', async () => {
    const request = upstream()
    const result = await linkedInAuthorizationUrl(supabaseUrl, origin, challenge, request)
    expect(result).toBe(destination.replace('api.linkedin.com', 'www.linkedin.com'))
    const [url, options] = request.mock.calls[0]!
    expect(new URL(String(url)).origin).toBe(supabaseUrl)
    expect(new URL(String(url)).searchParams.get('provider')).toBe('linkedin_oidc')
    expect(new URL(String(url)).searchParams.get('redirect_to')).toBe(`${origin}/auth/callback`)
    expect(new URL(String(url)).searchParams.get('code_challenge')).toBe(challenge)
    expect(new URL(String(url)).searchParams.get('code_challenge_method')).toBe('s256')
    expect(options?.redirect).toBe('manual')
    expect(options?.signal).toBeInstanceOf(AbortSignal)
  })

  it('accepte aussi une URL officielle déjà corrigée par Supabase', async () => {
    const official = destination.replace('api.linkedin.com', 'www.linkedin.com')
    expect(await linkedInAuthorizationUrl(supabaseUrl, origin, challenge, upstream(official))).toBe(official)
  })

  it.each([
    destination.replace('api.linkedin.com', 'evil.invalid'),
    destination.replace('api.linkedin.com', 'api.linkedin.com.evil.invalid'),
    destination.replace('https:', 'http:'),
    destination.replace('api.linkedin.com', 'user:password@api.linkedin.com'),
    destination.replace('api.linkedin.com', 'api.linkedin.com:444'),
    destination.replace('/oauth/v2/authorization', '/other'),
    destination.replace('state=supabase-state&', ''),
    destination.replace('supabase.test.invalid', 'other-project.invalid'),
    '',
  ])('refuse une destination OAuth inattendue : %s', async (location) => {
    await expect(linkedInAuthorizationUrl(supabaseUrl, origin, challenge, upstream(location))).rejects.toThrow()
  })

  it('ne suit pas une réponse Supabase en erreur', async () => {
    await expect(linkedInAuthorizationUrl(supabaseUrl, origin, challenge, upstream(destination, 400))).rejects.toThrow()
  })

  it('laisse remonter un échec réseau pour le message de connexion récupérable', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('network'))
    await expect(linkedInAuthorizationUrl(supabaseUrl, origin, challenge, request)).rejects.toThrow('network')
  })

  it.each([null, '', 'a'.repeat(42), 'a'.repeat(44), '/'.repeat(43), { codeChallenge: challenge }])('refuse un challenge PKCE invalide : %j', (value) => {
    expect(isPkceChallenge(value)).toBe(false)
  })
  it('accepte un challenge S256 base64url', () => {
    expect(isPkceChallenge(challenge)).toBe(true)
  })
})
