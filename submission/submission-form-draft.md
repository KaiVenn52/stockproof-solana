# StockProof

**Tagline:** A preflight integrity layer for tokenized equities on Solana.

**Live demo:** https://stockproof-solana.vercel.app

**Source:** https://github.com/KaiVenn52/stockproof-solana

**Demo video:** `[VIDEO_URL]`

## Project description

Tokenized stocks are increasingly composable, but the data most apps expose is still just a ticker, logo, and price. That is not enough for a wallet, lending market, index product, or autonomous agent to decide whether an asset is safe to use. The ticker may resolve to the wrong mint, corporate actions can change displayed balances, transfer controls can pause a token, and custody reports can drift from reported circulation.

StockProof turns a tokenized-equity ticker into an evidence-backed preflight passport. A user selects AAPLx, NVDAx, TSLAx, or QQQx. The app resolves the official issuer deployment, reads the live mint from Solana mainnet, parses its SPL Token-2022 extensions, selects the effective Scaled UI multiplier, exposes the pause state, checks reported reserve coverage, and audits corporate-action timestamps. The output is PASS, CAUTION, BLOCKED, or UNVERIFIABLE—never a trading recommendation.

Solana is not a settlement logo attached to the product; it is one half of the verification boundary. StockProof reads the live Token-2022 account that controls how balances are displayed and whether transfers are paused, then reconciles that state against issuer metadata. Each passport preserves its Solana slot, source endpoint, evidence timestamp, and exact input values so another application can inspect the result instead of trusting a screenshot.

The prototype uses public xStocks endpoints and Solana mainnet RPC with no API key or wallet required. Its deterministic engine refuses invalid reserve denominators, never treats total mint supply as circulation, and blocks required identity or token-program failures. It also flags past-effective records that remain marked Scheduled in the issuer's upcoming corporate-actions feed. A snapshot fallback is clearly labeled and cannot issue a live conclusion.

StockProof now exposes a cross-origin `stockproof.passport` v1.0.0 JSON contract, published schema, copy/download controls, and a minimal consumer policy. Next, it will add signed attestations and an SDK so wallets, swap interfaces, lending markets, and portfolio agents can enforce passport policies before displaying, routing, or accepting tokenized equities.

## Judge walkthrough

1. Open the Passport screen and wait for `LIVE · MAINNET`.
2. Expand Corporate-action multiplier to compare issuer and effective onchain values.
3. Open Solana Explorer from the mint evidence record.
4. Select TSLAx to show a fresh end-to-end passport and state transition.
5. Copy or download the versioned JSON passport, then open Surface to inspect the consumer policy.

## Honest limitations

- Proof-of-reserves is issuer-reported; StockProof verifies internal coverage, freshness, and chain agreement, not the custodian itself.
- The prototype is read-only and does not execute trades.
- Legal availability varies by jurisdiction.
