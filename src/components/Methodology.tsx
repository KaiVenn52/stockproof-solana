export function Methodology() {
  return <main className="content-view methodology-view">
    <div className="view-heading"><div><h1>Evidence before composability</h1><p>A tokenized stock is more than a price. StockProof verifies the issuer-to-chain boundary before another app treats the asset as safe input.</p></div></div>
    <section className="method-rail">
      <div><span>01</span><h2>Resolve</h2><p>Bind an issuer ticker to an allowlisted Solana mint. Never accept arbitrary upstream URLs or silent mint changes.</p></div>
      <div><span>02</span><h2>Read</h2><p>Parse the live Token-2022 mint, Scaled UI multiplier, pause state, decimals, and supply from Solana mainnet.</p></div>
      <div><span>03</span><h2>Reconcile</h2><p>Compare issuer metadata, effective multiplier, reported circulation, custody shares, and action timestamps.</p></div>
      <div><span>04</span><h2>Issue</h2><p>Return PASS, CAUTION, BLOCKED, or UNVERIFIABLE in a versioned JSON contract with evidence IDs and timestamps.</p></div>
    </section>
    <section className="panel limitations"><h2>Declared boundaries</h2><ul><li>Coverage is a reviewed list, not a discovery engine. xStocks publishes 928 tokens with a Solana deployment; StockProof pins 20 of them. A mint is never accepted because issuer metadata offered it at request time, because a silently changed deployment address is the failure this layer exists to catch.</li><li>Identity, token-program, multiplier, reserves, and transfer controls are required checks. An unreadable pause extension abstains rather than passing, and a required failure blocks.</li><li>A set freeze authority is reported as an observation, not a failure: it is a disclosed property of these issuances, and an integrator needs to know transfers can be stopped.</li><li>Proof-of-reserves fields are issuer-reported; StockProof checks their internal coverage ratio and applies a 72-hour freshness policy. It does not independently audit custody or reconcile reported circulation to onchain supply.</li><li>Total mint supply is not treated as circulating supply because issuer inventory and system wallets may be included.</li><li>An active token does not imply legal availability in every jurisdiction.</li><li>No price prediction, order routing, or investment recommendation is produced.</li></ul></section>
  </main>
}
