import { chromium } from 'playwright'
import { mkdir, readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'

const url = process.env.STOCKPROOF_URL || 'https://stockproof-solana.vercel.app'
const out = process.env.STOCKPROOF_VIDEO_DIR || 'submission'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: out, size: { width: 1600, height: 900 } },
})
const page = await context.newPage()
const hold = (seconds) => page.waitForTimeout(seconds * 1000)
const idle = () => page.waitForFunction(() => !globalThis.document.querySelector('.live-view')?.classList.contains('is-scanning'), null, { timeout: 45_000 })

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await idle()
  const label = (await page.locator('.mode-label').innerText()).trim()
  if (label !== 'LIVE · MAINNET') throw new Error('Refusing to record a snapshot-mode demo')
  const initial = await page.evaluate(async () => {
    const res = await fetch('/api/scan?symbol=TSLAx')
    const p = await res.json()
    return { ok: res.ok, source: p.evidence?.find((e) => e.id === 'chain')?.source }
  })
  if (!initial.ok || !initial.source?.includes('rpc.solami.dev')) throw new Error('Refusing to record a non-Solami demo')

  await hold(14)
  await page.locator('.instrument-bar').scrollIntoViewIfNeeded()
  await hold(16)
  await page.locator('.check', { hasText: 'Corporate-action schedule' }).first().locator('button').click()
  await hold(15)

  await page.locator('.watch-row', { hasText: 'NFLXx' }).click()
  await idle()
  await page.locator('.instrument-bar').scrollIntoViewIfNeeded()
  await hold(13)
  await page.locator('.check', { hasText: 'Corporate-action multiplier' }).first().scrollIntoViewIfNeeded()
  await hold(19)

  await page.locator('.watch-row', { hasText: 'TSLAx' }).click()
  await idle()
  await page.locator('.instrument-bar').scrollIntoViewIfNeeded()
  await hold(13)
  await page.locator('.evidence-panel').scrollIntoViewIfNeeded()
  await page.locator('.evidence-list button', { hasText: 'Solana mint account' }).click()
  await hold(20)

  await page.getByRole('button', { name: 'Surface', exact: true }).click()
  await hold(22)
  console.log(JSON.stringify({ recorded: true, source: initial.source, outputDirectory: out }))
} finally {
  const video = page.video()
  await context.close()
  await browser.close()
  if (video) {
    const source = await video.path()
    const target = join(out, 'stockproof-solami-live-demo-raw-v2.webm')
    if (source !== target) await rename(source, target)
    console.log(JSON.stringify({ rawVideo: target }))
  } else {
    console.log(JSON.stringify({ files: await readdir(out) }))
  }
}
