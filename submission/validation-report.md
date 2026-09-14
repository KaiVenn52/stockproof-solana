# Validation record

Observed on 2026-09-15 (Malaysia time) from the StockProof checkout and production deployment.

Production: https://stockproof-solana.vercel.app

## Deterministic and contract tests

- Vitest: 15/15 passed across three test files.
- Shared engine rejects zero, negative, missing, and non-finite reserve inputs.
- Required issuer-to-mint and token-program failures produce `BLOCKED`, not `CAUTION`.
- Route tests cover PASS, BLOCKED, UNVERIFIABLE, v1.0.0 output, invalid reserve inputs, and CORS preflight.
- ESLint passed with zero errors.
- Production TypeScript/Vite build passed.
- npm audit reported zero vulnerabilities.

## Live integration

- Three production rounds covered AAPLx, NVDAx, TSLAx, and QQQx: 12/12 responses were live `stockproof.passport` v1.0.0 contracts.
- Every response resolved to the allowlisted Solana mint, `spl-token-2022`, and a confirmed mainnet slot.
- TSLAx returned PASS. AAPLx, NVDAx, and QQQx returned CAUTION because the issuer's upcoming corporate-action endpoint still contained past-effective Scheduled records.
- Invalid API symbol returned HTTP 400.
- Cross-origin OPTIONS returned HTTP 204 with `Access-Control-Allow-Origin: *`.
- The exact local handler also passed the four-asset live integration probe against current xStocks and Solana sources.

## Rendered product QA

- Chrome via Playwright at 1440×1000, 390×844, and 768×1024.
- Page identity, non-blank app shell, framework-overlay absence, console health, and document overflow checks passed.
- Interaction path: live AAPLx → copy JSON → download JSON → validate exported schema → TSLAx → Surface consumer policy → Method.
- Input validation path: unsupported question → natural-language NVDA resolution → provenance expansion.
- Forced API failure produced `Snapshot mode`, `SNAPSHOT`, and `UNVERIFIABLE`; it did not retain the green live-evidence status.
- Two Playwright suites passed. The only console network error in the failure suite was the deliberately aborted API request.

The Browser plugin was unavailable, so rendered QA used Playwright with the installed Chrome executable. Live API results remain point-in-time observations and should be refreshed immediately before recording.
