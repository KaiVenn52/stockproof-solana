import { describe, expect, it } from 'vitest'
import { resolveInstrument, resolveInstrumentMatches } from './query'

describe('natural-language asset resolution', () => {
  it('resolves an xStock symbol', () => expect(resolveInstrument('Audit TSLAx on Solana')).toBe('TSLAx'))
  it('resolves a company name', () => expect(resolveInstrument('Verify NVIDIA backing')).toBe('NVDAx'))
  it('resolves the Nasdaq ETF', () => expect(resolveInstrument('Check QQQ multiplier')).toBe('QQQx'))
  it('does not match aliases embedded inside unrelated words', () => expect(resolveInstrument('review pineapple')).toBeNull())
  it('resolves newer pinned names', () => {
    expect(resolveInstrument('is google safe to hold')).toBe('GOOGLx')
    expect(resolveInstrument('check netflix multiplier')).toBe('NFLXx')
    expect(resolveInstrument('what about gold')).toBe('GLDx')
    expect(resolveInstrument('audit palantir')).toBe('PLTRx')
  })
  it('returns null for assets outside the pinned allowlist', () => {
    expect(resolveInstrument('should I buy shopify')).toBeNull()
    expect(resolveInstrument('audit tesla energy storage')).toBe('TSLAx')
  })
})

describe('ambiguous questions', () => {
  it('reports every asset a question names instead of picking one', () => {
    const matches = resolveInstrumentMatches('compare apple and tesla')
    expect(matches).toEqual(['AAPLx', 'TSLAx'])
  })

  it('reports a single match as a one-element list', () => {
    expect(resolveInstrumentMatches('verify nvidia backing')).toEqual(['NVDAx'])
  })

  it('reports nothing for an unpinned question', () => {
    expect(resolveInstrumentMatches('should I buy shopify')).toEqual([])
  })

  it('keeps the first match identical to the single-resolution helper', () => {
    expect(resolveInstrumentMatches('compare apple and tesla')[0]).toBe(resolveInstrument('compare apple and tesla'))
  })
})
