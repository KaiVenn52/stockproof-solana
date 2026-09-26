import assert from 'node:assert/strict'
import handler from '../api/scan.js'
import { supportedSymbols } from '../shared/assets.js'

// Verifies every pinned asset against the live issuer API and Solana mainnet.
// A passport is only acceptable when the required evidence layers are present:
// BLOCKED or UNVERIFIABLE means the pinned mint no longer reconciles, and the
// run fails so the allowlist cannot silently rot.

function run(symbol) {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this },
      json(payload) { this.statusCode >= 400 ? reject(new Error(`${symbol}: ${JSON.stringify(payload)}`)) : resolve(payload) },
    }
    handler({ method: 'GET', query: { symbol } }, response).catch(reject)
  })
}

const rows = []
const problems = []

for (const symbol of supportedSymbols) {
  const passport = await run(symbol)
  assert.equal(passport.schemaName, 'stockproof.passport', `${symbol}: schemaName`)
  assert.equal(passport.schemaVersion, '1.0.0', `${symbol}: schemaVersion`)
  assert.ok(passport.passportId.includes(`:${symbol}:`), `${symbol}: passportId`)
  assert.equal(passport.mode, 'live', `${symbol}: mode`)
  assert.equal(passport.instrument.symbol, symbol, `${symbol}: instrument.symbol`)
  assert.equal(passport.instrument.network, 'Solana', `${symbol}: network`)
  assert.equal(passport.tokenProgram, 'spl-token-2022', `${symbol}: tokenProgram`)
  assert.ok(Number.isInteger(passport.rpcSlot) && passport.rpcSlot > 0, `${symbol}: rpcSlot`)
  assert.ok(passport.checks.find((c) => c.id === 'identity')?.state === 'pass', `${symbol}: identity`)
  assert.ok(passport.checks.find((c) => c.id === 'token-program')?.state === 'pass', `${symbol}: token-program`)
  assert.ok(passport.evidence.some((item) => item.source.startsWith('Solana mainnet RPC')), `${symbol}: chain evidence`)
  if (process.env.SOLAMI_API_KEY?.trim()) {
    assert.ok(passport.evidence.some((item) => item.source.includes('rpc.solami.dev')), `${symbol}: Solami data path`)
  }
  assert.ok(Number.isFinite(passport.reserveCoverage) && passport.reserveCoverage >= 0, `${symbol}: reserveCoverage`)

  const noteworthy = passport.checks.filter((c) => c.state !== 'pass')
  const reason = noteworthy.length ? noteworthy.map((c) => `${c.id}=${c.state}`).join(' ') : 'all checks pass'
  rows.push({ symbol, state: passport.state, slot: passport.rpcSlot, coverage: passport.reserveCoverage, multiplier: passport.multiplier, reason, noteworthy })

  if (passport.state === 'BLOCKED' || passport.state === 'UNVERIFIABLE') {
    problems.push(`${symbol}: ${passport.state} (${reason})`)
  }
}

const width = Math.max(...rows.map((r) => r.symbol.length))
for (const r of rows) {
  const coverage = `${(r.coverage * 100).toFixed(3)}%`.padStart(8)
  const mult = r.multiplier == null ? 'n/a' : r.multiplier.toFixed(9)
  console.log(`${r.symbol.padEnd(width)}  ${r.state.padEnd(12)} slot ${r.slot}  reserve ${coverage}  mult ${mult}  ${r.reason}`)
}

const tally = rows.reduce((acc, r) => ({ ...acc, [r.state]: (acc[r.state] ?? 0) + 1 }), {})
console.log(`\n${rows.length} pinned assets verified · ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(' · ')}`)

if (problems.length) {
  console.error(`\nFAIL: ${problems.length} asset(s) did not produce a usable passport:`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exitCode = 1
}
