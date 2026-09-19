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

## Completion recheck — 2026-09-20 (Malaysia time)

Production deployment: `dpl_2trFrMvmhGG13mhPhcTtK6yrwAFz`, sourced from commit `ba0491c` and aliased to https://stockproof-solana.vercel.app.

- 24/24 Vitest tests passed across four files; ESLint, TypeScript/Vite build, and production-dependency audit passed (zero vulnerabilities reported).
- The local live integration probe passed all four supported assets after the route stopped querying price and redundant `getTokenSupply`.
- A production cache-busted 12-request, three-round probe on the preceding deployment returned 12/12 live HTTP 200 passports. After the final price-free deployment, a fresh cache-busted four-asset probe returned 4/4 live HTTP 200, schema 1.0.0, six checks, and positive RPC slots. These are point-in-time observations, not an uptime guarantee.
- The final production Browser run verified AAPLx `CAUTION` → Surface `STOP`, TSLAx `PASS` → Surface `ALLOW`, responsive desktop 1440×900 and mobile 390×844 viewports, page identity, nonblank content, no framework overlay, no document-level horizontal overflow, and no relevant console errors or warnings.
- Browser UI showed `Copied JSON`; the Browser session's clipboard remained unreadable and its download event was not exposed, so this run did **not** independently prove saved-file contents. The versioned API contract and route tests passed.
- The reserve rule now checks the age of the issuer report against a product-defined 72-hour policy. It still does not audit offchain custody or reconcile issuer-reported circulation with onchain mint supply. Surface is a working *internal sample consumer*, not evidence of third-party adoption.

Record a fresh human walkthrough before submitting. Do not present this dated report as proof that external sources will remain available on recording day.
