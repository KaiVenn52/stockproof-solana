# StockProof

**A preflight integrity layer for tokenized equities on Solana.**

StockProof turns a ticker into an evidence-backed passport before a wallet, swap UI, lending market, index product, or agent treats the asset as trusted input.

The live prototype cross-checks official xStocks metadata with Solana mainnet. It verifies the issuer-to-mint mapping, parses the SPL Token-2022 account, selects the effective Scaled UI multiplier, exposes pause controls, checks reported reserve coverage, and flags corporate-action schedule inconsistencies. Every verdict keeps its source, endpoint, capture time, and Solana slot.

## Why it exists

A tokenized stock is not just a price. The ticker can point at the wrong mint, a corporate action can change displayed balances, a token can be paused, and reported custody can fall out of sync with reported circulation. Most frontends flatten those facts into a logo and a quote.

StockProof provides one deterministic preflight artifact:

- `PASS` — required issuer and onchain checks agree.
- `CAUTION` — the asset is identifiable, but a visible warning remains.
- `BLOCKED` — a required identity, token-program, multiplier, or reserve check failed.
- `UNVERIFIABLE` — a required source is missing, so no clean conclusion is issued.

It never predicts price direction, recommends a trade, or turns missing data into a negative fact.

## Live evidence flow

```text
xStocks asset metadata ───────────────┐
xStocks multiplier + corporate actions│
xStocks proof of reserves ────────────┼─> deterministic checks ─> Stock Passport
Solana getAccountInfo ────────────────┘            │                 │
                                                   └─ evidence IDs ──┘
```

The current allowlist covers `AAPLx`, `NVDAx`, `TSLAx`, and `QQQx` on Solana mainnet.

## Consume a passport

```js
const response = await fetch('https://stockproof-solana.vercel.app/api/scan?symbol=TSLAx')
if (!response.ok) throw new Error('Passport unavailable')

const passport = await response.json()
const ageMs = Date.now() - Date.parse(passport.scannedAt)
if (passport.schemaVersion !== '1.0.0' || passport.mode !== 'live' || passport.state !== 'PASS' || !Number.isFinite(ageMs) || ageMs < -5 * 60_000 || ageMs > 5 * 60_000) {
  throw new Error(`Asset policy stopped: ${passport.state}`)
}
```

The API permits cross-origin `GET` requests and returns a `stockproof.passport` v1.0.0 object. See the [integration contract](docs/passport-integration.md) and [JSON Schema](docs/stockproof-passport.schema.json). The live UI can also copy or download the exact passport JSON.

The Surface tab executes the same five-minute sample policy against the selected passport and visibly stops snapshots and non-PASS verdicts. It demonstrates integration behavior inside StockProof; it does not imply adoption by another protocol.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

The Vite-only development server shows the explicitly labeled fixture fallback because `/api/scan` is a serverless route. Use Vercel development mode to exercise live passports locally:

```powershell
npx.cmd vercel dev
```

No API key, wallet, or exchange credential is required. `SOLANA_RPC_URL` is optional; when absent, the server uses Solana's public mainnet endpoint.

## Verify

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run live:verify
```

`live:verify` executes all four passports against current xStocks public endpoints and Solana mainnet RPC, then asserts the asset identity, token program, RPC slot, and evidence provenance.

## Architecture and trust boundary

- `api/scan.js` — bounded server-side source orchestration and passport assembly.
- `src/lib/integrity.ts` — published reserve, multiplier, and verdict rules.
- `src/services/scan.ts` — live request with an honest snapshot fallback.
- `src/components/PassportPanel.tsx` — expandable, source-visible verification graph.
- `scripts/validate-live.mjs` — reproducible live integration probe.
- `submission/` — Stocklana-ready copy, demo script, and HTML submission artifact.

Proof-of-reserves fields remain issuer-reported. StockProof checks their internal coverage ratio and applies its own 72-hour freshness policy; it does not independently audit the offchain custodian or reconcile reported circulation against onchain supply. Mint supply is derived from the same parsed mint account used for the Token-2022 checks, then displayed separately because issuer inventory and system wallets may be included. Indicative price is optional: a slow price endpoint cannot prevent an integrity passport from being issued.

## Built for Stocklana

StockProof targets the infrastructure and analytics wedge: make tokenized stocks safer to integrate, not merely easier to display. Solana is essential because the passport reads the live Token-2022 state that controls how balances are displayed and whether transfers can be paused.

Research infrastructure only. Not investment advice. Availability restrictions for tokenized equities vary by jurisdiction.
