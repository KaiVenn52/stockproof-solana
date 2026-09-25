export type CheckState = 'pass' | 'caution' | 'fail' | 'unknown'
export type PassportState = 'PASS' | 'CAUTION' | 'BLOCKED' | 'UNVERIFIABLE'
export type DataMode = 'live' | 'snapshot'

export interface MarketInstrument {
  symbol: string
  underlyingSymbol: string
  company: string
  tokenPrice: number | null
  mintAddress: string
  logo?: string
  network: 'Solana'
}

// What the audit surface remembers about an asset it has already visited. The
// mode is kept alongside the verdict so a frozen fixture can never be presented
// as an issued passport.
export interface AssetStateEntry {
  state: PassportState
  mode: DataMode
}

export interface IntegrityCheck {
  id: string
  title: string
  summary: string
  state: CheckState
  result: string
  detail: string
  observations: { label: string; value: string; accent?: CheckState }[]
}

export interface EvidenceItem {
  id: string
  title: string
  summary: string
  state: CheckState
  timestamp: string
  source: string
  endpoint: string
  retrievedAt: string
  href?: string
}

export interface TimelineEvent {
  id: string
  time: string
  title: string
  detail: string
  kind: 'token' | 'underlying' | 'news'
  offset: number
}

export interface Passport {
  schemaName: 'stockproof.passport'
  schemaVersion: '1.0.0'
  passportId: string
  researchQuestion?: string
  instrument: MarketInstrument
  state: PassportState
  mode: DataMode
  scannedAt: string
  sessionState: string
  rpcSlot: number | null
  tokenProgram: string
  decimals: number | null
  displayedSupply: number | null
  reserveCoverage: number | null
  multiplier: number | null
  paused: boolean | null
  corporateAction: string
  checks: IntegrityCheck[]
  evidence: EvidenceItem[]
  timeline: TimelineEvent[]
  brief: string
  researchAction: string
  reasoningNote: string
}
