import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './scan.js'

const EXPECTED_MINT = 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

const ok = (payload) => Promise.resolve({ ok: true, json: async () => payload })

const responses = ({ mint = EXPECTED_MINT, owner = TOKEN_2022_PROGRAM, circulatingSupply = '100' } = {}) =>
  vi.fn((url, options = {}) => {
    const target = String(url)
    if (target.includes('/public/assets/AAPLx/price-data')) return ok({ quote: 123.45 })
    if (target.includes('/public/assets/AAPLx/multiplier')) return ok({ currentMultiplier: '1' })
    if (target.includes('/public/proof-of-reserves/AAPLx')) return ok({ sharesHeld: '100', circulatingSupply, timestamp: '2026-09-14T08:00:00.000Z' })
    if (target.includes('/public/corporate-actions/upcoming')) return ok({ nodes: [] })
    if (target.includes('/public/assets/AAPLx')) return ok({ symbol: 'AAPLx', name: 'Apple xStock', underlying: { symbol: 'AAPL' }, deployments: [{ network: 'Solana', address: mint }], trading: { currentPeriod: 'Observed' } })

    const method = JSON.parse(options.body).method
    if (method === 'getTokenSupply') return ok({ result: { value: { uiAmount: 100 } } })
    return ok({ result: { context: { slot: 123456 }, value: { owner, data: { program: 'spl-token-2022', parsed: { info: { decimals: 8, freezeAuthority: null, extensions: [{ extension: 'scaledUiAmountConfig', state: { multiplier: 1, newMultiplier: 1, newMultiplierEffectiveTimestamp: 0 } }, { extension: 'pausableConfig', state: { paused: false } }] } } } } } })
  })

const invoke = async (method = 'GET') => {
  const response = { statusCode: 200, body: null, headers: {}, setHeader(name, value) { this.headers[name] = value }, status(code) { this.statusCode = code; return this }, json(payload) { this.body = payload; return this }, end() { return this } }
  await handler({ method, query: { symbol: 'AAPLx' } }, response)
  return response
}

afterEach(() => vi.unstubAllGlobals())

describe('live passport API contract', () => {
  it('returns a versioned PASS passport for valid evidence', async () => {
    vi.stubGlobal('fetch', responses())
    const response = await invoke()
    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchObject({ schemaName: 'stockproof.passport', schemaVersion: '1.0.0', state: 'PASS', reserveCoverage: 1 })
    expect(response.body.passportId).toContain('AAPLx:123456')
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('supports a cross-origin preflight without touching upstream sources', async () => {
    const fetchMock = responses()
    vi.stubGlobal('fetch', fetchMock)
    const response = await invoke('OPTIONS')
    expect(response.statusCode).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses to verify a zero reserve denominator', async () => {
    vi.stubGlobal('fetch', responses({ circulatingSupply: '0' }))
    const response = await invoke()
    expect(response.body.state).toBe('UNVERIFIABLE')
    expect(response.body.reserveCoverage).toBeNull()
    expect(response.body.checks.find((check) => check.id === 'reserves').state).toBe('unknown')
  })

  it('blocks an issuer-to-mint mismatch', async () => {
    vi.stubGlobal('fetch', responses({ mint: 'UnexpectedMint11111111111111111111111111111111' }))
    const response = await invoke()
    expect(response.body.state).toBe('BLOCKED')
    expect(response.body.checks.find((check) => check.id === 'identity').state).toBe('fail')
  })

  it('blocks an unexpected token-program owner', async () => {
    vi.stubGlobal('fetch', responses({ owner: '11111111111111111111111111111111' }))
    const response = await invoke()
    expect(response.body.state).toBe('BLOCKED')
    expect(response.body.checks.find((check) => check.id === 'token-program').state).toBe('fail')
  })
})
