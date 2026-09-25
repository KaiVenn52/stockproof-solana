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

## Hardening recheck — 2026-09-21 (Malaysia time)

Independent review found and this pass fixed a set of defects. All figures below were reproduced locally against the same commit that is deployed.

### Coverage

- The allowlist grew from 4 to **20 pinned xStocks**. `shared/assets.js` is now the single registry read by both `api/scan.js` and `src/data/snapshots.ts`, so the mint shown in the interface cannot drift from the mint the engine verifies.
- Context for the honest claim: xStocks publishes **928 tokens with a Solana deployment** (enumerated by paging `/public/v2/assets`). StockProof pins 20 of them. The product does **not** claim full coverage.
- All 20 were verified onchain before pinning: every mint is owned by `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`, is an initialized Token-2022 account with 8 decimals, and exposes both `scaledUiAmountConfig` and `pausableConfig`.
- `npm run live:verify` now walks every pinned asset through the real route, prints which check drove each verdict, and exits non-zero if any asset returns `BLOCKED` or `UNVERIFIABLE`. Result on 2026-09-21: **20/20 usable — 9 PASS, 11 CAUTION, 0 BLOCKED, 0 UNVERIFIABLE.** Every CAUTION was driven solely by past-effective `Scheduled` records in the issuer's upcoming corporate-actions feed.
- `NFLXx` carries an effective onchain Scaled UI multiplier of **10.0** after a split, and it reconciles against issuer metadata. This is the clearest live demonstration that raw token amounts are not user-visible balances.

### Request-boundary fixes

- A missing or empty `symbol` used to return a full NVDAx passport with HTTP 200. It now returns `400 Missing symbol`. The route never substitutes a default asset.
- Non-GET methods used to execute a full scan. They now return `405 Method not allowed`, matching the advertised CORS surface.
- A repeated `symbol` parameter is refused rather than resolved. Error responses now name the supported symbols and state that symbols are exact and case-sensitive.

### Reliability and quality

- Solana reads now walk an explicit endpoint list (`SOLANA_RPC_URL` → public mainnet → a second public endpoint) instead of trusting one host, and the passport reports the exact RPC host that answered. Failures still return `503` rather than a fabricated verdict.
- ESLint previously ignored `api/` entirely, leaving the serverless route unlinted. It is now covered.
- The rendered Playwright QA is committed as `scripts/verify-rendered.mjs` (`npm run verify:rendered`). Earlier claims of "two Playwright suites passed" were not reproducible because no spec was committed.
- A visible layout defect was fixed: at viewports ≥721px the `CURRENT PASSPORT` label and the ticker heading shared a line with 0px horizontal gap and 14px of box overlap. Measured overlap is now −5px at both 1440×900 and 390×844.
- `LICENSE` (MIT) added. The repository was public but had no license.

### Test and build state

- Vitest: **46/46 passed across five files** (up from 24 across four). New coverage: request-boundary refusals, RPC failover and total-failure behaviour, registry invariants (unique symbols, unique mints, well-formed base58, alias collisions), and ambiguous-question handling.
- ESLint, TypeScript/Vite build: passed.
- `npm audit` (full and `--omit=dev`): 0 vulnerabilities.
- `npm run verify:rendered` against a local server running the real handler: **36/36 checks passed** across 1440×900 and 390×844, including that all 20 pinned assets return a live schema 1.0.0 passport with a confirmed slot and `spl-token-2022`, and that a CAUTION asset drives the sample consumer policy to `STOP` while a PASS asset drives it to `ALLOW`. Zero console errors or warnings.

These remain point-in-time observations. Re-run every command on recording day.

## Verdict-semantics pass — 2026-09-21 (Malaysia time)

A second pass closed the remaining review finding and two defects the first pass missed.

### Transfer controls are now a required check

- `REQUIRED_CHECKS` is now `identity`, `token-program`, `multiplier`, `reserves`, `controls`. Previously an unreadable pause extension still produced `PASS`, which is the wrong answer for a preflight layer: "transfers can be frozen and we could not tell" is not a clean conclusion. It now abstains as `UNVERIFIABLE`.
- Verified against live sources: all 20 pinned assets expose `pausableConfig`, so the stricter rule changed nothing in practice — **20/20 still usable, 9 PASS, 11 CAUTION, 0 BLOCKED, 0 UNVERIFIABLE**.
- A set `freezeAuthority` is now disclosed in the check result itself (`NOT PAUSED · FREEZE SET`) with the authority address accented in the observations. All 20 issuances share one authority, so treating it as a failure would have destroyed every PASS; disclosing it is the honest option.

### Two defects found while verifying the above

- **Mobile hid the verdict text.** The `≤720px` stylesheet set `.check-result { display: none }`, so on a phone the collapsed rows showed no `MATCHED`, no `10.000000000`, no `2 STALE`, and no `FREEZE SET`. The result now sits on its own line under the summary. All six results are confirmed visible at 390×844.
- **A fixture could be labelled "Issued".** The audit surface stored only the verdict, so a snapshot fallback rendered as `UNVERIFIABLE · Issued` — describing a frozen fixture as an issued passport. It now stores the mode alongside the verdict and labels a fallback `Fixture`.

### Reproducibility and accessibility

- `package.json` no longer uses `"latest"` for any dependency; all 17 are pinned to the installed ranges, and `package-lock.json` was regenerated so `npm ci` stays in sync (verified with `npm ci --dry-run`).
- The Surface table gained a screen-reader caption and `scope="col"` headers; a `.sr-only` utility was added.
- The Method page now states the pinned-allowlist rationale, the required-check set, and the freeze-authority stance.

### State after this pass

- Vitest: **61/61 passed across six files** (up from 46).
- ESLint, TypeScript/Vite build: passed.
- `npm run live:verify`: 20/20 usable.
- `npm run verify:rendered` against a local server running the real handler: **38/38 checks passed** across 1440×900 and 390×844, including the new freeze-authority disclosure check.
- A fresh `npm ci` from the committed lockfile followed by lint, test, and build was run end to end — the same sequence Vercel and the new CI workflow execute.

### The published schema is now a served URL, verified end to end

`api/passport-schema.test.js` compiles `docs/stockproof-passport.schema.json` as draft 2020-12 and validates both the frozen fixture and a real route response produced by the handler, plus negative cases (an out-of-enum state, a dropped required field, an out-of-enum check state). The README advertised a published schema; until this pass nothing proved the schema described the artifact.

The schema is now also served at a stable URL, and its `$id` is that URL:

```text
https://stockproof-solana.vercel.app/schemas/stockproof.passport.v1.schema.json
```

`npm run verify:schema` fetches that URL over HTTP, compiles what comes back, and validates live passports against it — the same thing an integrator would do. Last run: schema `HTTP 200 · application/json`, five live passports valid (`GLDx`, `TSLAx`, `AAPLx`, `NFLXx`, `COINx`), and a tampered passport correctly rejected. A test fails the build if the served copy and the repository copy ever diverge.

### Repository hygiene

- `.github/workflows/verify.yml` runs `npm ci`, lint, test, and build on every push and pull request. The live and rendered suites are deliberately excluded from CI because they need live endpoints and a browser.
- `npm ci` was run from the committed lockfile and followed by lint, test, and build — the same sequence Vercel and CI execute.
