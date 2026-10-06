import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Le build Cloudflare fournit ces variables ; en local, utiliser uniquement le .env de cette application.
try {
  process.loadEnvFile(new URL('../.env', import.meta.url))
}
catch (error) {
  if (error.code !== 'ENOENT') throw new Error('Impossible de charger la configuration publique de la plateforme', { cause: error })
}

const names = ['NUXT_PUBLIC_SUPABASE_URL', 'NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
const bindings = Object.fromEntries(names.map(name => [name, process.env[name]]))
if (names.some(name => !bindings[name]?.trim())) {
  throw new Error('Configurer NUXT_PUBLIC_SUPABASE_URL et NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY avant de déployer la preview')
}
if (!URL.canParse(bindings.NUXT_PUBLIC_SUPABASE_URL)
  || new URL(bindings.NUXT_PUBLIC_SUPABASE_URL).protocol !== 'https:'
  || !bindings.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
  throw new Error('La configuration de preview exige une URL Supabase HTTPS et une clé publishable valide')
}

// /dev/stdin n'est pas lisible avec les sockets de spawnSync sous Linux.
// Un fichier privé et éphémère fonctionne aussi dans Workers Builds.
const directory = mkdtempSync(join(tmpdir(), 'manzi-preview-'))
try {
  const filename = join(directory, 'bindings.json')
  writeFileSync(filename, JSON.stringify(bindings), { mode: 0o600 })
  const result = spawnSync('npx', ['wrangler', 'preview', '--secrets-file', filename, ...process.argv.slice(2)], {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
  })
  if (result.error) throw new Error('Impossible de lancer le déploiement de la preview')
  if (result.signal) console.error(`Déploiement de la preview interrompu par ${result.signal}`)
  process.exitCode = result.status ?? 1
}
finally {
  rmSync(directory, { recursive: true, force: true })
}
