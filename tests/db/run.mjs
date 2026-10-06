import { readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Exécuter le véritable SQL de données, sans en recopier l’implémentation dans le test.
const migration = readdirSync('supabase/migrations').find(name => name.endsWith('_backfill_profiles.sql'))
if (!migration) throw new Error('Migration de données introuvable')
const sql = readFileSync(`supabase/migrations/${migration}`, 'utf8')
const dbUrl = process.env.SUPABASE_TEST_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(dbUrl).hostname)) {
  throw new Error('Ces fixtures doivent être exécutées uniquement sur une base locale jetable')
}
const tests = [
  ['profiles', readFileSync('supabase/tests/profiles.test.sql', 'utf8')],
  ['backfill', readFileSync('tests/db/backfill.template.sql', 'utf8').replaceAll('-- BACKFILL_MIGRATION', () => sql)],
]
// Envoyer le SQL par stdin évite les bind mounts macOS soumis aux autorisations Desktop.
for (const [name, input] of tests) {
  const result = spawnSync('psql', ['--dbname', dbUrl, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], { input, encoding: 'utf8' })
  if (result.error) throw result.error
  const plan = result.stdout.match(/^1\.\.(\d+)$/m)
  const passed = result.stdout.match(/^ok \d+\b/gm) ?? []
  if (result.status !== 0 || !plan || passed.length !== Number(plan[1]) || /^not ok/m.test(result.stdout)) {
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    process.exitCode = 1
  }
  else console.log(`${name}: ${passed.length} assertions pgTAP réussies`)
}
