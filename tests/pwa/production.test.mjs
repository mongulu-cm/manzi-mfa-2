import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'
import axe from 'axe-core'

const root = fileURLToPath(new URL('../..', import.meta.url))
const origin = 'http://127.0.0.1:3102'
let server
let browser
let serverOutput = ''
let serverError

before(async () => {
  // Exercise the built Cloudflare Worker and generated service worker, never Nuxt dev.
  const publicEnv = {
    NUXT_PUBLIC_SUPABASE_URL: 'https://supabase.test.invalid',
    NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_pwa_test',
  }
  server = spawn(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'dev', '--local',
    '--config', 'apps/plateforme/.output/server/wrangler.json',
    '--port', '3102', '--ip', '127.0.0.1',
    ...Object.entries(publicEnv).flatMap(([key, value]) => ['--var', `${key}:${value}`]),
  ], { cwd: root, env: { ...process.env, ...publicEnv, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] })
  server.on('error', (error) => {
    serverError = error
  })
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', (chunk) => {
      serverOutput = (serverOutput + chunk).slice(-4000)
    })
  }
  const deadline = Date.now() + 90_000
  let ready = false
  while (Date.now() < deadline) {
    assert.ifError(serverError)
    assert.equal(server.exitCode, null, `Le Worker doit démarrer (exécuter build:app avant test:pwa) : ${serverOutput}`)
    try {
      ready = (await fetch(`${origin}/manifest.webmanifest`, { signal: AbortSignal.timeout(1000) })).ok
    }
    catch { /* Wait for the local Worker to listen. */ }
    if (ready) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert.ok(ready, `Le Worker de production doit être disponible : ${serverOutput}`)
  browser = await chromium.launch()
}, { timeout: 100_000 })

after(async () => {
  await browser?.close()
  if (server?.pid && server.exitCode === null) {
    await new Promise((resolve) => {
      const force = setTimeout(() => server.kill('SIGKILL'), 5000)
      server.once('exit', () => {
        clearTimeout(force)
        resolve()
      })
      server.kill('SIGTERM')
    })
  }
})

async function controlledPage(context) {
  const page = await context.newPage()
  await page.goto(`${origin}/login`)
  await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
  // Registration must come from the application itself; registering here would hide regressions.
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    const worker = registration.active
    if (worker.state !== 'activated') {
      await new Promise(resolve => worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') resolve()
      }))
    }
  })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated')
  await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
  return page
}

async function assertPublicCaches(page) {
  const urls = await page.evaluate(async () => {
    const entries = await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))
    return entries.flat()
  })
  assert.ok(urls.length > 0, 'Le repli doit être précaché')
  const paths = urls.map((value) => {
    const url = new URL(value)
    assert.equal(url.origin, origin, 'Aucune donnée externe dans Cache Storage')
    assert.ok(['/offline.html', '/logo.png', '/manifest.webmanifest'].includes(url.pathname), `Ressource privée ou applicative en cache : ${url.pathname}`)
    // Workbox adds its public asset revision, never account/OAuth query parameters.
    assert.ok([...url.searchParams.keys()].every(key => key === '__WB_REVISION__'))
    return url.pathname
  })
  assert.ok(paths.includes('/offline.html'))
  assert.ok(paths.includes('/logo.png'))
}

test('le manifeste de production décrit une application installable et son logo original', async () => {
  const context = await browser.newContext()
  try {
    const page = await controlledPage(context)
    const manifestHref = await page.locator('link[rel="manifest"]').first().getAttribute('href')
    assert.equal(new URL(manifestHref, origin).href, `${origin}/manifest.webmanifest`)
    const response = await fetch(`${origin}/manifest.webmanifest`)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /application\/manifest\+json/)
    const manifest = await response.json()
    assert.equal(manifest.name, 'Manzi-mfa — Collectif Mongulu')
    assert.equal(manifest.short_name, 'Manzi-mfa')
    assert.equal(manifest.id, '/')
    assert.equal(manifest.scope, '/')
    assert.equal(manifest.start_url, '/')
    assert.equal(manifest.display, 'standalone')
    assert.equal(manifest.theme_color.toLowerCase(), '#576f1f')
    assert.deepEqual(manifest.icons, [{ src: '/logo.png', sizes: '2048x2048', type: 'image/png', purpose: 'any' }])
    const icon = await fetch(`${origin}/logo.png`)
    assert.match(icon.headers.get('content-type'), /image\/png/)
    const dimensions = await page.evaluate(async () => {
      const image = new Image()
      image.src = '/logo.png'
      await image.decode()
      return [image.naturalWidth, image.naturalHeight]
    })
    assert.deepEqual(dimensions, [2048, 2048])
    await assertPublicCaches(page)
  }
  finally { await context.close() }
}, { timeout: 45_000 })

test('la navigation contrôlée reste en ligne puis propose un repli accessible et un retour au clavier', async () => {
  const context = await browser.newContext()
  try {
    const page = await controlledPage(context)
    for (const path of ['/', '/login']) {
      await page.goto(`${origin}${path}`)
      await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
      assert.equal(await page.getByRole('heading', { name: 'Connexion indisponible', exact: true }).count(), 0)
    }
    // No route interception: Chromium and the real service worker determine offline behavior.
    await context.setOffline(true)
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/login', '/']) {
        const response = await page.goto(`${origin}${path}`)
        assert.ok(response.fromServiceWorker())
        await page.getByRole('heading', { name: 'Connexion indisponible', exact: true }).waitFor()
        assert.equal(await page.getByRole('button', { name: 'Continuer avec LinkedIn' }).count(), 0)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
        assert.equal(await page.locator('img').evaluate(image => image.complete && image.naturalWidth > 0), true)
        const retry = page.getByRole('link', { name: 'Réessayer', exact: true })
        assert.equal(await retry.getAttribute('href'), '/')
        const bounds = await retry.boundingBox()
        assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= width)
        await page.keyboard.press('Tab')
        assert.equal(await retry.evaluate(element => element === document.activeElement), true)
        assert.equal(await retry.evaluate(element => getComputedStyle(element).outlineStyle), 'solid')
        await page.addScriptTag({ content: axe.source })
        const violations = await page.evaluate(async () => (await window.axe.run()).violations
          .filter(violation => ['serious', 'critical'].includes(violation.impact)).map(violation => violation.id))
        assert.deepEqual(violations, [])
      }
    }
    await assertPublicCaches(page)
    await context.setOffline(false)
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
    await page.waitForURL(`${origin}/login`)
    await assertPublicCaches(page)
  }
  finally { await context.close() }
}, { timeout: 60_000 })

test('les données, API et retours OAuth ne sont ni conservés ni remplacés par le repli', async () => {
  const context = await browser.newContext()
  try {
    const page = await controlledPage(context)
    await page.goto(`${origin}/?profile=private-test`)
    await page.getByRole('heading', { name: 'Bienvenue', exact: true }).waitFor()
    // Harmless GET probes only: no OAuth exchange, account, message or live provider.
    await page.evaluate(async () => {
      await Promise.all(['/api/profiles?member=private-test', '/api/auth/linkedin?code=private-test']
        .map(url => fetch(url).catch(() => null)))
    })
    await assertPublicCaches(page)
    await context.setOffline(true)
    const failures = await page.evaluate(async () => Promise.all([
      '/api/profiles?member=private-test', '/auth/callback?code=private-test',
      'https://supabase.test.invalid/rest/v1/profiles?select=*',
    ].map(async (url) => {
      try {
        await fetch(url)
        return false
      }
      catch { return true }
    })))
    assert.deepEqual(failures, [true, true, true])
    for (const path of ['/auth/callback?code=private-test', '/api/profiles?member=private-test']) {
      // An offline document request must fail instead of displaying the account fallback.
      const probe = await context.newPage()
      try {
        await assert.rejects(probe.goto(`${origin}${path}`), /net::ERR_/)
      }
      finally { await probe.close() }
    }
    await page.goto(`${origin}/login`)
    await page.getByRole('heading', { name: 'Connexion indisponible', exact: true }).waitFor()
    await assertPublicCaches(page)
  }
  finally { await context.close() }
}, { timeout: 45_000 })
