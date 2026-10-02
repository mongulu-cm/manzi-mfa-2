import { createServer, type Server } from 'node:http'
import dns from 'node:dns'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

// 'localhost' peut résoudre vers ::1 en premier : forcer IPv4 pour que les
// clients (fetch Node, Playwright) rejoignent le listener 127.0.0.1.
dns.setDefaultResultOrder('ipv4first')

const PORT = 6017

// Port unique du serveur statique : importé par le test a11y, la config
// vitest et documenté dans le job CI (voir .github/workflows/ci.yml).
export const STATIC_PORT = PORT
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

// Port déjà pris : un autre serveur tourne déjà, on le réutilise
// (avec un avertissement : le contenu servi peut ne pas être le nôtre).
function waitListening(server: Server): Promise<boolean> {
  return new Promise((resolve) => {
    server.on('error', () => {
      console.warn(`[serve-static] port ${PORT} occupé, réutilisation du serveur existant`)
      resolve(false)
    })
    server.listen(PORT, '127.0.0.1', () => resolve(true))
  })
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err?: Error) => err ? reject(err) : resolve())
  })
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
  const started = await waitListening(server)
  return async () => {
    if (started) {
      await closeServer(server)
    }
  }
}
