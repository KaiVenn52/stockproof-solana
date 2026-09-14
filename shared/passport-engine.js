export const PASSPORT_SCHEMA_NAME = 'stockproof.passport'
export const PASSPORT_SCHEMA_VERSION = '1.0.0'

const REQUIRED_CHECKS = ['identity', 'token-program', 'multiplier', 'reserves']

export const finiteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

export const reserveCoverage = (sharesHeld, circulatingSupply) => {
  const shares = finiteNumber(sharesHeld)
  const circulating = finiteNumber(circulatingSupply)
  if (shares === null || circulating === null || shares < 0 || circulating <= 0) return null
  const coverage = shares / circulating
  return Number.isFinite(coverage) ? coverage : null
}

export const reserveState = (coverage) => {
  if (!Number.isFinite(coverage) || coverage < 0) return 'unknown'
  if (coverage >= 1) return 'pass'
  if (coverage >= 0.995) return 'caution'
  return 'fail'
}

export const multiplierState = (issuer, onchain) => {
  if (!Number.isFinite(issuer) || !Number.isFinite(onchain) || issuer <= 0 || onchain <= 0) return 'unknown'
  const delta = Math.abs(issuer - onchain)
  if (delta <= 1e-9) return 'pass'
  if (delta <= 1e-6) return 'caution'
  return 'fail'
}

export const derivePassportState = (checks) => {
  const required = REQUIRED_CHECKS.map((id) => checks.find((check) => check.id === id))
  if (required.some((check) => !check || check.state === 'unknown')) return 'UNVERIFIABLE'
  if (required.some((check) => check.state === 'fail') || checks.some((check) => check.state === 'fail')) return 'BLOCKED'
  if (checks.some((check) => check.state === 'caution')) return 'CAUTION'
  return 'PASS'
}

export const passportId = (symbol, slot, scannedAt) =>
  `${PASSPORT_SCHEMA_NAME}:${PASSPORT_SCHEMA_VERSION}:${symbol}:${slot ?? 'no-slot'}:${scannedAt}`
