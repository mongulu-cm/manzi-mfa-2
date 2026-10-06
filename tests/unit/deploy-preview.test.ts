import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const deployment = fileURLToPath(new URL('../../apps/plateforme/scripts/deploy-preview.mjs', import.meta.url))

it.each([
  { exitCode: 0, signal: '' },
  { exitCode: 65, signal: '' },
  { exitCode: 1, signal: 'SIGTERM' },
])('supprime le fichier privé après le déploiement ($exitCode, $signal)', ({ exitCode, signal }) => {
  const fixture = mkdtempSync(join(tmpdir(), 'manzi-deploy-test-'))
  const report = join(fixture, 'report.json')
  try {
    // Remplacer seulement npx : le vrai script s'exécute, sans accès à Cloudflare.
    writeFileSync(join(fixture, 'npx'), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const filename = args[args.indexOf('--secrets-file') + 1];
fs.writeFileSync(process.env.TEST_REPORT, JSON.stringify({
  args, filename, mode: fs.statSync(filename).mode & 0o777,
  bindings: JSON.parse(fs.readFileSync(filename, 'utf8')),
}));
if (process.env.TEST_SIGNAL) process.kill(process.pid, process.env.TEST_SIGNAL);
else process.exit(Number(process.env.TEST_EXIT_CODE));
`, { mode: 0o700 })
    const result = spawnSync(process.execPath, [deployment, '--name', 'test-preview'], {
      encoding: 'utf8',
      env: {
        PATH: `${fixture}:${process.env.PATH}`,
        TEST_REPORT: report,
        TEST_EXIT_CODE: String(exitCode),
        TEST_SIGNAL: signal,
        NUXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
        NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      },
    })
    expect(result.status).toBe(exitCode)
    const observed = JSON.parse(readFileSync(report, 'utf8'))
    expect(observed.args.slice(0, 3)).toEqual(['wrangler', 'preview', '--secrets-file'])
    expect(observed.args.slice(4)).toEqual(['--name', 'test-preview'])
    expect(observed.mode).toBe(0o600)
    expect(observed.bindings).toEqual({
      NUXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    })
    expect(existsSync(dirname(observed.filename))).toBe(false)
    expect(result.stdout + result.stderr).not.toContain('sb_publishable_test')
    if (signal) expect(result.stderr).toContain(`interrompu par ${signal}`)
  }
  finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})

it('refuse les placeholders de configuration avant de lancer Wrangler', () => {
  const result = spawnSync(process.execPath, [deployment], {
    encoding: 'utf8',
    env: {
      NUXT_PUBLIC_SUPABASE_URL: 'masked-value',
      NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'masked-value',
    },
  })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('une URL Supabase HTTPS et une clé publishable valide')
  expect(result.stderr).not.toContain('masked-value')
})
