import { ArrowRight, RefreshCw, ScanLine, ShieldCheck } from 'lucide-react'
import { startTransition, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { EvidenceInspector } from './components/EvidenceInspector'
import { Methodology } from './components/Methodology'
import { PassportPanel } from './components/PassportPanel'
import { ReplayLab } from './components/ReplayLab'
import { Watchlist } from './components/Watchlist'
import { snapshotFor, instruments } from './data/snapshots'
import { resolveInstrumentMatches } from './lib/query'
import { runScan } from './services/scan'
import type { AssetStateEntry, Passport } from './types'

type View = 'live' | 'coverage' | 'methodology'
const completionNote = (result: Passport) => `${result.mode === 'live' ? 'Live passport issued' : 'Live scan unavailable; frozen fixture only'} · ${result.state}`

export default function App() {
  const [view, setView] = useState<View>('live')
  const [symbol, setSymbol] = useState('AAPLx')
  const [passport, setPassport] = useState<Passport>(() => snapshotFor('AAPLx'))
  const [assetStates, setAssetStates] = useState<Record<string, AssetStateEntry>>({})
  const [scanning, setScanning] = useState(true)
  const [researchQuestion, setResearchQuestion] = useState('Verify AAPLx before my app uses it')
  const [queryNote, setQueryNote] = useState(`Ask about any of the ${instruments.length} pinned xStocks — NVDA, AAPL, TSLA, GOOGL, GLD.`)
  const scanRequest = useRef(0)

  const scan = useCallback(async (nextSymbol: string, question = `Verify ${nextSymbol} on Solana`) => {
    const requestId = ++scanRequest.current
    setScanning(true)
    setQueryNote('Cross-checking issuer records with Solana mainnet.')
    const result = await runScan(nextSymbol, question)
    if (requestId !== scanRequest.current) return
    startTransition(() => {
      setPassport(result)
      setAssetStates((current) => ({ ...current, [result.instrument.symbol]: { state: result.state, mode: result.mode } }))
      setQueryNote(completionNote(result))
      setScanning(false)
    })
  }, [])

  useEffect(() => {
    let active = true
    const requestId = ++scanRequest.current
    void runScan('AAPLx', 'Verify AAPLx before my app uses it').then((result) => {
      if (!active || requestId !== scanRequest.current) return
      startTransition(() => {
        setPassport(result)
        setAssetStates({ [result.instrument.symbol]: { state: result.state, mode: result.mode } })
        setQueryNote(completionNote(result))
        setScanning(false)
      })
    })
    return () => { active = false }
  }, [])

  const selectSymbol = (next: string) => {
    const question = `Verify ${next} before my app uses it`
    setResearchQuestion(question)
    setSymbol(next)
    void scan(next, question)
  }

  const submitResearchQuestion = (event: FormEvent) => {
    event.preventDefault()
    const matches = resolveInstrumentMatches(researchQuestion)
    if (!matches.length) {
      setQueryNote(`Not in the pinned allowlist. StockProof pins ${instruments.length} xStocks — try NVDA, AAPL, TSLA, GOOGL, or GLD.`)
      return
    }
    if (matches.length > 1) {
      setQueryNote(`That question names ${matches.length} pinned assets (${matches.join(', ')}). Pick one in the audit surface.`)
      return
    }
    setSymbol(matches[0])
    void scan(matches[0], researchQuestion)
  }

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setView('live')} aria-label="Open Passport"><span className="brand-mark"><ShieldCheck size={18} /></span><span className="brand-copy"><strong>StockProof</strong><small>Solana equity passport</small></span></button><nav aria-label="Primary navigation"><button className={view === 'live' ? 'active' : ''} onClick={() => setView('live')}>Passport</button><button className={view === 'coverage' ? 'active' : ''} onClick={() => setView('coverage')}>Surface</button><button className={view === 'methodology' ? 'active' : ''} onClick={() => setView('methodology')}>Method</button></nav><div className={`system-status ${passport.mode === 'live' ? 'live-status' : 'snapshot-status'}`}><span className="pulse" />{passport.mode === 'live' ? 'Live Solana evidence' : 'Snapshot mode'}</div></header>
    {view === 'live' ? <main className={`live-view ${scanning ? 'is-scanning' : ''}`}>
      <section className="research-hero">
        <div className="hero-heading"><span className="eyebrow"><ScanLine size={14} /> Tokenized equity preflight</span><h1>Don’t trust the ticker.<br /><em>Verify the asset.</em></h1><p>One passport cross-checks issuer identity, Token-2022 state, corporate-action multipliers, transfer controls, and reported reserves.</p></div>
        <form className="research-bar" onSubmit={submitResearchQuestion}><label htmlFor="research-question">Asset question</label><div className="question-control"><input id="research-question" type="search" value={researchQuestion} onChange={(event) => setResearchQuestion(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby="query-note" /><button type="submit" disabled={scanning} aria-busy={scanning}>{scanning ? <RefreshCw className="spin" size={18} /> : <ArrowRight size={18} />}<span>{scanning ? 'Verifying' : 'Issue passport'}</span></button></div><small id="query-note" aria-live="polite">{queryNote}</small></form>
      </section>
      <Watchlist selected={symbol} assetStates={assetStates} onSelect={selectSymbol} />
      <section className="workbench">
        <div className="instrument-bar"><div><span>Current passport</span><h2>{passport.instrument.symbol}</h2><p>{passport.instrument.company} · {passport.instrument.network}</p></div><button className="scan-button" disabled={scanning} onClick={() => void scan(symbol, passport.researchQuestion ?? researchQuestion)}>{scanning ? <RefreshCw className="spin" size={16} /> : <ScanLine size={16} />}<span>{scanning ? 'Reading sources' : 'Refresh passport'}</span></button></div>
        <PassportPanel passport={passport} />
        <EvidenceInspector key={`${passport.instrument.symbol}-${passport.scannedAt}`} passport={passport} />
      </section>
    </main> : view === 'coverage' ? <ReplayLab passport={passport} /> : <Methodology />}
    <footer><div><b>StockProof</b><span>Preflight infrastructure for tokenized equities.</span></div><div>Issuer-bound · Onchain-verified · Composable</div><div>Research infrastructure. Not investment advice.</div></footer>
  </div>
}
