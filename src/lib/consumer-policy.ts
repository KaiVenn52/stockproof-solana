import type { Passport } from '../types'

export function evaluateConsumerPolicy(passport: Passport, nowMs = Date.now()) {
  if (passport.schemaVersion !== '1.0.0') return { allowed: false, reason: 'Unsupported passport schema' }
  if (passport.mode !== 'live') return { allowed: false, reason: 'Snapshot evidence cannot authorize use' }
  if (passport.state !== 'PASS') return { allowed: false, reason: `${passport.state} is not a clean passport` }
  const scannedMs = Date.parse(passport.scannedAt)
  if (!Number.isFinite(scannedMs) || scannedMs > nowMs + 5 * 60_000 || nowMs - scannedMs > 5 * 60_000) {
    return { allowed: false, reason: 'Passport is older than the five-minute consumer policy' }
  }
  return { allowed: true, reason: 'Live, current PASS passport accepted by this sample policy' }
}
