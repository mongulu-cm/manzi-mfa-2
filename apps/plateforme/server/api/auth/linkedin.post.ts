import { isPkceChallenge, linkedInAuthorizationUrl } from '../../utils/linkedin'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<{ codeChallenge?: unknown } | null>(event)
  if (!isPkceChallenge(body?.codeChallenge)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PKCE challenge' })
  }
  const config = useRuntimeConfig(event)
  const origin = getRequestURL(event, { xForwardedHost: false }).origin
  try {
    const url = await linkedInAuthorizationUrl(config.public.supabaseUrl, origin, body.codeChallenge)
    return { url }
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'LinkedIn sign-in unavailable' })
  }
})
