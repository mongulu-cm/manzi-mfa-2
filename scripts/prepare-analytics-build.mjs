import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SentryCli } from '@sentry/cli'
import { normalizeSourcePaths } from './analytics-sourcemaps.mjs'

// Exécuté après Nuxt, depuis le workspace de l'application.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const posthogCli = fileURLToPath(import.meta.resolve('@posthog/cli/run-posthog-cli.js'))
const output = resolve('.output')
const configPath = resolve(output, 'server/wrangler.json')
const config = JSON.parse(await readFile(configPath, 'utf8'))
const artifacts = resolve(output, 'posthog')
const client = resolve(output, 'public/_nuxt')
const server = resolve(output, 'server')
const version = process.env.SENTRY_RELEASE || process.env.WORKERS_CI_COMMIT_SHA
  || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const release = ['--release-name', config.name, '--release-version', version]
const run = (bin, args) => execFileSync(process.execPath, [resolve(root, 'node_modules', bin), ...args], {
  stdio: 'inherit',
  env: { POSTHOG_CLI_HOST: 'https://eu.posthog.com', POSTHOG_CLI_PROJECT_ID: '357089', ...process.env },
})

await mkdir(artifacts, { recursive: true })
// Conserver les modules Nitro et les debug IDs Sentry : aucune seconde compilation.
async function normalizeMaps(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await normalizeMaps(path)
    else if (entry.name.endsWith('.map')) {
      const map = normalizeSourcePaths(JSON.parse(await readFile(path, 'utf8')), path, root)
      await writeFile(path, JSON.stringify(map))
    }
  }
}
await normalizeMaps(client)
await normalizeMaps(server)
await cp(client, resolve(artifacts, 'client'), { recursive: true })
const directories = [resolve(artifacts, 'client'), server]
if (process.env.POSTHOG_CLI_API_KEY) {
  for (const directory of directories) {
    run(posthogCli, ['sourcemap', 'inject', '--directory', directory, ...release])
    run(posthogCli, ['sourcemap', 'upload', '--directory', directory, ...release])
  }
}
else if (process.env.POSTHOG_SOURCEMAPS_REQUIRED === 'true') {
  throw new Error('POSTHOG_CLI_API_KEY est nécessaire à la publication des sourcemaps.')
}
else console.info('PostHog : sourcemaps préparées localement ; aucun upload sans clé privée de build.')

// PostHog ajuste les positions pendant l'injection : Sentry reçoit les mêmes fichiers finaux.
if (process.env.SENTRY_AUTH_TOKEN) {
  const cli = new SentryCli(null, { authToken: process.env.SENTRY_AUTH_TOKEN, org: 'mongulu', project: 'manzi-mfa-2' })
  for (const directory of directories) {
    await cli.execute(['sourcemaps', 'upload', '--no-rewrite', '--wait', '--strict', '--release', version, directory], false)
  }
}
else if (process.env.SENTRY_SOURCEMAPS_REQUIRED === 'true') {
  throw new Error('SENTRY_AUTH_TOKEN est nécessaire à la publication des sourcemaps.')
}
else console.info('Sentry : aucun upload sans clé privée de build.')

// Servir exactement les fichiers injectés ; conserver les maps hors des assets publics.
await cp(resolve(artifacts, 'client'), client, { recursive: true })
async function removePublicMaps(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await removePublicMaps(path)
    else if (entry.name.endsWith('.map')) await rm(path)
  }
}
await removePublicMaps(resolve(output, 'public'))
config.no_bundle = true
config.upload_source_maps = true
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
