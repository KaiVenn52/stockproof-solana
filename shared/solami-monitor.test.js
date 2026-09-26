import { describe, expect, it } from 'vitest'
import { changedFields, trackedMintState } from './solami-monitor.js'

const account = (paused = false) => ({ data: { parsed: { info: {
  supply: '100000000', decimals: 8, freezeAuthority: null,
  extensions: [
    { extension: 'scaledUiAmountConfig', state: { multiplier: 1, newMultiplier: 10, newMultiplierEffectiveTimestamp: 123 } },
    { extension: 'pausableConfig', state: { paused } },
  ],
} } } })

describe('Solami mint projection', () => {
  it('keeps the exact fields that affect a passport', () => {
    expect(trackedMintState(account())).toEqual({
      supply: '100000000', decimals: 8, multiplier: '1', newMultiplier: '10',
      newMultiplierEffectiveTimestamp: '123', paused: false, freezeAuthority: null,
    })
  })

  it('reports changed pause state without inventing other changes', () => {
    expect(changedFields(trackedMintState(account()), trackedMintState(account(true)))).toEqual(['paused'])
  })

  it('abstains when an extension cannot be parsed', () => {
    expect(trackedMintState({ data: { parsed: { info: { extensions: [] } } } })).toBeNull()
  })
})
