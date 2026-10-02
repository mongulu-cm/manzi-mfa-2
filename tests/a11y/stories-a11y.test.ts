import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Browser, type Page, chromium } from 'playwright-core'
import axe from 'axe-core'
import { COLORS } from '../../stories/tokens'
import { STATIC_PORT } from './serve-static.setup'

const BASE = process.env.STORYBOOK_URL ?? `http://localhost:${STATIC_PORT}`

interface IndexEntry {
  id: string
  type: string
}

let browser: Browser

beforeAll(async () => {
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser.close()
})

async function storyIds(): Promise<string[]> {
  const res = await fetch(`${BASE}/index.json`)
  const index = (await res.json()) as { entries: Record<string, IndexEntry> }
  return Object.values(index.entries)
    .filter(entry => entry.type === 'story')
    .map(entry => entry.id)
}

async function violationsFor(page: Page, id: string): Promise<string[]> {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'load' })
  try {
    await page.waitForSelector('#storybook-root > *', { timeout: 15_000 })
  }
  catch {
    const url = page.url()
    const body = await page.evaluate(() => document.body?.innerHTML?.slice(0, 500) ?? 'NO-BODY')
    throw new Error(`rendu introuvable pour la story ${id} (url=${url}, body=${body})`)
  }
  await page.addScriptTag({ content: axe.source })
  // L'addon a11y peut lancer son propre audit en parallèle : réessayer
  // jusqu'à ce qu'axe soit libre (backoff, 5 tentatives max).
  let results = null as null | Awaited<ReturnType<typeof axe.run>>
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      results = await page.evaluate(async () => {
        const axeGlobal = (window as unknown as { axe: typeof axe }).axe
        return await axeGlobal.run(document.querySelector('#storybook-root') ?? document)
      })
      break
    }
    catch (error) {
      if (attempt === 4 || !String(error).includes('already running')) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }
  return (results?.violations ?? []).map(v => `${id} [${v.id}] ${v.help} (${v.nodes.length} nœud(s))`)
}

describe('accessibilité des stories', () => {
  it('axe : aucune violation sur aucune story', async () => {
    const ids = await storyIds()
    expect(ids.length).toBeGreaterThan(0)
    const failures: string[] = []
    for (const id of ids) {
      const page = await browser.newPage()
      try {
        failures.push(...await violationsFor(page, id))
      }
      finally {
        await page.close()
      }
    }
    expect(failures).toEqual([])
  }, 180_000)

  it('tokens : chaque valeur documentée égale le CSS appliqué', async () => {
    const page = await browser.newPage()
    try {
      await page.goto(`${BASE}/iframe.html?id=tokens-colors--palette&viewMode=story`, { waitUntil: 'load' })
      await page.waitForSelector('#storybook-root > *', { timeout: 15_000 })
      const resolved = await page.evaluate((names: string[]) => {
        const computed = getComputedStyle(document.documentElement)
        return names.map(name => [name, computed.getPropertyValue(name).trim().toLowerCase()] as [string, string])
      }, COLORS.map(([name]) => name))
      expect(resolved).toEqual(COLORS)
    }
    finally {
      await page.close()
    }
  }, 60_000)
})
