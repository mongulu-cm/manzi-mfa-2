type Runtime = 'browser' | 'server'

function parseFrame(line: string) {
  return line.match(/^\s*at (?:async )?(?:(.*?) \()?(.+?):(\d+):(\d+)\)?$/)
    ?? line.match(/^(.*?)@(.+?):(\d+):(\d+)$/)
}

function chunkIds() {
  // Métadonnées immuables injectées dans chaque bundle par le CLI PostHog.
  const injected = (globalThis as { _posthogChunkIds?: Record<string, string> })._posthogChunkIds ?? {}
  const files = new Map<string, string>()
  for (const [stack, id] of Object.entries(injected)) {
    if (!/^[\da-f-]{36}$/i.test(id)) continue
    const frame = stack.split('\n').slice(1).map(parseFrame).find(Boolean)
    if (frame?.[2]) files.set(frame[2], id)
  }
  return files
}

function codeFile(location: string, runtime: Runtime, instrumented: boolean) {
  // Normaliser les bundles sans transmettre le répertoire de build ni les URLs.
  if (/(?:^|\/)node_modules\//.test(location)) return
  const chunk = location.match(/\/(?:_nuxt|chunks)\/(?:[\w-]+\/)*[\w.-]+\.m?js$/)
  if (chunk) return chunk[0]
  if (runtime === 'server') {
    const worker = location.match(/(?:^|\/)((?:index|_?worker)\.m?js)$/)
    const entry = !location.includes('/') || /\/(?:\.output\/server|\.wrangler\/tmp\/[\w-]+|server)\/[^/]+$/.test(location)
    if (worker && (entry || instrumented)) return `/server/${worker[1]}`
  }
}

function codeFunction(name: string, runtime: Runtime) {
  if (runtime === 'browser') return '<redacted>'
  return /^(?:new )?[\w$]+(?:\.[\w$]+)*$/.test(name) && name.length <= 120 ? name : '<anonymous>'
}

export function exceptionFrames(stack: string, runtime: Runtime) {
  const chunks = chunkIds()
  return stack.split('\n').slice(1, 21).flatMap((line) => {
    const frame = parseFrame(line)
    if (!frame) return []
    const filename = codeFile(frame[2]!, runtime, chunks.has(frame[2]!))
    if (!filename) return []
    return [{
      platform: runtime === 'server' ? 'node:javascript' : 'web:javascript',
      ...(chunks.has(frame[2]!) ? { chunk_id: chunks.get(frame[2]!) } : {}),
      function: codeFunction(frame[1] ?? '<anonymous>', runtime),
      filename, lineno: Number(frame[3]), colno: Number(frame[4]),
      in_app: !/(?:^|[/_-])vendor(?:[/_.-]|$)/i.test(filename),
    }]
  }).reverse()
}
