# Validation record

Observed on 2026-09-14 from the local StockProof checkout.

- Unit tests: 8/8 passed.
- ESLint: passed with zero errors.
- Production build: passed.
- Live integration probe: AAPLx, NVDAx, TSLAx, and QQQx all resolved to allowlisted Solana mints and confirmed Token-2022 accounts at current mainnet slots.
- Browser QA: Chrome via Playwright at 1440×1000 and 390×844.
- Interaction path: app load → live AAPLx passport → TSLAx passport → Surface → Method → mobile Passport.
- Browser console: no application warnings or errors.
- Layout: no document-level horizontal overflow at either viewport.

Live API results are point-in-time observations and should be re-run before submission recording.
