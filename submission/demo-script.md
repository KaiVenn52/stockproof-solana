# StockProof demo script — target 2:20

**Before recording**

- Refresh the production page and wait for `LIVE · MAINNET` (it sits inside the evidence panel; the top-bar badge reads `Live Solana evidence`). Stop and retry if it says `SNAPSHOT` or `UNVERIFIABLE`.
- Pre-run each asset you plan to show and note its current verdict. **Never narrate an old verdict as if it were live.**
- As of 2026-09-21 the clean `PASS` set was TSLAx, AMZNx, NFLXx, AMDx, PLTRx, MSTRx, COINx, UBERx, GLDx. Re-check on recording day.
- The pitch-video allowance is three minutes; keep the take under that.
- StockProof checks issuer-reported coverage, not independent custody. Say so if reserves come up.

## 0:00–0:22 — Hook

Open on the live Passport screen with **NFLXx** already selected and its multiplier visible.

“This is NFLXx — a tokenized Netflix share on Solana. Its onchain balance multiplier is **ten**. After the split, one raw token unit displays as ten shares. If your wallet, lending market, or index product reads the raw token amount, it is wrong by a factor of ten — and no price feed will tell you that.”

## 0:22–0:38 — Product

“StockProof is a preflight integrity layer for tokenized equities on Solana. Before an app treats an asset as trusted input, it gets one inspectable passport: PASS, CAUTION, BLOCKED, or UNVERIFIABLE.”

## 0:38–1:32 — Live flow

Scroll to the overview, then expand `Corporate-action multiplier`.

“Nothing here is static metadata. StockProof parses the Token-2022 Scaled UI extension, picks the effective multiplier by timestamp, and reconciles it against the issuer's published value. Ten point zero on both sides — that agreement is the thing an integrator actually needs.”

Expand `Reserve coverage`.

“Reserve coverage is reported custody shares over reported circulating tokens. The engine refuses to round a shortfall into compliance, and it keeps total mint supply separate because issuer inventory and system wallets can be included. This is issuer-reported — not an independent custody audit, and I won't claim otherwise.”

## 1:32–1:52 — A real warning, not a fake one

Select **AAPLx**, then expand `Corporate-action schedule`.

“AAPLx comes back CAUTION — and the reason is real. The issuer's own upcoming-actions feed still lists events as Scheduled whose effective time passed months ago. StockProof reports that as a source-quality warning. It does not claim the corporate action failed. That distinction is the product.”

## 1:52–2:10 — Onchain proof

Open the Solana mint evidence record and click `Open Solana Explorer`.

“Every passport carries provenance: the exact mint, the confirmed RPC slot, the token program, the endpoint that answered, and the capture time. You can re-derive this verdict yourself.”

## 2:10–2:22 — Machine-readable policy

Select **TSLAx**, then click `Download`. Open Surface.

“Switching assets re-runs the whole graph. The result is not trapped in this dashboard — it is a versioned JSON contract another app can enforce. Surface runs a five-minute sample policy: only a live, current PASS is ALLOW. Everything else stops. And I only call it PASS because the live screen says PASS.”

## 2:22–2:32 — Close

“StockProof pins twenty of the nine hundred and twenty-eight xStocks on Solana, and fails its own build if any of them stops reconciling. Required failures block, missing evidence abstains, and every decision stays attributable.”

---

## Never say

- “We audit custody” / “we prove the reserves are real”
- “This is a trading signal” / any price direction
- “Protocols are already using this” — Surface is an internal sample consumer
- “It covers all tokenized stocks” — it pins 20 of 928
