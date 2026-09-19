import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './scan.js'

const EXPECTED_MINT = 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

const ok = (payload) => Promise.resolve({ ok: true, json: async () => payload })

const responses = ({ mint = EXPECTED_MINT, owner = TOKEN_2022_PROGRAM, circulatingSupply = '100', reserveTimestamp = new Date().toISOString(), initialized = true } = {}) =>
  vi.fn((url, options = {}) => {
    const target = String(url)
    if (target.includes('/public/assets/AAPLx/price-data')) throw new Error('Price is outside the integrity scan')
    if (target.includes('/public/assets/AAPLx/multiplier')) return ok({ currentMultiplier: '1' })
    if (target.includes('/public/proof-of-reserves/AAPLx')) return ok({ sharesHeld: '100', circulatingSupply, timestamp: reserveTimestamp })
    if (target.includes('/public/corporate-actions/upcoming')) return ok({ nodes: [] })
    if (target.includes('/public/assets/AAPLx')) return ok({ symbol: 'AAPLx', name: 'Apple xStock', underlying: { symbol: 'AAPL' }, deployments: [{ network: 'Solana', address: mint }], trading: { currentPeriod: 'Observed' } })

    const method = JSON.parse(options.body).method
    if (method !== 'getAccountInfo') throw new Error(`Unexpected RPC method: ${method}`)
    return ok({ result: { context: { slot: 123456 }, value: { owner, data: { program: 'spl-token-2022', parsed: { info: { decimals: 8, supply: '10000000000', isInitialized: initialized, freezeAuthority: null, extensions: [{ extension: 'scaledUiAmountConfig', state: { multiplier: 1, newMultiplier: 1, newMultiplierEffectiveTimestamp: 0 } }, { extension: 'pausableConfig', state: { paused: false } }] } } } } } })
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
    expect(response.body.displayedSupply).toBe(100)
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

  it('blocks an uninitialized mint account', async () => {
    vi.stubGlobal('fetch', responses({ initialized: false }))
    const response = await invoke()
    expect(response.body.state).toBe('BLOCKED')
  })

  it('does not query price or a redundant supply RPC', async () => {
    const fetchMock = responses()
    vi.stubGlobal('fetch', fetchMock)
    const response = await invoke()
    expect(response.statusCode).toBe(200)
    expect(response.body.instrument.tokenPrice).toBeNull()
    const methods = fetchMock.mock.calls.filter(([url]) => String(url).includes('mainnet-beta.solana.com')).map(([, options]) => JSON.parse(options.body).method)
    expect(methods).toEqual(['getAccountInfo'])
  })

  it('downgrades an old reserve report without claiming coverage failed', async () => {
    vi.stubGlobal('fetch', responses({ reserveTimestamp: '2026-01-01T00:00:00.000Z' }))
    const response = await invoke()
    expect(response.body.state).toBe('CAUTION')
    expect(response.body.checks.find((check) => check.id === 'reserves').state).toBe('caution')
  })

  it('abstains from a reserve claim with no valid timestamp', async () => {
    vi.stubGlobal('fetch', responses({ reserveTimestamp: 'not-a-date' }))
    const response = await invoke()
    expect(response.body.state).toBe('UNVERIFIABLE')
  })
})
