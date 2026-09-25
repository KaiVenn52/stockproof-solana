import { instruments } from '../data/snapshots'
import type { AssetStateEntry } from '../types'

export function Watchlist({ selected, assetStates, onSelect }: { selected: string; assetStates: Record<string, AssetStateEntry>; onSelect: (symbol: string) => void }) {
  return <section className="watchlist" aria-label="Tracked assets"><div className="watch-intro"><span>Audit surface</span><small>{instruments.length} pinned xStocks</small></div><div className="watch-rows">{instruments.map((item) => {
    const entry = assetStates[item.symbol]
    const state = entry?.state
    const stateClass = state === 'PASS' ? 'pass-text' : state === 'CAUTION' ? 'caution-text' : state === 'BLOCKED' ? 'fail-text' : 'unknown-text'
    // A frozen fixture is never described as an issued passport.
    const caption = !entry ? 'Run scan' : entry.mode === 'live' ? 'Issued' : 'Fixture'
    const captionClass = !entry ? 'watch-empty' : entry.mode === 'live' ? stateClass : 'watch-empty'
    return <button key={item.symbol} className={`watch-row ${selected === item.symbol ? 'selected' : ''}`} onClick={() => onSelect(item.symbol)}><span className="watch-symbol">{item.symbol}</span><span className="watch-company">{item.underlyingSymbol}</span><span className={`watch-price ${state ? stateClass : ''}`}>{state ?? '—'}</span><span className={captionClass}>{caption}</span></button>
  })}</div></section>
}
