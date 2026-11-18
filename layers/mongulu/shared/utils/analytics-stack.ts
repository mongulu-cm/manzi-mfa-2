type Runtime = 'browser' | 'server'

function codeFile(location: string, runtime: Runtime) {
  // Normaliser les bundles sans transmettre le répertoire de build ni les URLs.
  const chunk = location.match(/\/(?:_nuxt|chunks)\/(?:[\w-]+\/)*[\w.-]+\.m?js$/)
  if (chunk) return chunk[0]
  if (runtime === 'server') {
    const worker = location.match(/(?:^|\/)((?:index|_?worker)\.m?js)$/)
    if (worker) return `/server/${worker[1]}`
  }
}

export function exceptionFrames(stack: string, runtime: Runtime) {
  return stack.split('\n').slice(1, 21).flatMap((line) => {
    const frame = line.match(/^\s*at (?:async )?(?:(.*?) \()?(.+?):(\d+):(\d+)\)?$/)
      ?? line.match(/^(.*?)@(.+?):(\d+):(\d+)$/)
    if (!frame) return []
    const filename = codeFile(frame[2]!, runtime)
    if (!filename) return []
    const name = frame[1] ?? '<anonymous>'
    const functionName = runtime === 'server' && /^(?:new )?[\w$]+(?:\.[\w$]+)*$/.test(name) && name.length <= 120
      ? name
      : '<anonymous>'
    return [{
      platform: 'custom', lang: 'javascript',
      function: runtime === 'browser' ? '<redacted>' : functionName,
      filename, lineno: Number(frame[3]), colno: Number(frame[4]), in_app: true,
    }]
  }).reverse()
}
