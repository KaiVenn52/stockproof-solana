# StockProof demo script — target 2:20

## 0:00–0:18 — Hook

Show the live Passport screen already loaded.

“A tokenized stock is usually presented as a ticker, a logo, and a price. But a protocol needs harder answers: is this the official Solana mint, is its balance multiplier current, can transfers be paused, and do reported shares cover reported circulation?”

## 0:18–0:35 — Product

Keep the hero and audit surface visible.

“StockProof is a preflight integrity layer for tokenized equities on Solana. It produces one inspectable passport before a wallet, lending market, index product, or agent treats an asset as trusted input.”

## 0:35–1:38 — Live flow

Select AAPLx and wait for `LIVE · MAINNET`.

“I’ll issue a live passport for AAPLx. The server resolves the official xStocks deployment and independently reads the mint from Solana mainnet.”

Scroll to the overview, then expand `Corporate-action multiplier`.

“This is not static token metadata. StockProof parses the Token-2022 Scaled UI extension, chooses the effective multiplier by timestamp, and compares it with the issuer value. That matters because raw balances are not the balances users should see after dividends or splits.”

Expand `Reserve coverage`.

“Reserve coverage uses the reported custody shares divided by reported circulating tokens. The engine does not round a shortfall into compliance, and it keeps total mint supply separate because issuer inventory and system wallets may be included.”

Expand `Corporate-action schedule`.

“AAPLx currently returns past-effective records that are still marked Scheduled in the upcoming feed. StockProof does not claim the action failed; it preserves the source inconsistency and downgrades the passport to CAUTION.”

## 1:38–1:58 — Onchain proof

Open the Solana mint evidence and click `Open Solana Explorer`.

“Every passport carries provenance. Here is the same mint on Solana Explorer, plus the confirmed RPC slot, token program, source endpoint, and capture time used for this verdict.”

## 1:58–2:12 — Machine-readable policy

Return, select TSLAx, then click `Download`.

“Switching assets runs the entire graph again. TSLAx currently clears the required checks, so it receives PASS. The result is not trapped in this dashboard: this is a versioned JSON passport another app can enforce.”

## 2:12–2:20 — Close

Open Surface.

“StockProof makes tokenized equities safer to compose, not merely easier to display. Required failures block, missing evidence abstains, and every decision stays attributable.”
