import assert from 'node:assert/strict'
import handler from '../api/scan.js'

const symbols = ['NVDAx', 'AAPLx', 'TSLAx', 'QQQx']

function run(symbol) {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this },
      json(payload) { this.statusCode >= 400 ? reject(new Error(`${symbol}: ${JSON.stringify(payload)}`)) : resolve(payload) },
    }
    handler({ query: { symbol } }, response).catch(reject)
  })
}

for (const symbol of symbols) {
  const passport = await run(symbol)
  assert.equal(passport.schemaName, 'stockproof.passport')
  assert.equal(passport.schemaVersion, '1.0.0')
  assert.ok(passport.passportId.includes(`:${symbol}:`))
  assert.equal(passport.mode, 'live')
  assert.equal(passport.instrument.symbol, symbol)
  assert.equal(passport.instrument.network, 'Solana')
  assert.equal(passport.tokenProgram, 'spl-token-2022')
  assert.ok(Number.isInteger(passport.rpcSlot) && passport.rpcSlot > 0)
  assert.ok(passport.checks.find((check) => check.id === 'identity')?.state === 'pass')
  assert.ok(passport.checks.find((check) => check.id === 'token-program')?.state === 'pass')
  assert.ok(passport.evidence.some((item) => item.source === 'Solana mainnet RPC'))
  assert.ok(Number.isFinite(passport.reserveCoverage) && passport.reserveCoverage >= 0)
  console.log(`${symbol}: ${passport.state} · schema ${passport.schemaVersion} · slot ${passport.rpcSlot} · reserve ${(passport.reserveCoverage * 100).toFixed(3)}%`)
}
