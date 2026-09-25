import { describe, expect, it } from 'vitest'
import { ASSETS, QUERY_ALIASES, assetBySymbol, supportedSymbols, TOKEN_2022_PROGRAM } from './assets.js'

// The allowlist is the product's identity boundary. These invariants make an
// accidental duplicate or a malformed mint fail the build instead of silently
// weakening the issuer-to-mint check at runtime.

describe('pinned asset registry', () => {
  it('pins every symbol exactly once', () => {
    const symbols = ASSETS.map((asset) => asset.symbol)
    expect(new Set(symbols).size).toBe(symbols.length)
    expect(supportedSymbols).toEqual(symbols)
  })

  it('pins every mint exactly once', () => {
    const mints = ASSETS.map((asset) => asset.mint)
    expect(new Set(mints).size).toBe(mints.length)
  })

  it('uses well-formed base58 mint addresses', () => {
    for (const asset of ASSETS) {
      expect(asset.mint, `${asset.symbol} mint`).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
      expect(asset.mint.startsWith('Xs'), `${asset.symbol} should be an xStocks deployment`).toBe(true)
    }
  })

  it('keeps the issuer ticker pair consistent', () => {
    for (const asset of ASSETS) {
      expect(asset.symbol, `${asset.symbol}`).toBe(`${asset.underlyingSymbol}x`)
      expect(asset.company).toContain('xStock')
    }
  })

  it('exposes every pinned asset through the lookup map', () => {
    for (const asset of ASSETS) {
      expect(assetBySymbol.get(asset.symbol)).toBe(asset)
    }
    expect(assetBySymbol.size).toBe(ASSETS.length)
  })

  it('pins the SPL Token-2022 program the engine verifies against', () => {
    expect(TOKEN_2022_PROGRAM).toBe('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
  })
})

describe('query aliases', () => {
  it('covers every pinned asset', () => {
    for (const symbol of supportedSymbols) {
      expect(QUERY_ALIASES[symbol], `${symbol} has no aliases`).toBeDefined()
      expect(QUERY_ALIASES[symbol]).toContain(symbol.toLowerCase())
    }
  })

  it('never maps one alias to two assets', () => {
    const seen = new Map()
    for (const [symbol, terms] of Object.entries(QUERY_ALIASES)) {
      for (const term of terms) {
        expect(seen.has(term), `alias "${term}" is claimed by ${seen.get(term)} and ${symbol}`).toBe(false)
        seen.set(term, symbol)
      }
    }
  })

  it('keeps aliases lowercase and tokenizable', () => {
    for (const [symbol, terms] of Object.entries(QUERY_ALIASES)) {
      for (const term of terms) {
        expect(term, `${symbol} alias "${term}"`).toBe(term.toLowerCase())
        expect(term, `${symbol} alias "${term}" must survive tokenization`).toMatch(/^[a-z0-9]+$/)
      }
    }
  })
})
