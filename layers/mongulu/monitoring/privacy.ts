import type { ErrorEvent, EventHint } from '@sentry/nuxt'

// Keep technical stacks, releases and trace IDs, without collecting user payloads.
export function sentryPrivacyOptions() {
  return {
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      databaseQueryData: false,
      queues: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    },
    enableLogs: false,
    maxBreadcrumbs: 0,
    beforeSend: filterSentryError,
  }
}

export function filterSentryError(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (isExpectedError(hint.originalException)) return null
  delete event.user
  delete event.extra
  delete event.breadcrumbs
  if (event.message) event.message = redactMessage(event.message)
  delete event.logentry
  scrubExceptions(event)
  if (event.contexts?.nuxt) {
    const { method, path } = event.contexts.nuxt
    event.contexts.nuxt = {
      method,
      path: typeof path === 'string' ? path.split(/[?#]/)[0] : undefined,
    }
  }
  if (event.request) {
    event.request = {
      method: event.request.method,
      url: event.request.url?.split(/[?#]/)[0],
    }
  }
  if (event.transaction) event.transaction = event.transaction.split(/[?#]/)[0]
  return event
}

function isExpectedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = 'statusCode' in error ? error.statusCode : undefined
  return (typeof status === 'number' && status >= 400 && status < 500)
    || ('name' in error && error.name === 'AbortError')
}

function scrubExceptions(event: ErrorEvent): void {
  for (const exception of event.exception?.values || []) {
    if (exception.value) exception.value = redactMessage(exception.value)
    for (const frame of exception.stacktrace?.frames || []) {
      delete frame.vars
      if (frame.filename) frame.filename = frame.filename.split(/[?#]/)[0]
    }
  }
}

function redactMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s"'<>]+/g, url => url.split(/[?#]/)[0]!.replace(/\/\/[^/@]+@/, '//[Filtered]@'))
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[Filtered]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [Filtered]')
    .replace(/\b(?:eyJ[A-Za-z0-9_-]+\.){2}[A-Za-z0-9_-]+\b/g, '[Filtered]')
    .replace(/\b(password|token|secret|authorization|code_verifier)\s*[:=]\s*[^\s,;]+/gi, '$1=[Filtered]')
}
