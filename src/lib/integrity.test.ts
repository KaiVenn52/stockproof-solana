import { describe, expect, it } from 'vitest'
import { derivePassportState, displayedMintSupply, multiplierState, reserveCoverage, reserveEvidenceState, reserveState } from './integrity'
import type { IntegrityCheck } from '../types'

const check = (id: string, state: IntegrityCheck['state']) => ({ id, state }) as IntegrityCheck

describe('stock passport integrity engine', () => {
  it('calculates reserve coverage without rounding it into compliance', () => {
    expect(reserveCoverage(100, 99)).toBeCloseTo(1.010101)
    expect(reserveState(reserveCoverage(99.4, 100))).toBe('fail')
  })
  it('refuses invalid reserve denominators and non-finite coverage', () => {
    expect(reserveCoverage(100, 0)).toBeNull()
    expect(reserveCoverage(-1, 100)).toBeNull()
    expect(reserveState(Number.POSITIVE_INFINITY)).toBe('unknown')
    expect(reserveCoverage('100oops', 100)).toBeNull()
  })
  it('uses a bounded issuer-report freshness policy', () => {
    const now = Date.parse('2026-09-20T00:00:00Z')
    expect(reserveEvidenceState(1, '2026-09-19T00:00:00Z', now)).toBe('pass')
    expect(reserveEvidenceState(1, '2026-09-16T00:00:00Z', now)).toBe('caution')
    expect(reserveEvidenceState(1, 'bad-date', now)).toBe('unknown')
    expect(reserveEvidenceState(0.9, 'bad-date', now)).toBe('fail')
  })
  it('derives displayed supply from the same mint account', () => {
    expect(displayedMintSupply('10000000000', 8, 1.1)).toBeCloseTo(110)
    expect(displayedMintSupply('9007199254740992', 8, 1)).toBeNull()
  })
  it('uses a narrow tolerance for issuer versus onchain multipliers', () => {
    expect(multiplierState(1.003, 1.003)).toBe('pass')
    expect(multiplierState(1.0030005, 1.003)).toBe('caution')
    expect(multiplierState(1.004, 1.003)).toBe('fail')
  })
  it('abstains when a required layer is unavailable', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'unknown'), check('multiplier', 'pass'), check('reserves', 'pass'), check('controls', 'pass')]
    expect(derivePassportState(checks)).toBe('UNVERIFIABLE')
  })
  it('treats unreadable transfer controls as missing evidence, not a clean pass', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'pass'), check('multiplier', 'pass'), check('reserves', 'pass'), check('controls', 'unknown')]
    expect(derivePassportState(checks)).toBe('UNVERIFIABLE')
  })
  it('abstains when the transfer-control layer is absent entirely', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'pass'), check('multiplier', 'pass'), check('reserves', 'pass')]
    expect(derivePassportState(checks)).toBe('UNVERIFIABLE')
  })
  it('surfaces warnings without pretending the passport failed', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'pass'), check('multiplier', 'pass'), check('reserves', 'pass'), check('controls', 'pass'), check('corporate-actions', 'caution')]
    expect(derivePassportState(checks)).toBe('CAUTION')
  })
  it('cautions on a paused mint', () => {
    const checks = [check('identity', 'pass'), check('token-program', 'pass'), check('multiplier', 'pass'), check('reserves', 'pass'), check('controls', 'caution')]
    expect(derivePassportState(checks)).toBe('CAUTION')
  })
  it('blocks when a required integrity check fails', () => {
    const checks = [check('identity', 'fail'), check('token-program', 'pass'), check('multiplier', 'pass'), check('reserves', 'pass')]
    expect(derivePassportState(checks)).toBe('BLOCKED')
  })
  it('keeps an explicit failure BLOCKED even when another source is missing', () => {
    const checks = [check('identity', 'fail'), check('token-program', 'pass'), check('multiplier', 'unknown'), check('reserves', 'pass')]
    expect(derivePassportState(checks)).toBe('BLOCKED')
  })
})
