import { ASSETS } from '../../shared/assets.js'
import type { MarketInstrument, Passport } from '../types'

// Derived from the shared registry so the interface can never display a mint
// that the evidence engine would reject.
export const instruments: MarketInstrument[] = ASSETS.map((asset) => ({
  symbol: asset.symbol,
  underlyingSymbol: asset.underlyingSymbol,
  company: asset.company,
  tokenPrice: null,
  mintAddress: asset.mint,
  network: 'Solana',
}))

export function snapshotFor(symbol: string): Passport {
  const instrument = instruments.find((item) => item.symbol === symbol) ?? instruments[0]
  const scannedAt = '2026-09-14T08:00:00.000Z'
  return {
    schemaName: 'stockproof.passport',
    schemaVersion: '1.0.0',
    passportId: `stockproof.passport:1.0.0:${instrument.symbol}:no-slot:${scannedAt}`,
    instrument,
    state: 'UNVERIFIABLE',
    mode: 'snapshot',
    scannedAt,
    sessionState: 'Frozen fixture',
    rpcSlot: null,
    tokenProgram: 'SPL Token-2022',
    decimals: 8,
    displayedSupply: null,
    reserveCoverage: null,
    multiplier: null,
    paused: null,
    corporateAction: 'Not checked',
    checks: [
      { id: 'identity', title: 'Asset identity', summary: 'Issuer metadata maps the ticker to a Solana mint', state: 'unknown', result: 'FIXTURE', detail: 'The mint is a frozen demonstration value. Run a live scan before relying on it.', observations: [{ label: 'Recorded mint', value: instrument.mintAddress }] },
      { id: 'token-program', title: 'Token program', summary: 'Mint account is owned by the expected Solana token program', state: 'unknown', result: 'NOT LIVE', detail: 'No RPC response was captured during this fallback.', observations: [{ label: 'Expected', value: 'SPL Token-2022' }] },
      { id: 'multiplier', title: 'Scaled balance multiplier', summary: 'Issuer and effective onchain multipliers agree', state: 'unknown', result: 'NOT LIVE', detail: 'Corporate actions alter displayed balances through the Scaled UI extension.', observations: [{ label: 'Policy', value: 'Never reuse a stale multiplier' }] },
      { id: 'reserves', title: 'Reserve coverage', summary: 'Reported shares cover reported circulating supply', state: 'unknown', result: 'NOT LIVE', detail: 'Proof-of-reserves was not retrieved during this fallback.', observations: [{ label: 'Policy', value: 'No backing claim without current PoR' }] },
    ],
    evidence: [{ id: 'fixture', title: 'Frozen product fixture', summary: 'Fallback UI only; not current market evidence.', state: 'unknown', timestamp: '08:00', source: 'Bundled fixture', endpoint: 'No live request', retrievedAt: scannedAt }],
    timeline: [{ id: 't1', time: '08:00', title: 'Fixture loaded', detail: 'Live sources unavailable', kind: 'token', offset: 50 }],
    brief: 'Live issuer and Solana RPC evidence could not be retrieved. StockProof is showing a frozen interface fixture and refuses to issue a current integrity conclusion.',
    researchAction: 'Run the live passport again before using any displayed asset state.',
    reasoningNote: 'Deterministic fallback · no current-chain claims',
  }
}
