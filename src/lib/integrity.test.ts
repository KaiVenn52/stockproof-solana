import { describe, expect, it } from 'vitest'
import { derivePassportState, multiplierState, reserveCoverage, reserveState } from './integrity'
import type { IntegrityCheck } from '../types'

const check = (id: string, state: IntegrityCheck['state']) => ({ id, state }) as IntegrityCheck

describe('stock passport integrity engine', () => {
  it('calculates reserve coverage without rounding it into compliance', () => {
    expect(reserveCoverage(100, 99)).toBeCloseTo(1.010101)
    expect(reserveState(reserveCoverage(99.4, 100))).toBe('fail')
  })
  it('uses a narrow tolerance for issuer versus onchain multipliers', () => {
    expect(multiplierState(1.003, 1.003)).toBe('pass')
    expect(multiplierState(1.0030005, 1.003)).toBe('caution')
    expect(multiplierState(1.004, 1.003)).toBe('fail')
  })
  it('abstains when a required layer is unavailable', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'unknown'), check('multiplier', 'pass'), check('reserves', 'pass')]
    expect(derivePassportState(checks)).toBe('UNVERIFIABLE')
  })
  it('surfaces warnings without pretending the passport failed', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'pass'), check('multiplier', 'pass'), check('reserves', 'pass'), check('corporate-actions', 'caution')]
    expect(derivePassportState(checks)).toBe('CAUTION')
  })
})
