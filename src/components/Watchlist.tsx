import { instruments } from '../data/snapshots'
import type { MarketInstrument } from '../types'

export function Watchlist({ selected, liveQuotes, onSelect }: { selected: string; liveQuotes: Record<string, MarketInstrument>; onSelect: (symbol: string) => void }) {
  return <section className="watchlist" aria-label="Tracked assets"><div className="watch-intro"><span>Audit surface</span><small>Four live xStocks</small></div><div className="watch-rows">{instruments.map((item) => { const live = liveQuotes[item.symbol]; const quote = live?.tokenPrice; return <button key={item.symbol} className={`watch-row ${selected === item.symbol ? 'selected' : ''}`} onClick={() => onSelect(item.symbol)}><span className="watch-symbol">{item.symbol}</span><span className="watch-company">{item.underlyingSymbol}</span><span className="watch-price">{quote == null ? '—' : `$${quote.toFixed(2)}`}</span><span className={live ? 'positive' : 'watch-empty'}>{live ? 'MAINNET VERIFIED' : 'Run passport'}</span></button> })}</div></section>
}
