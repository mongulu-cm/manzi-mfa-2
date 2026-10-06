import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'

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

async function validateAccount() {
  const id = await page.evaluate((ref) => {
    const value = localStorage.getItem(`sb-${ref}-auth-token`)
    return value ? JSON.parse(value).user?.id : null
  }, projectRef)
  assert.match(id ?? '', /^[0-9a-f-]{36}$/i)
  const query = `select (select count(*) from auth.users where id='${id}'::uuid)=1 as unique_account, (select count(*) from public.profiles where id='${id}'::uuid)=1 as unique_profile, (select display_name is not null from public.profiles where id='${id}'::uuid) as has_name, (select avatar_url is not null from public.profiles where id='${id}'::uuid) as has_photo, (select email is not null from auth.users where id='${id}'::uuid) as has_email`
  const result = JSON.parse(execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--project-ref', projectRef, query, '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
  const values = result.rows[0]
  assert.equal(values.unique_account, true)
  assert.equal(values.unique_profile, true)
  console.log(JSON.stringify({ ...values, stage }))
  return id
}

try {
  await page.goto(`${appUrl}/login`)
  stage = 'première connexion'
  await connect()
  const id = await validateAccount()
  stage = 'restauration'
  await page.reload()
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).waitFor()
  await page.locator('main dd').waitFor()
  assert.equal(await validateAccount(), id)
  await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click()
  await page.waitForURL(`${appUrl}/login`)
  stage = 'reconnexion'
  await connect()
  assert.equal(await validateAccount(), id)
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
