import { instruments } from '../data/snapshots'
import type { PassportState } from '../types'

export function Watchlist({ selected, assetStates, onSelect }: { selected: string; assetStates: Record<string, PassportState>; onSelect: (symbol: string) => void }) {
  return <section className="watchlist" aria-label="Tracked assets"><div className="watch-intro"><span>Audit surface</span><small>Four supported xStocks</small></div><div className="watch-rows">{instruments.map((item) => { const state = assetStates[item.symbol]; const stateClass = state === 'PASS' ? 'pass-text' : state === 'CAUTION' ? 'caution-text' : state === 'BLOCKED' ? 'fail-text' : 'unknown-text'; return <button key={item.symbol} className={`watch-row ${selected === item.symbol ? 'selected' : ''}`} onClick={() => onSelect(item.symbol)}><span className="watch-symbol">{item.symbol}</span><span className="watch-company">{item.underlyingSymbol}</span><span className={`watch-price ${state ? stateClass : ''}`}>{state ?? '—'}</span><span className={state ? stateClass : 'watch-empty'}>{state ? 'Passport issued' : 'Run passport'}</span></button> })}</div></section>
}
