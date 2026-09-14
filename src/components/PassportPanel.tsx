import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Passport } from '../types'
import { StatusMark } from './StatusMark'

const compact = (value: number | null) => value == null ? 'Unavailable' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: value > 1_000_000 ? 'compact' : 'standard' }).format(value)

export function PassportPanel({ passport }: { passport: Passport }) {
  const [expanded, setExpanded] = useState('multiplier')
  return <div className="passport-stack">
    <section className="passport-overview">
      <div className="passport-verdict"><span className="eyebrow">Solana stock passport</span><div className={`passport-state state-${passport.state.toLowerCase()}`}>{passport.state}</div><p>{passport.state === 'PASS' ? 'Required issuer and onchain checks agree at this evidence boundary.' : passport.state === 'CAUTION' ? 'The asset is identifiable, but one visible source warning needs attention.' : 'A required evidence layer is missing. No clean passport was issued.'}</p></div>
      <div className="primary-facts"><div><span>Indicative price</span><strong>{passport.instrument.tokenPrice == null ? 'Unavailable' : <>${passport.instrument.tokenPrice.toFixed(2)}</>}</strong><em>xStocks public data</em></div><div><span>Reported reserve coverage</span><strong>{passport.reserveCoverage == null ? 'Unavailable' : `${(passport.reserveCoverage * 100).toFixed(3)}%`}</strong><em>Shares held ÷ circulating</em></div><div><span>Effective multiplier</span><strong>{passport.multiplier == null ? 'Unavailable' : passport.multiplier.toFixed(9)}</strong><em>Token-2022 Scaled UI</em></div></div>
      <div className="secondary-facts"><div><span>Mint supply</span><strong>{compact(passport.displayedSupply)}</strong><em>Displayed units · not circulation</em></div><div><span>Token program</span><strong className={passport.tokenProgram === 'spl-token-2022' ? 'positive' : 'unknown-text'}>{passport.tokenProgram}</strong><em>{passport.rpcSlot ? `Slot ${passport.rpcSlot}` : 'No live slot'}</em></div><div><span>Pause control</span><strong className={passport.paused === false ? 'positive' : 'unknown-text'}>{passport.paused == null ? 'Unknown' : passport.paused ? 'Paused' : 'Active'}</strong><em>Live extension state</em></div><div><span>Corporate actions</span><strong>{passport.corporateAction}</strong><em>Schedule hygiene</em></div></div>
    </section>

    <section className="checks"><div className="section-title"><div><span className="section-kicker">Verification graph</span><h2>What the passport could prove</h2><p>Every conclusion expands to its exact inputs.</p></div><div className="legend"><span className="dot pass-dot" />Pass <span className="dot caution-dot" />Caution <span className="dot unknown-dot" />Unknown</div></div>
      <div className="check-list">{passport.checks.map((check) => { const isOpen = expanded === check.id; return <div className={`check ${isOpen ? 'open' : ''}`} key={check.id}><button onClick={() => setExpanded(isOpen ? '' : check.id)} aria-expanded={isOpen}><StatusMark state={check.state} compact /><span className="check-main"><b>{check.title}</b><small>{check.summary}</small></span><span className={`check-result result-${check.state}`}>{check.result}</span>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>{isOpen ? <div className="check-detail"><p>{check.detail}</p><dl>{check.observations.map((observation) => <div key={observation.label}><dt>{observation.label}</dt><dd className={observation.accent ? `${observation.accent}-text` : ''}>{observation.value}</dd></div>)}</dl></div> : null}</div> })}</div>
    </section>

    <section className="timeline"><div className="section-title"><div><span className="section-kicker">Evidence boundary</span><h2>Passport assembly</h2><p>Issuer and chain observations remain separately attributable.</p></div></div><div className="timeline-track">{passport.timeline.map((event) => <div className={`timeline-event event-${event.kind}`} key={event.id} style={{ left: `${event.offset}%` }}><div className="event-copy"><b>{event.time}</b><span>{event.title}</span><small>{event.detail}</small></div><i /></div>)}</div><div className="timeline-axis"><span>Issuer</span><span>Passport</span></div></section>
  </div>
}
