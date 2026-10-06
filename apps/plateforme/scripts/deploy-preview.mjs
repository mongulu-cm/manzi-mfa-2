import { spawnSync } from 'node:child_process'

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

// Réinjecter les deux bindings à chaque déploiement, sans fichier de secrets ni valeurs dans les arguments.
const result = spawnSync('npx', ['wrangler', 'preview', '--secrets-file', '/dev/stdin', ...process.argv.slice(2)], {
  cwd: new URL('..', import.meta.url),
  input: JSON.stringify(bindings),
  stdio: ['pipe', 'inherit', 'inherit'],
})
if (result.error) throw new Error('Impossible de lancer le déploiement de la preview')
process.exitCode = result.status ?? 1
