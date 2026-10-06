import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { assertAccountProfile } from './profile-check.mjs'

// Smoke opt-in, hors CI. Aucune trace, capture, session ou donnée personnelle sauvegardée.
try {
  process.loadEnvFile('.env')
}
catch { /* Les variables peuvent également être exportées, ou la connexion faite à la main. */ }
const appUrl = process.env.E2E_LINKEDIN_APP_URL ?? 'https://app.manzi-mfa-2.mongulu.cm'
assert.ok(['https://app.manzi-mfa-2.mongulu.cm', 'http://localhost:3001'].includes(appUrl))
const projectRef = 'gdcirvvqangyraxauggy'
const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()
page.setDefaultTimeout(15_000)
let stage = 'ouverture'

async function platformScreen(pathname) {
  if (pathname === '/') return 'ready'
  if (pathname !== '/login') return 'waiting'
  if (await page.getByRole('alert').count()) throw new Error('oauth_failed')
  return 'waiting'
}
function isLinkedIn(hostname) {
  return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')
}
async function screen() {
  const url = new URL(page.url())
  if (url.origin === appUrl) return platformScreen(url.pathname)
  return isLinkedIn(url.hostname) ? 'linkedin' : 'waiting'
}
async function submitCredentials() {
  const credentials = [process.env.E2E_LINKEDIN_USERNAME, process.env.E2E_LINKEDIN_PASSWORD]
  if (!credentials.every(Boolean)) return false
  const form = await Promise.all([page.locator('#username').count(), page.locator('#password').count()])
  if (!form.every(Boolean)) return false
  await page.locator('#username').fill(credentials[0])
  await page.locator('#password').fill(credentials[1])
  await page.locator('#password').press('Enter')
  return true
}
function notifyManual(state) {
  if (state.notified) return
  console.log('Intervention humaine possible dans le navigateur : autorisation LinkedIn ou validation de sécurité. Le test attend ; il ne clique pas ces contrôles.')
  state.notified = true
}
async function linkedinStep(state) {
  if (await page.getByText('The redirect_uri does not match the registered value', { exact: true }).count()) {
    console.error('Le callback Supabase doit être enregistré dans LinkedIn Developers.')
    throw new Error('redirect_registration')
  }
  if (!state.submitted) state.submitted = await submitCredentials()
  notifyManual(state)
}
async function connect() {
  await page.getByRole('button', { name: 'Continuer avec LinkedIn', exact: true }).click()
  const deadline = Date.now() + 600_000
  const state = { submitted: false, notified: false }
  while (Date.now() < deadline) {
    const step = await screen()
    if (step === 'ready') {
      await page.getByRole('button', { name: 'Se déconnecter', exact: true }).waitFor()
      await page.locator('main dd').waitFor()
      return
    }
    if (step === 'linkedin') await linkedinStep(state)
    await page.waitForTimeout(1000)
  }
  throw new Error('manual_validation_timeout')
}

async function validateAccount(initialProvider) {
  const id = await page.evaluate((ref) => {
    const value = localStorage.getItem(`sb-${ref}-auth-token`)
    return value ? JSON.parse(value).user?.id : null
  }, projectRef)
  assert.match(id ?? '', /^[0-9a-f-]{36}$/i)
  const query = `
    with account as (select email, raw_user_meta_data from auth.users where id='${id}'::uuid),
      profile as (select display_name, avatar_url from public.profiles where id='${id}'::uuid)
    select (select count(*) from account)=1 as unique_account,
      (select count(*) from profile)=1 as unique_profile,
      coalesce((select nullif(btrim(display_name), '') is not null from profile), false) as has_name,
      coalesce((select avatar_url ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$' from profile), false) as has_photo,
      coalesce((select nullif(btrim(email), '') is not null from account), false) as has_email,
      coalesce((select display_name = nullif(btrim(raw_user_meta_data ->> 'name'), '')
        from profile cross join account), false) as matches_name,
      coalesce((select avatar_url = raw_user_meta_data ->> 'picture'
        from profile cross join account), false) as matches_photo,
      coalesce((select lower(btrim(email)) = lower(btrim(raw_user_meta_data ->> 'email'))
        from account), false) as matches_email,
      (select encode(extensions.digest(jsonb_build_array(display_name, avatar_url)::text, 'sha256'), 'hex')
        from profile) as profile_fingerprint,
      coalesce((select jsonb_typeof(raw_user_meta_data -> 'name') = 'string'
        and nullif(btrim(raw_user_meta_data ->> 'name'), '') is not null from account), false) as provider_has_name,
      coalesce((select jsonb_typeof(raw_user_meta_data -> 'picture') = 'string'
        and (raw_user_meta_data ->> 'picture') ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$' from account), false) as provider_has_photo,
      coalesce((select jsonb_typeof(raw_user_meta_data -> 'email') = 'string'
        and nullif(btrim(raw_user_meta_data ->> 'email'), '') is not null from account), false) as provider_has_email`
  const result = JSON.parse(execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--project-ref', projectRef, query, '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
  const values = result.rows[0]
  assertAccountProfile(values, initialProvider)
  // Ni les valeurs personnelles ni leur empreinte ne sortent dans les logs.
  console.log(JSON.stringify({
    unique_account: values.unique_account, unique_profile: values.unique_profile,
    has_name: values.has_name, has_photo: values.has_photo, has_email: values.has_email, stage,
  }))
  return { id, values }
}

try {
  await page.goto(`${appUrl}/login`)
  stage = 'première connexion'
  await connect()
  // Le profil est figé à sa création : garder ces attentes si LinkedIn change ensuite ses métadonnées.
  const account = await validateAccount()
  stage = 'restauration'
  await page.reload()
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).waitFor()
  await page.locator('main dd').waitFor()
  assert.equal((await validateAccount(account.values)).id, account.id)
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click()
  await page.waitForURL(`${appUrl}/login`)
  stage = 'reconnexion'
  await connect()
  assert.equal((await validateAccount(account.values)).id, account.id)
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click()
  await page.waitForURL(`${appUrl}/login`)
  console.log('Smoke LinkedIn réel réussi : même compte et profil, session restaurée, déconnexion vérifiée.')
}
catch {
  // Ne jamais imprimer les erreurs Playwright de fill : elles peuvent contenir la valeur saisie.
  console.error(`Smoke LinkedIn réel non validé à l’étape : ${stage}. Vérifier le navigateur et la configuration OAuth.`)
  process.exitCode = 1
}
finally { await browser.close() }
