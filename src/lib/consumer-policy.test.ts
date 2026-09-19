import { describe, expect, it } from 'vitest'
import { evaluateConsumerPolicy } from './consumer-policy'
import { snapshotFor } from '../data/snapshots'
import type { Passport } from '../types'

const now = Date.parse('2026-09-20T00:00:00Z')
const passport = (changes: Partial<Passport> = {}): Passport => ({ ...snapshotFor('TSLAx'), mode: 'live', state: 'PASS', scannedAt: new Date(now).toISOString(), ...changes })

describe('sample consumer policy', () => {
  it('accepts a current live PASS passport', () => {
    expect(evaluateConsumerPolicy(passport(), now).allowed).toBe(true)
  })
  it('stops snapshots, warnings, and stale evidence', () => {
    expect(evaluateConsumerPolicy(passport({ mode: 'snapshot' }), now).allowed).toBe(false)
    expect(evaluateConsumerPolicy(passport({ state: 'CAUTION' }), now).allowed).toBe(false)
    expect(evaluateConsumerPolicy(passport({ scannedAt: '2026-09-19T23:50:00Z' }), now).allowed).toBe(false)
  })
})
