import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Browser, chromium } from 'playwright-core'
import axe from 'axe-core'

const BASE = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6007'

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

describe('accessibilité des stories', () => {
  it('axe : aucune violation sur aucune story', async () => {
    const ids = await storyIds()
    expect(ids.length).toBeGreaterThan(0)
    const failures: string[] = []
    for (const id of ids) {
      const page = await browser.newPage()
      try {
        await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'load' })
        await page.waitForSelector('#storybook-root > *', { timeout: 15_000 })
        await page.addScriptTag({ content: axe.source })
        const results = await page.evaluate(async () => {
          const axeGlobal = (window as unknown as { axe: typeof axe }).axe
          return await axeGlobal.run(document.querySelector('#storybook-root') ?? document)
        })
        for (const v of results.violations) {
          failures.push(`${id} [${v.id}] ${v.help} (${v.nodes.length} nœud(s))`)
        }
      }
      finally {
        await page.close()
      }
    }
    expect(failures).toEqual([])
  }, 180_000)
})
