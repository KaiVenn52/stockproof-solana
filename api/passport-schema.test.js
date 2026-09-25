import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import handler from './scan.js'
import { snapshotFor } from '../src/data/snapshots'

// The README and the integration contract both advertise a published JSON
// Schema. This proves the schema actually describes what the route emits, so
// the contract cannot drift away from the artifact.

const schema = JSON.parse(readFileSync(new URL('../docs/stockproof-passport.schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

const report = () => JSON.stringify(validate.errors ?? [], null, 2)

const ok = (payload) => Promise.resolve({ ok: true, json: async () => payload })

const liveFetch = () => vi.fn((url) => {
  const target = String(url)
  if (target.includes('/public/assets/AAPLx/multiplier')) return ok({ currentMultiplier: '1.0032690125398187' })
  if (target.includes('/public/proof-of-reserves/AAPLx')) return ok({ sharesHeld: '40425', circulatingSupply: '40276.256917541672406', timestamp: new Date().toISOString() })
  if (target.includes('/public/corporate-actions/upcoming')) return ok({ nodes: [{ eventId: 'e-1', status: 'Scheduled', effectiveTimeUtc: '2026-05-11T00:30:00.000Z' }] })
  if (target.includes('/public/assets/AAPLx')) return ok({ symbol: 'AAPLx', name: 'Apple xStock', logo: 'https://example.test/AAPLx.png', underlying: { symbol: 'AAPL' }, deployments: [{ network: 'Solana', address: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp' }], trading: { currentPeriod: 'market' } })
  return ok({
    result: {
      context: { slot: 449132423 },
      value: {
        owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
        data: {
          program: 'spl-token-2022',
          parsed: {
            info: {
              decimals: 8,
              supply: '4027600000000',
              isInitialized: true,
              freezeAuthority: 'JDq14BWvqCRFNu1krb12bcRpbGtJZ1FLEakMw6FdxJNs',
              extensions: [
                { extension: 'scaledUiAmountConfig', state: { multiplier: 1.0032690125398187, newMultiplier: 1.0032690125398187, newMultiplierEffectiveTimestamp: 0 } },
                { extension: 'pausableConfig', state: { paused: false } },
              ],
            },
          },
        },
      },
    },
  })
})

const invoke = async () => {
  const response = { statusCode: 200, body: null, setHeader() { return this }, status(code) { this.statusCode = code; return this }, json(payload) { this.body = payload; return this }, end() { return this } }
  await handler({ method: 'GET', query: { symbol: 'AAPLx' } }, response)
  return response
}

afterEach(() => vi.unstubAllGlobals())

describe('published passport schema', () => {
  it('is a valid draft 2020-12 schema', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(typeof validate).toBe('function')
  })

  it('declares its own served URL as the canonical $id', () => {
    expect(schema.$id).toBe('https://stockproof-solana.vercel.app/schemas/stockproof.passport.v1.schema.json')
  })

  it('ships a byte-identical copy at the path that URL resolves to', () => {
    // Vite copies public/ to the site root, so this is the file an integrator
    // actually fetches. Keeping both copies identical is what makes the
    // published URL trustworthy.
    const served = readFileSync(new URL('../public/schemas/stockproof.passport.v1.schema.json', import.meta.url), 'utf8')
    const canonical = readFileSync(new URL('../docs/stockproof-passport.schema.json', import.meta.url), 'utf8')
    expect(served).toBe(canonical)
  })

  it('describes the frozen snapshot fixture', () => {
    const fixture = snapshotFor('AAPLx')
    expect(validate(fixture), report()).toBe(true)
  })

  it('describes a live route response', async () => {
    vi.stubGlobal('fetch', liveFetch())
    const response = await invoke()
    expect(response.statusCode).toBe(200)
    expect(validate(response.body), report()).toBe(true)
  })

  it('describes a CAUTION response as well as a PASS one', async () => {
    vi.stubGlobal('fetch', liveFetch())
    const response = await invoke()
    // The mocked feed contains a past-effective Scheduled record, so this run is CAUTION.
    expect(response.body.state).toBe('CAUTION')
    expect(validate(response.body), report()).toBe(true)
  })

  it('rejects a passport whose state is outside the published enum', () => {
    const fixture = { ...snapshotFor('AAPLx'), state: 'PROBABLY_FINE' }
    expect(validate(fixture)).toBe(false)
  })

  it('rejects a passport that drops a required top-level field', () => {
    const fixture = { ...snapshotFor('AAPLx') }
    delete fixture.passportId
    expect(validate(fixture)).toBe(false)
  })

  it('rejects a check whose state is outside the published enum', () => {
    const fixture = snapshotFor('AAPLx')
    fixture.checks = [{ ...fixture.checks[0], state: 'maybe' }]
    expect(validate(fixture)).toBe(false)
  })
})
