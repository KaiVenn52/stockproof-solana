import { describe, expect, it } from 'vitest'
import { resolveInstrument } from './query'

describe('natural-language asset resolution', () => {
  it('resolves an xStock symbol', () => expect(resolveInstrument('Audit TSLAx on Solana')).toBe('TSLAx'))
  it('resolves a company name', () => expect(resolveInstrument('Verify NVIDIA backing')).toBe('NVDAx'))
  it('resolves the Nasdaq ETF', () => expect(resolveInstrument('Check QQQ multiplier')).toBe('QQQx'))
  it('does not match aliases embedded inside unrelated words', () => expect(resolveInstrument('review pineapple')).toBeNull())
})
