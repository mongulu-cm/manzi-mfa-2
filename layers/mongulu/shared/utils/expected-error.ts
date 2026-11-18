export function isExpectedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = 'statusCode' in error ? error.statusCode : undefined
  return (typeof status === 'number' && status >= 400 && status < 500)
    || ('name' in error && error.name === 'AbortError')
}
