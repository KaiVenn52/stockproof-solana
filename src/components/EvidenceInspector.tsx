import { Check, ChevronDown, Copy, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { Passport } from '../types'
import { StatusMark } from './StatusMark'

export function EvidenceInspector({ passport }: { passport: Passport }) {
  const [selected, setSelected] = useState(passport.evidence[0]?.id)
  const [showRaw, setShowRaw] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const active = passport.evidence.find((item) => item.id === selected) ?? passport.evidence[0]
  const payload = JSON.stringify(passport, null, 2)
  const copyPassport = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }
  const downloadPassport = () => {
    const blob = new Blob([payload], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `stockproof-${passport.instrument.symbol}-${passport.rpcSlot ?? 'snapshot'}.json`
    anchor.click()
    URL.revokeObjectURL(href)
  }
  return <aside className="evidence-panel">
    <div className="scan-meta"><span>Evidence bundle · schema v{passport.schemaVersion}</span><div><span className="mode-label">{passport.mode === 'live' ? 'LIVE · MAINNET' : 'SNAPSHOT'}</span><time>{new Date(passport.scannedAt).toLocaleTimeString([], { hour12: false, timeZone: 'UTC' })} UTC</time></div></div>
    <div className="passport-actions"><button type="button" onClick={() => void copyPassport()}>{copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />} {copyState === 'copied' ? 'Copied JSON' : 'Copy JSON'}</button><button type="button" onClick={downloadPassport}><Download size={14} /> Download</button><span aria-live="polite">{copyState === 'failed' ? 'Clipboard unavailable. Use Download.' : ''}</span></div>
    <section className="ai-brief"><span className="section-kicker">Machine-readable verdict</span><h2>Passport brief</h2>{passport.researchQuestion ? <div className="question-context"><span>Request</span><p>{passport.researchQuestion}</p></div> : null}<p>{passport.brief}</p><div className="reasoning-note">{passport.reasoningNote}</div></section>
    <section className="research-action"><span>Integration action</span><strong>{passport.researchAction}</strong><small>Policy key · {passport.state} · {passport.passportId}</small></section>
    <section className="evidence-list"><div className="evidence-head"><div><span className="section-kicker">Provenance</span><h3>Evidence records</h3></div><span>{passport.evidence.length}</span></div>{passport.evidence.map((item, index) => <button key={item.id} className={selected === item.id ? 'active' : ''} onClick={() => setSelected(item.id)}><span className="evidence-index">0{index + 1}</span><span className="evidence-copy"><b>{item.title}</b><small>{item.summary}</small></span><StatusMark state={item.state} compact /></button>)}</section>
    {active ? <section className="source-detail"><div className="detail-head"><div><span className="section-kicker">Selected source</span><h3>{active.title}</h3></div><ChevronDown size={16} /></div><dl><div><dt>Provider</dt><dd>{active.source}</dd></div><div><dt>Captured</dt><dd>{new Date(active.retrievedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC</dd></div><div><dt>Endpoint</dt><dd>{active.endpoint}</dd></div><div><dt>State</dt><dd className={`${active.state}-text`}>Recorded · {active.state}</dd></div></dl>{active.href ? <a className="raw-link" href={active.href} target="_blank" rel="noreferrer">Open Solana Explorer <ExternalLink size={13} /></a> : <button className="raw-link" onClick={() => setShowRaw((value) => !value)}>Inspect provenance <ExternalLink size={13} /></button>}{showRaw ? <pre className="raw-provenance">{JSON.stringify({ id: active.id, source: active.source, endpoint: active.endpoint, retrievedAt: active.retrievedAt, state: active.state }, null, 2)}</pre> : null}</section> : null}
  </aside>
}
