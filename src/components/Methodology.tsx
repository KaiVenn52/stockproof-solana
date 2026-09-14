export function Methodology() {
  return <main className="content-view methodology-view">
    <div className="view-heading"><div><h1>Evidence before composability</h1><p>A tokenized stock is more than a price. StockProof verifies the issuer-to-chain boundary before another app treats the asset as safe input.</p></div></div>
    <section className="method-rail">
      <div><span>01</span><h2>Resolve</h2><p>Bind an issuer ticker to an allowlisted Solana mint. Never accept arbitrary upstream URLs or silent mint changes.</p></div>
      <div><span>02</span><h2>Read</h2><p>Parse the live Token-2022 mint, Scaled UI multiplier, pause state, decimals, and supply from Solana mainnet.</p></div>
      <div><span>03</span><h2>Reconcile</h2><p>Compare issuer metadata, effective multiplier, reported circulation, custody shares, and action timestamps.</p></div>
      <div><span>04</span><h2>Issue</h2><p>Return PASS, CAUTION, BLOCKED, or UNVERIFIABLE in a versioned JSON contract with evidence IDs and timestamps.</p></div>
    </section>
    <section className="panel limitations"><h2>Declared boundaries</h2><ul><li>Proof-of-reserves fields are issuer-reported; StockProof verifies internal coverage, freshness, and chain agreement, not the offchain custodian itself.</li><li>Total mint supply is not treated as circulating supply because issuer inventory and system wallets may be included.</li><li>An active token does not imply legal availability in every jurisdiction.</li><li>No price prediction, order routing, or investment recommendation is produced.</li></ul></section>
  </main>
}
