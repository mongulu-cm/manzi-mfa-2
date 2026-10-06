import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'
import axe from 'axe-core'

const root = fileURLToPath(new URL('../..', import.meta.url))
const vitrineUrl = 'http://127.0.0.1:3100'
const appUrl = 'http://127.0.0.1:3101'
const servers = []
let browser

async function isServerReady(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(3000) })
    return response.ok
  }
  catch { return false }
}

async function waitForServer(app, port, child, getOutput) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${app} s'est arrêté : ${getOutput()}`)
    if (await isServerReady(port)) return
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Démarrage de ${app} trop long : ${getOutput()}`)
}

async function startServer(app, port) {
  let output = ''
  const child = spawn(process.execPath, [
    'node_modules/nuxt/bin/nuxt.mjs', 'dev', `apps/${app}`,
    '--host', '127.0.0.1', '--port', String(port),
    '--envName', 'test',
  ], {
    cwd: root,
    env: {
      ...process.env, NUXT_PUBLIC_APP_URL: appUrl, NUXT_PUBLIC_SITE_URL: vitrineUrl,
      NUXT_PUBLIC_SUPABASE_URL: 'https://supabase.test.invalid',
      NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  servers.push(child)
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      output = (output + chunk).slice(-10_000)
    })
  }
  await waitForServer(app, port, child, () => output)
}

before(async () => {
  await Promise.all([startServer('vitrine', 3100), startServer('plateforme', 3101)])
  browser = await chromium.launch()
}, { timeout: 150_000 })

after(async () => {
  await browser?.close()
  for (const server of servers) server.kill('SIGTERM')
})

// OAuth simulé : aucun appel à LinkedIn ni donnée réelle dans ces tests CI.
const authUser = {
  id: 'a0000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated',
  email: 'membre@example.invalid', user_metadata: { name: 'Membre Test' },
  app_metadata: { provider: 'linkedin_oidc', providers: ['linkedin_oidc'] },
  identities: [], created_at: '2026-10-06T00:00:00Z',
}
function authSession() {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const access_token = [
    { alg: 'HS256', typ: 'JWT' }, { sub: authUser.id, exp, aud: 'authenticated' },
  ].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.') + '.test'
  return { access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'test-refresh-token', user: authUser }
}
async function mockAuth(page, options = {}) {
  const calls = { exchanges: 0, authorizations: 0 }
  await page.route(`${appUrl}/api/auth/linkedin`, async (route) => {
    calls.authorizations++
    assert.equal(route.request().method(), 'POST')
    assert.match(route.request().postDataJSON().codeChallenge, /^[A-Za-z0-9_-]{43}$/)
    if (options.authorizationError) {
      await route.fulfill({ status: 502, json: { message: 'private-upstream-detail' } })
      return
    }
    await route.fulfill({ json: { url: 'https://www.linkedin.com/oauth/v2/authorization?state=test-state' } })
  })
  await page.route('https://www.linkedin.com/oauth/v2/authorization?**', route => route.fulfill({
    status: 302, headers: { location: `${appUrl}/auth/callback?code=test-code&next=https://evil.invalid` },
  }))
  await page.route('https://supabase.test.invalid/**', async (route) => {
    const url = new URL(route.request().url())
    const handlers = {
      '/auth/v1/token': async () => {
        calls.exchanges++
        if (options.invalidCode) {
          await route.fulfill({ status: 400, json: { error_code: 'bad_code_verifier', msg: 'private-provider-detail' } })
          return
        }
        assert.equal(url.searchParams.get('grant_type'), 'pkce')
        const body = route.request().postDataJSON()
        assert.equal(body.auth_code, 'test-code')
        assert.ok(body.code_verifier)
        await route.fulfill({ json: authSession() })
      },
      '/auth/v1/user': () => route.fulfill({ json: authUser }),
      '/auth/v1/logout': () => route.fulfill({ status: 204 }),
      '/rest/v1/profiles': async () => {
        assert.equal(url.searchParams.get('id'), `eq.${authUser.id}`)
        if (options.profileError) await route.fulfill({ status: 500, json: { message: 'database unavailable' } })
        else await route.fulfill({ json: { id: authUser.id, display_name: 'Membre Test', avatar_url: null, created_at: authUser.created_at } })
      },
    }
    await (handlers[url.pathname]?.() ?? route.abort())
  })
  return calls
}

test('le départ LinkedIn refuse les challenges invalides sans cache', async () => {
  const response = await fetch(`${appUrl}/api/auth/linkedin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codeChallenge: 'invalid' }),
  })
  assert.equal(response.status, 400)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('un échec du départ LinkedIn garde le bouton disponible pour réessayer', async () => {
  const page = await browser.newPage()
  try {
    const options = { authorizationError: true }
    await mockAuth(page, options)
    await page.goto(`${appUrl}/login`)
    const connect = page.getByRole('button', { name: 'Continuer avec LinkedIn' })
    await connect.click()
    await page.getByRole('alert').getByText(/La connexion a échoué/).waitFor()
    assert.doesNotMatch(await page.locator('main').textContent(), /private-upstream-detail/)
    assert.equal(await connect.isEnabled(), true)
    options.authorizationError = false
    await connect.click()
    await page.waitForURL(`${appUrl}/`)
    await page.getByRole('heading', { name: 'Bienvenue, Membre Test' }).waitFor()
  }
  finally { await page.close() }
}, { timeout: 30_000 })

function normalizedPolicyText(text) {
  return text.normalize('NFC').replace(/\s+/gu, ' ').trim()
}

function markdownPolicyText(text) {
  return normalizedPolicyText(text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|`/g, ''))
}

function policyTableBlocks(block) {
  const rows = block.split('\n')
  assert.match(rows[1], /^\|\s*-+/)
  return rows.slice(2).flatMap(row => row.split('|').slice(1, -1)
    .map((cell, index) => ({ tag: index === 0 ? 'dt' : 'dd', text: markdownPolicyText(cell) })))
}

function policyHeadingBlock(heading) {
  assert.ok(['#', '###'].includes(heading[1]), 'Les titres publics sont le titre principal et les sections numérotées')
  return [{ tag: heading[1] === '#' ? 'h1' : 'h2', text: markdownPolicyText(heading[2].replace(/ — Manzi-mfa$/, '')) }]
}

function policyMarkdownBlock(block) {
  if (block.startsWith('|')) return policyTableBlocks(block)
  if (block.startsWith('- ')) {
    return block.split('\n').map(line => ({ tag: 'li', text: markdownPolicyText(line.replace(/^- /, '')) }))
  }
  const heading = /^(#{1,3}) (.+)$/.exec(block)
  if (heading) return policyHeadingBlock(heading)
  return [{ tag: 'p', text: markdownPolicyText(block) }]
}

function publicPolicyBlocks(markdown) {
  const parts = /^([\s\S]+?)^## Partie 1 — Résumé\n[\s\S]+?^## Partie 2 — Politique de confidentialité\n([\s\S]+?)^## Partie 3 — Notes de maintenance du document/m.exec(markdown)
  assert.ok(parts, 'Le document doit distinguer le texte public, le résumé et les notes de maintenance')
  return `${parts[1]}\n${parts[2]}`.trim().split(/\n\s*\n/).flatMap(policyMarkdownBlock)
}

test('la confidentialité SSR reste identique au texte public de PRIVACY.md', async () => {
  const markdown = await readFile(new URL('../../PRIVACY.md', import.meta.url), 'utf8')
  const expected = publicPolicyBlocks(markdown)
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    const response = await page.goto(`${vitrineUrl}/confidentialite`)
    assert.equal(response.status(), 200)
    const actual = await page.locator('article.privacy-policy').locator('h1, h2, p, li, dt, dd')
      .evaluateAll(blocks => blocks.map(block => ({ tag: block.tagName.toLowerCase(), text: block.textContent })))
    assert.deepEqual(actual.map(block => ({ ...block, text: normalizedPolicyText(block.text) })), expected,
      'Chaque titre, paragraphe, élément de liste et durée de conservation doit correspondre au document public')
  }
  finally { await context.close() }
}, { timeout: 30_000 })

test('LinkedIn simulé : PKCE, accueil, restauration et déconnexion', async () => {
  const page = await browser.newPage()
  try {
    const calls = await mockAuth(page)
    await page.goto(`${appUrl}/login`)
    const connect = page.getByRole('button', { name: 'Continuer avec LinkedIn' })
    await connect.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(`${appUrl}/`)
    await page.getByRole('heading', { name: 'Bienvenue, Membre Test' }).waitFor()
    await page.getByText(authUser.email, { exact: true }).waitFor()
    assert.equal(calls.exchanges, 1)
    assert.equal(calls.authorizations, 1)
    assert.doesNotMatch(page.url(), /code=|token=/)

    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.reload()
      await page.getByRole('heading', { name: 'Bienvenue, Membre Test' }).waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await page.addScriptTag({ content: axe.source })
      const violations = await page.evaluate(async () => (await window.axe.run()).violations
        .filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })))
      assert.deepEqual(violations, [])
    }
    await page.goto(`${appUrl}/login`)
    await page.waitForURL(`${appUrl}/`)
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await page.waitForURL(`${appUrl}/login`)
    await page.goto(appUrl)
    await page.waitForURL(`${appUrl}/login`)
    await page.goBack()
    await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
    assert.equal(await page.getByText(authUser.email, { exact: true }).count(), 0)
  }
  finally { await page.close() }
}, { timeout: 60_000 })

test('un retour OAuth annulé, vide ou expiré propose une nouvelle connexion', async () => {
  for (const query of ['error=access_denied&error_description=private-provider-detail', '', 'code=test-code&next=https://evil.invalid']) {
    const page = await browser.newPage()
    try {
      const options = { invalidCode: true }
      await mockAuth(page, options)
      if (query.startsWith('code=')) {
        await page.goto(`${appUrl}/login`)
        await page.getByRole('button', { name: 'Continuer avec LinkedIn' }).click()
      }
      else await page.goto(`${appUrl}/auth/callback?${query}`)
      await page.waitForURL(`${appUrl}/login`)
      await page.getByRole('alert').getByText(/La connexion a été annulée ou a expiré/).waitFor()
      assert.doesNotMatch(await page.locator('main').textContent(), /private-provider-detail/)
      assert.equal(page.url(), `${appUrl}/login`)
      options.invalidCode = false
      await page.getByRole('button', { name: 'Continuer avec LinkedIn' }).click()
      await page.waitForURL(`${appUrl}/`)
      await page.getByRole('heading', { name: 'Bienvenue, Membre Test' }).waitFor()
    }
    finally { await page.close() }
  }
}, { timeout: 60_000 })

test('un échec du profil conserve la session et permet de réessayer', async () => {
  const page = await browser.newPage()
  try {
    const options = { profileError: true }
    await mockAuth(page, options)
    await page.goto(`${appUrl}/login`)
    await page.getByRole('button', { name: 'Continuer avec LinkedIn' }).click()
    await page.waitForURL(`${appUrl}/`)
    await page.getByRole('alert').getByText(/Impossible de charger votre profil/).waitFor()
    options.profileError = false
    await page.getByRole('button', { name: 'Réessayer' }).click()
    await page.getByRole('heading', { name: 'Bienvenue, Membre Test' }).waitFor()
    assert.equal(page.url(), `${appUrl}/`)
  }
  finally { await page.close() }
}, { timeout: 30_000 })

test('la vitrine livre son contenu SEO en SSR et la plateforme une SPA', async () => {
  const response = await fetch(vitrineUrl)
  const html = await response.text()
  assert.match(html, /<h1[^>]*>\s*Manzi-mfa/)
  assert.match(html, /name="description"/)
  assert.match(html, /Le pont vers l&#39;emploi|Le pont vers l'emploi/)
  assert.match(html, new RegExp(`href="${appUrl}/login"`))

  const appResponse = await fetch(`${appUrl}/login`)
  assert.equal(appResponse.status, 200)
  assert.match(appResponse.headers.get('x-robots-tag') ?? '', /noindex/)
  assert.doesNotMatch(await appResponse.text(), /Connectez-vous pour continuer/)

  for (const url of [vitrineUrl, appUrl]) {
    const logo = await fetch(`${url}/logo.png`)
    assert.equal(logo.status, 200)
    assert.match(logo.headers.get('content-type') ?? '', /image\/png/)
  }
})

test('le lien de connexion ouvre la plateforme dans le même onglet puis permet de revenir', async () => {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(vitrineUrl)
    const login = page.getByRole('link', { name: 'Se connecter', exact: true })
    assert.equal(await login.getAttribute('href'), `${appUrl}/login`)
    assert.notEqual(await login.getAttribute('target'), '_blank')
    await login.click()
    await page.waitForURL(`${appUrl}/login`)
    await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
    assert.match(await page.title(), /Se connecter — Manzi-mfa/)
    await page.getByRole('link', { name: 'Retour au site' }).click()
    await page.waitForURL(`${vitrineUrl}/`)
    await page.getByRole('heading', { name: 'Manzi-mfa', exact: true }).waitFor()
    assert.deepEqual(errors, [])
  }
  finally { await page.close() }
}, { timeout: 60_000 })

test('la racine de la plateforme redirige vers login', async () => {
  const page = await browser.newPage()
  try {
    await page.goto(appUrl)
    await page.waitForURL(`${appUrl}/login`)
    await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
  }
  finally { await page.close() }
}, { timeout: 30_000 })

test('la confidentialité est accessible sur la vitrine, en SSR et à 320px', async () => {
  const response = await fetch(`${vitrineUrl}/confidentialite`)
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /<h1[^>]*>\s*Politique de confidentialité/)
  assert.match(html, /mailto:collectif@mongulu.cm/)
  assert.doesNotMatch(html, /Notes de maintenance du document/)

  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(vitrineUrl)
    const link = page.locator('footer').getByRole('link', { name: 'Politique de confidentialité' })
    await link.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(`${vitrineUrl}/confidentialite`)
    assert.match(await page.title(), /Politique de confidentialité — Manzi-mfa/)
    assert.equal(await page.locator('article h2').count(), 13)

    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.reload()
      await page.getByRole('heading', { level: 1 }).waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
      await page.addScriptTag({ content: axe.source })
      const violations = await page.evaluate(async () => {
        const results = await window.axe.run()
        return results.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id)
      })
      assert.deepEqual(violations, [])
    }
    await page.getByRole('link', { name: 'Retour à l’accueil' }).click()
    await page.waitForURL(`${vitrineUrl}/`)
    await page.goto(`${appUrl}/login`)
    assert.equal(await page.locator('footer a[href="/confidentialite"]').count(), 0)
    assert.deepEqual(errors, [])
  }
  finally { await page.close() }
}, { timeout: 60_000 })

function assertTouchTarget(bounds) {
  assert.ok(bounds, 'L’élément doit être visible et dimensionné')
  assert.ok(bounds.width >= 44 && bounds.height >= 44)
}

async function assertLoginActionsAndAccessibility(page) {
  assert.equal(await page.getByRole('button').count(), 1, 'LinkedIn reste le seul fournisseur proposé')
  const connect = page.getByRole('button', { name: 'Continuer avec LinkedIn' })
  const bounds = await connect.boundingBox()
  assertTouchTarget(bounds)
  const privacy = page.getByRole('link', { name: 'Confidentialité', exact: true })
  assert.equal(await privacy.getAttribute('href'), `${vitrineUrl}/confidentialite`)
  assert.equal(await page.getByRole('link', { name: 'Aide', exact: true }).getAttribute('href'), 'mailto:collectif@mongulu.cm')
  await page.addScriptTag({ content: axe.source })
  const violations = await page.evaluate(async () => (await window.axe.run()).violations
    .filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })))
  assert.deepEqual(violations, [])
}

test('les deux sites restent utilisables au clavier, à 320px et sur desktop', async () => {
  const page = await browser.newPage()
  try {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const url of [vitrineUrl, `${appUrl}/login`]) {
        await page.goto(url)
        await page.locator('h1').waitFor()
        await page.keyboard.press('Tab')
        assert.equal(await page.locator(':focus').textContent(), 'Aller au contenu')
        assert.equal(await page.locator(':focus').evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
        await page.keyboard.press('Enter')
        assert.equal(await page.locator(':focus').getAttribute('id'), 'main-content')
        const measurements = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          brand: document.querySelector('header a').getBoundingClientRect().height,
          primary: getComputedStyle(document.documentElement).getPropertyValue('--ui-primary').trim(),
        }))
        assert.equal(measurements.overflow, false)
        assert.ok(measurements.brand >= 44)
        assert.equal(measurements.primary.toLowerCase(), '#576f1f')
        if (url === `${appUrl}/login`) {
          await assertLoginActionsAndAccessibility(page)
        }
      }
      await page.goto(vitrineUrl)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      assert.equal(await page.locator(':focus').textContent(), 'Se connecter')
      const bounds = await page.locator(':focus').boundingBox()
      assertTouchTarget(bounds)
    }
  }
  finally { await page.close() }
}, { timeout: 60_000 })
