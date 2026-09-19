import type { CheckState, PassportState } from '../src/types'

export const PASSPORT_SCHEMA_NAME: 'stockproof.passport'
export const PASSPORT_SCHEMA_VERSION: '1.0.0'
export function finiteNumber(value: unknown): number | null
export function reserveCoverage(sharesHeld: unknown, circulatingSupply: unknown): number | null
export function reserveState(coverage: number | null): CheckState
export function reserveEvidenceState(coverage: number | null, timestamp: string | null | undefined, nowMs?: number): CheckState
export function displayedMintSupply(rawSupply: string | number | null | undefined, decimals: number, multiplier: number | null): number | null
export function multiplierState(issuer: number | null, onchain: number | null): CheckState
export function derivePassportState(checks: Array<{ id: string; state: CheckState }>): PassportState
export function passportId(symbol: string, slot: number | null, scannedAt: string): string
