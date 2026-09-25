# StockProof

**Tagline:** A preflight integrity layer for tokenized equities on Solana.

**Live demo:** https://stockproof-solana.vercel.app

**Source:** https://github.com/KaiVenn52/stockproof-solana

**Demo video:** Add your recording link when ready; leave this field blank if you submit before recording. Video is optional under the Stocklana rules.

## Project description

Tokenized stocks are increasingly composable, but the data most apps expose is still just a ticker, logo, and price. That is not enough for a wallet, lending market, index product, or autonomous agent to decide whether an asset is safe to use. The ticker may resolve to the wrong mint, corporate actions can change displayed balances, transfer controls can pause a token, and custody reports can drift from reported circulation.

StockProof turns a tokenized-equity ticker into an evidence-backed preflight passport. A user selects one of 20 pinned xStocks. The app resolves the official issuer deployment, reads the live mint from Solana mainnet, parses its SPL Token-2022 extensions, selects the effective Scaled UI multiplier, exposes the pause state, checks reported reserve coverage, and audits corporate-action timestamps. The output is PASS, CAUTION, BLOCKED, or UNVERIFIABLE—never a trading recommendation.

**The multiplier problem is the clearest example of why this matters.** `NFLXx` currently carries an effective onchain Scaled UI multiplier of **10.0** after a split. An app that reads the raw token `amount` and displays it is wrong by a factor of ten, and no price feed tells it so. StockProof reads that multiplier from the Token-2022 mint account and reconciles it against issuer metadata before anything downstream trusts the number.

Solana is not a settlement logo attached to the product; it is one half of the verification boundary. StockProof reads the live Token-2022 account that controls how balances are displayed and whether transfers are paused, then reconciles that state against issuer metadata. Each passport preserves its Solana slot, source endpoint, evidence timestamp, and exact input values so another application can inspect the result instead of trusting a screenshot.

The prototype uses public xStocks endpoints and Solana mainnet RPC with no API key or wallet required. Its deterministic engine refuses invalid reserve denominators, never treats total mint supply as circulation, blocks required identity or token-program failures, and refuses to substitute a default asset when the requested symbol is missing or ambiguous. It also flags past-effective records that remain marked Scheduled in the issuer's upcoming corporate-actions feed. A snapshot fallback is clearly labeled and cannot issue a live conclusion.

## Coverage, stated precisely

xStocks publishes 928 tokens with a Solana deployment. StockProof pins 20 of them—the large-cap names an integrator is most likely to accept as collateral or route.

The mint for each is pinned in source, not discovered at runtime. That is deliberate: dynamically accepting whatever mint issuer metadata returns would cover all 928 assets and would also destroy the check the product exists to perform. Coverage is a reviewed list, and `npm run live:verify` is the gate that keeps it honest—it fails if any pinned asset stops reconciling.

## Judge walkthrough

1. Open the Passport screen and wait for `LIVE · MAINNET`.
2. Select **NFLXx** and expand Corporate-action multiplier—the effective onchain value is `10.000000000`, and it matches issuer metadata.
3. Select **TSLAx**, **GLDx**, or **COINx** for a clean end-to-end `PASS`.
4. Expand Corporate-action schedule on **AAPLx** or **QQQx** to see a real issuer data-quality warning downgrade the verdict to `CAUTION`.
5. Open Solana Explorer from the mint evidence record and confirm the slot.
6. Copy or download the versioned JSON passport, then open Surface to inspect the consumer policy.

## Honest limitations

- Proof-of-reserves is issuer-reported. StockProof checks the internal coverage ratio and applies a 72-hour freshness policy; it does not independently audit custody or reconcile reported circulation against onchain supply.
- Coverage is 20 pinned assets out of the 928 xStocks with a Solana deployment. Assets outside the list return an explicit error.
- The prototype is read-only and does not execute trades. No external protocol has integrated the API; the Surface page is an internal sample consumer.
- Built with React, Vite, and `lucide-react`, reading public xStocks endpoints and Solana mainnet RPC. Released under the MIT License.
- Legal availability varies by jurisdiction.
