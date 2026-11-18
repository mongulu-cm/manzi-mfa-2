import type { ErrorEvent, EventHint, StackFrame } from '@sentry/nuxt'
import { isExpectedError } from '../shared/utils/expected-error'

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
      path: typeof path === 'string' ? scrubUrl(path) : undefined,
    }
  }
  if (event.request) {
    event.request = {
      method: event.request.method,
      url: event.request.url ? scrubUrl(event.request.url) : undefined,
    }
  }
  if (event.transaction) event.transaction = scrubUrl(event.transaction)
  return event
}

function scrubExceptions(event: ErrorEvent): void {
  for (const exception of event.exception?.values || []) {
    if (exception.value) exception.value = redactMessage(exception.value)
    scrubFrames(exception.stacktrace?.frames || [])
  }
}

function scrubFrames(frames: StackFrame[]): void {
  for (const frame of frames) {
    delete frame.vars
    if (frame.abs_path) frame.abs_path = scrubUrl(frame.abs_path)
    if (frame.filename) frame.filename = scrubUrl(frame.filename)
  }
}

function scrubUrl(value: string): string {
  return value.split(/[?#]/)[0]!.replace(/(https?:\/\/)[^/@\s]+@/gi, '$1[Filtered]@')
}

function redactMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s"'<>]+/g, scrubUrl)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[Filtered]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [Filtered]')
    .replace(/\b(?:eyJ[A-Za-z0-9_-]+\.){2}[A-Za-z0-9_-]+\b/g, '[Filtered]')
    .replace(/\b([\w-]*(?:password|token|secret|authorization|code_verifier))["']?\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}\]]+)/gi, '$1=[Filtered]')
}
