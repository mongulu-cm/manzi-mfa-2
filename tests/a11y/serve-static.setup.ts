import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const PORT = 6007
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

// Serveur éphémère localhost pour les tests (jamais exposé) : volontairement
// minimal, sans contrôle de traversal.
export default async function setup(): Promise<() => Promise<void>> {
  const dir = join(process.cwd(), 'storybook-static')
  const server: Server = createServer(async (req, res) => {
    const path = join(dir, decodeURIComponent((req.url ?? '/').split('?')[0]))
    const body = await readFile(path).catch(() => null)
    if (body === null) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream' })
    res.end(body)
  })
  await new Promise<void>(resolve => server.listen(PORT, resolve))
  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => err ? reject(err) : resolve())
    })
  }
}
