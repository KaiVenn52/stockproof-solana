import { useEffect, useState } from 'react'
import { evaluateConsumerPolicy } from '../lib/consumer-policy'
import type { Passport } from '../types'

const surfaces = [
  ['Issuer identity', 'Ticker, ISIN, underlying, Solana deployment'],
  ['Token-2022', 'Program owner, decimals, Scaled UI, pause state'],
  ['Backing', 'Shares held, circulation, proof timestamp'],
  ['Corporate actions', 'Multiplier agreement and schedule hygiene'],
]

const policyExample = `const response = await fetch('/api/scan?symbol=TSLAx')
if (!response.ok) throw new Error('Passport unavailable')
const p = await response.json()

if (p.schemaVersion !== '1.0.0' ||
    p.mode !== 'live' ||
    p.state !== 'PASS' ||
    !Number.isFinite(Date.parse(p.scannedAt)) ||
    Date.now() - Date.parse(p.scannedAt) < -5 * 60_000 ||
    Date.now() - Date.parse(p.scannedAt) > 5 * 60_000) {
  throw new Error(\`Policy stopped: \${p.state}\`)
}`

export function ReplayLab({ passport }: { passport: Passport }) {
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])
  const decision = evaluateConsumerPolicy(passport, nowMs)
  return <main className="content-view replay-view">
    <div className="view-heading"><div><h1>One passport, four trust boundaries</h1><p>StockProof is a preflight layer for wallets, swap interfaces, lending markets, index products, and agentic portfolio tools.</p></div></div>
    <section className="panel benchmark-summary"><div><strong>4</strong><span>supported Solana xStocks</span></div><div><strong>6</strong><span>deterministic checks</span></div><div><strong>2</strong><span>source classes</span></div><div><strong>1.0</strong><span>versioned JSON schema</span></div></section>
    <section className={`panel consumer-decision ${decision.allowed ? 'decision-allow' : 'decision-stop'}`} aria-live="polite"><div><span className="section-kicker">Sample consumer policy · current passport</span><h2>{decision.allowed ? 'ALLOW' : 'STOP'} · {passport.instrument.symbol}</h2><p>{decision.reason}</p></div><dl><div><dt>Source</dt><dd>{passport.mode === 'live' ? 'Live mainnet' : 'Frozen fixture'}</dd></div><div><dt>Verdict</dt><dd>{passport.state}</dd></div><div><dt>RPC slot</dt><dd>{passport.rpcSlot ?? 'None'}</dd></div></dl></section>
    <section className="panel replay-table"><table><thead><tr><th>Boundary</th><th>Inputs exposed</th><th>Failure behavior</th></tr></thead><tbody>{surfaces.map(([name, inputs]) => <tr key={name}><td>{name}</td><td>{inputs}</td><td>Warn, block, or abstain</td></tr>)}</tbody></table><p className="table-note">The current prototype uses xStocks public endpoints and Solana mainnet RPC. It is intentionally read-only: the artifact is the evidence-backed passport, not a trade.</p></section>
    <section className="panel integration-example"><div><span className="section-kicker">Consumer policy</span><h2>Make the passport enforceable</h2><p>A downstream app continues only when the evidence is live, the schema is supported, and every required check passes.</p></div><pre><code>{policyExample}</code></pre></section>
  </main>
}
