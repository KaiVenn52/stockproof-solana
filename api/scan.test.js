import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './scan.js'

const EXPECTED_MINT = 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

const ok = (payload) => Promise.resolve({ ok: true, json: async () => payload })

const responses = ({ mint = EXPECTED_MINT, owner = TOKEN_2022_PROGRAM, circulatingSupply = '100', reserveTimestamp = new Date().toISOString(), initialized = true, hasPausable = true, paused = false, freezeAuthority = null } = {}) =>
  vi.fn((url, options = {}) => {
    const target = String(url)
    if (target.includes('/public/assets/AAPLx/price-data')) throw new Error('Price is outside the integrity scan')
    if (target.includes('/public/assets/AAPLx/multiplier')) return ok({ currentMultiplier: '1' })
    if (target.includes('/public/proof-of-reserves/AAPLx')) return ok({ sharesHeld: '100', circulatingSupply, timestamp: reserveTimestamp })
    if (target.includes('/public/corporate-actions/upcoming')) return ok({ nodes: [] })
    if (target.includes('/public/assets/AAPLx')) return ok({ symbol: 'AAPLx', name: 'Apple xStock', underlying: { symbol: 'AAPL' }, deployments: [{ network: 'Solana', address: mint }], trading: { currentPeriod: 'Observed' } })

    const method = JSON.parse(options.body).method
    if (method !== 'getAccountInfo') throw new Error(`Unexpected RPC method: ${method}`)
    const extensions = [{ extension: 'scaledUiAmountConfig', state: { multiplier: 1, newMultiplier: 1, newMultiplierEffectiveTimestamp: 0 } }]
    if (hasPausable) extensions.push({ extension: 'pausableConfig', state: { paused } })
    return ok({ result: { context: { slot: 123456 }, value: { owner, data: { program: 'spl-token-2022', parsed: { info: { decimals: 8, supply: '10000000000', isInitialized: initialized, freezeAuthority, extensions } } } } } })
  })

const invoke = async (method = 'GET', query = { symbol: 'AAPLx' }) => {
  const response = { statusCode: 200, body: null, headers: {}, setHeader(name, value) { this.headers[name] = value }, status(code) { this.statusCode = code; return this }, json(payload) { this.body = payload; return this }, end() { return this } }
  await handler({ method, query }, response)
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

  it('abstains when the transfer-control extension cannot be read', async () => {
    vi.stubGlobal('fetch', responses({ hasPausable: false }))
    const response = await invoke()
    expect(response.body.state).toBe('UNVERIFIABLE')
    expect(response.body.checks.find((check) => check.id === 'controls').state).toBe('unknown')
  })

  it('cautions when the mint is paused', async () => {
    vi.stubGlobal('fetch', responses({ paused: true }))
    const response = await invoke()
    expect(response.body.state).toBe('CAUTION')
    expect(response.body.checks.find((check) => check.id === 'controls').result).toContain('PAUSED')
  })

  it('discloses a set freeze authority without failing the passport', async () => {
    const authority = 'JDq14BWvqCRFNu1krb12bcRpbGtJZ1FLEakMw6FdxJNs'
    vi.stubGlobal('fetch', responses({ freezeAuthority: authority }))
    const response = await invoke()
    expect(response.body.state).toBe('PASS')

    const controls = response.body.checks.find((check) => check.id === 'controls')
    expect(controls.result).toContain('FREEZE SET')
    expect(controls.observations.find((o) => o.label === 'Freeze authority').value).toBe(authority)
  })

  it('reports no freeze authority explicitly', async () => {
    vi.stubGlobal('fetch', responses({ freezeAuthority: null }))
    const response = await invoke()
    expect(response.body.checks.find((check) => check.id === 'controls').result).toContain('NO FREEZE')
  })
})

describe('passport request boundary', () => {
  it('refuses to guess an asset when no symbol is supplied', async () => {
    const fetchMock = responses()
    vi.stubGlobal('fetch', fetchMock)
    const response = await invoke('GET', {})
    expect(response.statusCode).toBe(400)
    expect(response.body.error).toBe('Missing symbol')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an empty symbol instead of defaulting to another asset', async () => {
    const fetchMock = responses()
    vi.stubGlobal('fetch', fetchMock)
    const response = await invoke('GET', { symbol: '' })
    expect(response.statusCode).toBe(400)
    expect(response.body.error).toBe('Missing symbol')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a repeated symbol parameter rather than picking one', async () => {
    const fetchMock = responses()
    vi.stubGlobal('fetch', fetchMock)
    const response = await invoke('GET', { symbol: ['AAPLx', 'TSLAx'] })
    expect(response.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a write method instead of running a scan', async () => {
    const fetchMock = responses()
    vi.stubGlobal('fetch', fetchMock)
    const response = await invoke('POST')
    expect(response.statusCode).toBe(405)
    expect(response.body.error).toBe('Method not allowed')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports the exact supported symbols on an unsupported request', async () => {
    const response = await invoke('GET', { symbol: 'FAKEx' })
    expect(response.statusCode).toBe(400)
    expect(response.body.detail).toContain('AAPLx')
    expect(response.body.detail).toContain('GLDx')
  })
})

describe('solana rpc resilience', () => {
  it('fails over to the next endpoint and records which host answered', async () => {
    vi.stubEnv('SOLANA_RPC_URL', '')
    const base = responses()
    const fetchMock = vi.fn((url, options = {}) => {
      if (String(url).includes('mainnet-beta.solana.com')) return Promise.reject(new Error('429 Too Many Requests'))
      return base(url, options)
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await invoke()
    expect(response.statusCode).toBe(200)
    expect(response.body.state).toBe('PASS')

    const programCheck = response.body.checks.find((check) => check.id === 'token-program')
    expect(programCheck.observations.some((o) => o.label === 'RPC endpoint' && o.value.includes('publicnode'))).toBe(true)
    expect(response.body.evidence.find((item) => item.id === 'chain').source).toContain('publicnode')
  })

  it('still fails closed when every endpoint is unavailable', async () => {
    vi.stubEnv('SOLANA_RPC_URL', '')
    const base = responses()
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      if (String(url).includes('solana')) return Promise.reject(new Error('network down'))
      return base(url, options)
    }))
    const response = await invoke()
    expect(response.statusCode).toBe(503)
    expect(response.body.error).toBe('Live passport unavailable')
  })

  it('abandons a hanging endpoint instead of spending the whole request budget', async () => {
    vi.stubEnv('SOLANA_RPC_URL', '')
    vi.stubEnv('SOLANA_RPC_ATTEMPT_TIMEOUT_MS', '60')
    const base = responses()
    const fetchMock = vi.fn((url, options = {}) => {
      if (String(url).includes('mainnet-beta.solana.com')) {
        // A host that accepts the connection and then never answers, but that does
        // honour cancellation the way a real fetch does.
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(new Error('The operation was aborted')))
        })
      }
      return base(url, options)
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await invoke()
    expect(response.statusCode).toBe(200)
    expect(response.body.state).toBe('PASS')
    expect(response.body.checks.find((check) => check.id === 'token-program').observations.some((o) => o.value.includes('publicnode'))).toBe(true)
  })
})
