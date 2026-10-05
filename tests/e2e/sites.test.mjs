import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
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
  ], {
    cwd: root,
    env: { ...process.env, NUXT_PUBLIC_APP_URL: appUrl, NUXT_PUBLIC_SITE_URL: vitrineUrl },
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
  assert.doesNotMatch(await appResponse.text(), /Bienvenue dans votre espace/)

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
    await page.getByRole('heading', { name: 'Se connecter', exact: true }).waitFor()
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
    await page.getByRole('heading', { name: 'Se connecter', exact: true }).waitFor()
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
      }
      await page.goto(vitrineUrl)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      assert.equal(await page.locator(':focus').textContent(), 'Se connecter')
      const bounds = await page.locator(':focus').boundingBox()
      assert.ok(bounds.width >= 44 && bounds.height >= 44)
    }
  }
  finally { await page.close() }
}, { timeout: 60_000 })
