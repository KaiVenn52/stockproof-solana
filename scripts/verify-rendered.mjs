import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Reproducible rendered-product QA. Uses the locally installed Chrome so no
// Playwright browser download is required.
//
//   npm.cmd run verify:rendered
//   STOCKPROOF_URL=http://127.0.0.1:4188 npm.cmd run verify:rendered
//
// Live verdicts change over time, so this asserts behaviour and contract, never
// a specific asset's current state.

const URL = process.env.STOCKPROOF_URL || 'https://stockproof-solana.vercel.app'
const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
]

const idle = (page) => page.waitForFunction(
  () => !document.querySelector('.live-view')?.classList.contains('is-scanning'),
  null,
  { timeout: 45_000 },
)

// Prefer the locally installed Chrome; fall back to a Playwright-managed browser
// when Chrome is unavailable.
const browser = await chromium
  .launch({ channel: 'chrome', headless: true })
  .catch(() => chromium.launch({ headless: true }))
const failures = []

try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
    const page = await context.newPage()
    const consoleIssues = []
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) consoleIssues.push(`${message.type()}: ${message.text()}`)
    })
    page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`))

    const check = (label, fn) => {
      try { fn(); console.log(`  ok   ${viewport.label} · ${label}`) }
      catch (error) { failures.push(`${viewport.label} · ${label}: ${error.message}`); console.log(`  FAIL ${viewport.label} · ${label}`) }
    }

    console.log(`\n${viewport.label} ${viewport.width}x${viewport.height} → ${URL}`)
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForSelector('.passport-state', { timeout: 45_000 })
    await idle(page)

    check('page identity', () => assert.match(page.url(), /^https?:\/\//))
    const title = await page.title()
    check('title is StockProof', () => assert.match(title, /StockProof/))
    const rootLength = await page.evaluate(() => (document.querySelector('#root')?.innerText || '').trim().length)
    check('root has content', () => assert.ok(rootLength > 200, `only ${rootLength} chars`))
    const overlays = await page.locator('vite-error-overlay, #webpack-dev-server-client-overlay').count()
    check('no error overlay', () => assert.equal(overlays, 0))

    const badge = (await page.locator('.system-status').innerText()).trim()
    check('live status badge', () => assert.match(badge, /Live Solana evidence|Snapshot mode/))

    const rows = await page.locator('.watch-row').count()
    check('watchlist is populated', () => assert.ok(rows >= 20, `only ${rows} rows`))

    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      win: window.innerWidth,
    }))
    check('no horizontal overflow', () => assert.ok(overflow.doc <= overflow.win + 1, `${overflow.doc} > ${overflow.win}`))

    const bar = await page.evaluate(() => {
      const label = document.querySelector('.instrument-bar span')
      const heading = document.querySelector('.instrument-bar h2')
      const rect = (el) => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom } }
      const l = rect(label); const h = rect(heading)
      return Math.min(l.bottom, h.bottom) - Math.max(l.top, h.top)
    })
    check('instrument bar label does not collide', () => assert.ok(bar <= 0, `${bar}px vertical overlap`))

    const checks = await page.locator('.check').count()
    const live = badge.includes('Live')
    check('six deterministic checks in live mode', () => assert.equal(checks, live ? 6 : 4, `saw ${checks} checks`))

    const controlsText = await page.locator('.check', { hasText: 'Transfer controls' }).first().innerText().catch(() => '')
    if (live) {
      check('transfer controls disclose the freeze authority', () => {
        assert.match(controlsText, /NOT PAUSED|PAUSED/)
        assert.match(controlsText, /FREEZE SET|NO FREEZE/)
      })
    }

    // Every pinned asset must answer with a real passport, never a fallback.
    const states = await page.evaluate(async () => {
      const symbols = [...document.querySelectorAll('.watch-symbol')].map((el) => el.textContent.trim())
      const out = {}
      for (const symbol of symbols) {
        const response = await fetch(`/api/scan?symbol=${encodeURIComponent(symbol)}`)
        const body = await response.json()
        out[symbol] = { status: response.status, state: body.state, mode: body.mode, schema: body.schemaVersion, program: body.tokenProgram, slot: body.rpcSlot }
      }
      return out
    })
    check('every pinned asset returns a live passport', () => {
      for (const [symbol, r] of Object.entries(states)) {
        assert.equal(r.status, 200, `${symbol} HTTP ${r.status}`)
        assert.equal(r.mode, 'live', `${symbol} mode ${r.mode}`)
        assert.equal(r.schema, '1.0.0', `${symbol} schema ${r.schema}`)
        assert.equal(r.program, 'spl-token-2022', `${symbol} program ${r.program}`)
        assert.ok(Number.isInteger(r.slot) && r.slot > 0, `${symbol} slot ${r.slot}`)
        assert.ok(['PASS', 'CAUTION'].includes(r.state), `${symbol} state ${r.state}`)
      }
    })

    // A clean PASS asset must drive the consumer policy to ALLOW.
    const passSymbol = Object.entries(states).find(([, r]) => r.state === 'PASS')?.[0]
    check('at least one pinned asset is PASS', () => assert.ok(passSymbol, 'no PASS asset available to demo'))

    if (passSymbol) {
      await page.locator('.watch-row', { hasText: passSymbol }).first().click()
      await idle(page)
      const state = (await page.locator('.passport-state').innerText()).trim()
      check(`${passSymbol} renders PASS`, () => assert.equal(state, 'PASS'))
      await page.locator('nav button', { hasText: 'Surface' }).click()
      await page.waitForSelector('.consumer-decision h2', { timeout: 15_000 })
      const decision = (await page.locator('.consumer-decision h2').innerText()).trim()
      check('consumer policy allows a live PASS', () => assert.match(decision, /^ALLOW/))
    }

    // A CAUTION asset must stop the same policy.
    const cautionSymbol = Object.entries(states).find(([, r]) => r.state === 'CAUTION')?.[0]
    if (cautionSymbol) {
      await page.locator('nav button', { hasText: 'Passport' }).click()
      await page.locator('.watch-row', { hasText: cautionSymbol }).first().click()
      await idle(page)
      await page.locator('nav button', { hasText: 'Surface' }).click()
      await page.waitForSelector('.consumer-decision h2', { timeout: 15_000 })
      const decision = (await page.locator('.consumer-decision h2').innerText()).trim()
      check('consumer policy stops a CAUTION passport', () => assert.match(decision, /^STOP/))
    }

    // Input handling: unpinned and ambiguous questions must not silently resolve.
    await page.locator('nav button', { hasText: 'Passport' }).click()
    await page.waitForSelector('#research-question', { timeout: 15_000 })

    await page.fill('#research-question', 'should I buy shopify')
    await page.locator('.question-control button[type=submit]').click()
    await page.waitForTimeout(800)
    const unsupported = (await page.locator('#query-note').innerText()).trim()
    check('unpinned asset is refused', () => assert.match(unsupported, /Not in the pinned allowlist/))

    await page.fill('#research-question', 'compare apple and tesla')
    await page.locator('.question-control button[type=submit]').click()
    await page.waitForTimeout(800)
    const ambiguous = (await page.locator('#query-note').innerText()).trim()
    check('ambiguous question is refused', () => assert.match(ambiguous, /Pick one in the audit surface/))

    await page.fill('#research-question', 'verify nvidia backing')
    await page.locator('.question-control button[type=submit]').click()
    await idle(page)
    await page.waitForTimeout(600)
    const resolved = (await page.locator('.instrument-bar h2').innerText()).trim()
    check('natural-language question resolves', () => assert.equal(resolved, 'NVDAx'))

    check('no console errors or warnings', () => assert.deepEqual(consoleIssues, []))

    await context.close()
  }
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(`\n${failures.length} rendered check(s) failed:`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exitCode = 1
} else {
  console.log('\nAll rendered checks passed.')
}
