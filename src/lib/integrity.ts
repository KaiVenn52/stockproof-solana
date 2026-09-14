import type { CheckState, IntegrityCheck, PassportState } from '../types'

export const reserveCoverage = (sharesHeld: number, circulatingSupply: number) =>
  circulatingSupply > 0 ? sharesHeld / circulatingSupply : 0

export const reserveState = (coverage: number): CheckState => {
  if (coverage >= 1) return 'pass'
  if (coverage >= 0.995) return 'caution'
  return 'fail'
}

export const multiplierState = (issuer: number, onchain: number): CheckState => {
  const delta = Math.abs(issuer - onchain)
  if (delta <= 1e-9) return 'pass'
  if (delta <= 1e-6) return 'caution'
  return 'fail'
}

export const derivePassportState = (checks: IntegrityCheck[]): PassportState => {
  const required = ['identity', 'token-program', 'multiplier', 'reserves']
  const requiredChecks = required.map((id) => checks.find((check) => check.id === id))
  if (requiredChecks.some((check) => !check || check.state === 'unknown')) return 'UNVERIFIABLE'
  if (checks.some((check) => check.state === 'fail' || check.state === 'caution')) return 'CAUTION'
  return 'PASS'
}
