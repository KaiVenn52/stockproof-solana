const surfaces = [
  ['Issuer identity', 'Ticker, ISIN, underlying, Solana deployment'],
  ['Token-2022', 'Program owner, decimals, Scaled UI, pause state'],
  ['Backing', 'Shares held, circulation, proof timestamp'],
  ['Corporate actions', 'Multiplier agreement and schedule hygiene'],
]

export function ReplayLab() {
  return <main className="content-view replay-view"><div className="view-heading"><div><h1>One passport, four trust boundaries</h1><p>StockProof is a preflight layer for wallets, swap interfaces, lending markets, index products, and agentic portfolio tools.</p></div></div><section className="panel benchmark-summary"><div><strong>4</strong><span>live Solana xStocks</span></div><div><strong>6</strong><span>deterministic checks</span></div><div><strong>2</strong><span>independent source classes</span></div><div><strong>0</strong><span>model-generated facts</span></div></section><section className="panel replay-table"><table><thead><tr><th>Boundary</th><th>Inputs exposed</th><th>Failure behavior</th></tr></thead><tbody>{surfaces.map(([name, inputs]) => <tr key={name}><td>{name}</td><td>{inputs}</td><td>Preserve warning or abstain</td></tr>)}</tbody></table><p className="table-note">The current prototype uses xStocks public endpoints and Solana mainnet RPC. It is intentionally read-only: the artifact is the evidence-backed passport, not a trade.</p></section></main>
}
