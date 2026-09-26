# StockProof

**A preflight integrity layer for tokenized equities on Solana.**

StockProof turns a ticker into an evidence-backed passport before a wallet, swap UI, lending market, index product, or agent treats the asset as trusted input.

The live prototype cross-checks official xStocks metadata with Solana mainnet. It verifies the issuer-to-mint mapping, parses the SPL Token-2022 account, selects the effective Scaled UI multiplier, exposes pause controls, checks reported reserve coverage, and flags corporate-action schedule inconsistencies. Every verdict keeps its source, endpoint, capture time, and Solana slot.

## Why it exists

A tokenized stock is not just a price. The ticker can point at the wrong mint, a corporate action can change displayed balances, a token can be paused, and reported custody can fall out of sync with reported circulation. Most frontends flatten those facts into a logo and a quote.

The multiplier problem is concrete. `NFLXx` currently carries an effective onchain Scaled UI multiplier of **10.0** after a split. An app that reads the raw `amount` field and displays it will be wrong by a factor of ten, and nothing in a price feed tells it so. StockProof reads that multiplier from the Token-2022 mint account and reconciles it against issuer metadata before anything downstream trusts the number.

StockProof provides one deterministic preflight artifact:

- `PASS` — every required and observed check agrees.
- `CAUTION` — the asset is identifiable, but a visible warning remains.
- `BLOCKED` — a required identity, token-program, multiplier, or reserve check failed.
- `UNVERIFIABLE` — a required source is missing, so no clean conclusion is issued.

It never predicts price direction, recommends a trade, or turns missing data into a negative fact.

## Coverage, stated precisely

xStocks publishes **928 tokens with a Solana deployment**. StockProof pins **20** of them — the large-cap names an integrator is most likely to accept as collateral or route:

`AAPLx` `NVDAx` `MSFTx` `TSLAx` `AMZNx` `GOOGLx` `METAx` `AVGOx` `NFLXx` `AMDx` `PLTRx` `MSTRx` `COINx` `JPMx` `Vx` `UBERx` `ORCLx` `QQQx` `SPYx` `GLDx`

The mint for each is **pinned in source**, not discovered at runtime. `shared/assets.js` is the single registry that both the serverless route and the interface read, so the mint an app displays can never drift from the mint the evidence engine verified.

That is a deliberate trade-off. Dynamically accepting whatever mint issuer metadata returns would make the product cover all 928 assets and would also destroy the check it exists to perform: a silently changed deployment address is exactly the failure mode this layer is built to catch. Coverage is therefore a reviewed list, and `npm run live:verify` is the gate that keeps it honest — it fails if any pinned asset stops reconciling.

## Live evidence flow

```text
xStocks asset metadata ───────────────┐
xStocks multiplier + corporate actions│
xStocks proof of reserves ────────────┼─> deterministic checks ─> Stock Passport
Solana getAccountInfo ────────────────┘            │                 │
                                                   └─ evidence IDs ──┘
```

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

The API permits cross-origin `GET` requests and returns a `stockproof.passport` v1.0.0 object. See the [integration contract](docs/passport-integration.md). The JSON Schema is published at a stable URL — point a validator straight at it:

```text
https://stockproof-solana.vercel.app/schemas/stockproof.passport.v1.schema.json
```

The live UI can also copy or download the exact passport JSON.

### Request contract

| Request | Response |
| --- | --- |
| `GET /api/scan?symbol=TSLAx` | `200` passport |
| `GET /api/scan` or `?symbol=` | `400` `Missing symbol` — never a default asset |
| `GET /api/scan?symbol=FAKEx` | `400` `Unsupported symbol` — symbols are exact and case-sensitive |
| `GET /api/scan?symbol=AAPLx&symbol=TSLAx` | `400` — an ambiguous request is refused, not resolved |
| `POST /api/scan` | `405` — the route is read-only |
| `OPTIONS /api/scan` | `204` with `Access-Control-Allow-Origin: *` |
| upstream failure | `503` `Live passport unavailable` |

### Which checks decide the verdict

`identity`, `token-program`, `multiplier`, `reserves`, and `controls` are **required**. A failure in any check — required or not — produces `BLOCKED`. A missing or invalid required check produces `UNVERIFIABLE`. Any warning produces `CAUTION`.

Transfer controls are required on purpose. "Transfers can be frozen and we could not tell" is not a clean conclusion, so an unreadable pause extension abstains instead of passing. A set freeze authority is reported as an observation rather than a failure: it is a disclosed property of these issuances, and an integrator needs to know transfers can be stopped. `corporate-actions` is observed rather than required — a past-effective record still marked `Scheduled` downgrades the verdict to `CAUTION` without pretending the action failed.

The Surface tab executes a five-minute sample policy against the selected passport and visibly stops snapshots and non-PASS verdicts. It demonstrates integration behavior inside StockProof; it does not imply adoption by another protocol.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

The Vite-only development server shows the explicitly labeled fixture fallback because `/api/scan` is a serverless route. Use Vercel development mode to exercise live passports locally:

```powershell
npx.cmd vercel dev
```

No API key, wallet, or exchange credential is required. `SOLANA_RPC_URL` is optional; when absent, the server reads from Solana's public mainnet endpoint and falls back to a second public endpoint if that host fails. The endpoint that answered is reported in the passport evidence.

### Solami live-data mode

For the Superteam MY Solami side track, put a read-only Solami RPC/API key in a Git-ignored `.env.local` file:

```text
SOLAMI_API_KEY=your_key_here
```

Do not use a wallet keypair or commit this file. With `SOLAMI_API_KEY` present, `/api/scan` reads the Token-2022 mint **only through Solami RPC** and does not fall back to a public endpoint. The passport reports `rpc.solami.dev` as its chain evidence source but never returns the key. A deployment without this server-side environment variable still uses public RPC; check the returned chain evidence before claiming a Solami-backed demo. Do not set a `VITE_` variable or expose a broad key in browser code.

The watcher is a separate live-mainnet developer tool: it takes a confirmed Solami snapshot of all 20 pinned mints, then subscribes to those mint accounts and advancing slots through Solami WebSocket. It reports parsed multiplier, supply, pause and freeze-authority changes; it does not invent a change when none occurred.

```powershell
npm.cmd run solami:verify
npm.cmd run solami:watch -- --duration=30
# --duration=0 keeps the watcher running until Ctrl+C
```

The first command proves that all live passports used `rpc.solami.dev`. The second prints JSONL `snapshot`, `connected`, `health`, `mint_changed` (only when real), and `summary` events. A short recording may show zero mint changes because these fields change rarely; the confirmed snapshot, 20 subscriptions, and advancing slots are observable without fabricating activity. WebSocket monitoring runs as a Node process, not inside the Vercel serverless route, and requires an always-on host if offered as a continuous service.

## Verify

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run live:verify
npm.cmd run verify:schema
npm.cmd run verify:rendered
```

`live:verify` runs every pinned asset through the real route against current xStocks endpoints and Solana mainnet, asserts the asset identity, token program, RPC slot, and evidence provenance, and reports which check drove each verdict. It exits non-zero if any pinned asset returns `BLOCKED` or `UNVERIFIABLE`, so the allowlist cannot rot silently.

`verify:schema` fetches the published schema over HTTP and validates real passports against it, including a negative control that must be rejected. `verify:rendered` drives the deployed interface in Chrome at 1440×900 and 390×844 and asserts behaviour and contract rather than any asset's current verdict; point it at a local build with `STOCKPROOF_URL`.

## Architecture and trust boundary

- `shared/assets.js` — the pinned issuer-to-mint registry and query aliases.
- `shared/passport-engine.js` — published reserve, multiplier, and verdict rules.
- `api/scan.js` — bounded server-side source orchestration and passport assembly.
- `src/lib/integrity.ts` — re-export of the shared engine used by the UI.
- `src/services/scan.ts` — live request with an honest snapshot fallback.
- `src/components/PassportPanel.tsx` — expandable, source-visible verification graph.
- `scripts/validate-live.mjs` — reproducible live integration gate.

Proof-of-reserves fields remain issuer-reported. StockProof checks their internal coverage ratio and applies its own 72-hour freshness policy; it does not independently audit the offchain custodian or reconcile reported circulation against onchain supply. Mint supply is derived from the same parsed mint account used for the Token-2022 checks, then displayed separately because issuer inventory and system wallets may be included. Price is deliberately excluded from the preflight verdict and is not queried by this route.

## Built for Stocklana

StockProof targets the infrastructure and analytics wedge: make tokenized stocks safer to integrate, not merely easier to display. Solana is essential because the passport reads the live Token-2022 state that controls how balances are displayed and whether transfers can be paused.

Built with React, Vite, and `lucide-react`, reading public xStocks endpoints and Solana mainnet RPC. No third-party protocol integration is claimed. Released under the [MIT License](LICENSE).

Research infrastructure only. Not investment advice. Availability restrictions for tokenized equities vary by jurisdiction.
