# Passport integration contract

StockProof exposes a read-only, versioned JSON passport:

```text
GET https://stockproof-solana.vercel.app/api/scan?symbol=TSLAx
```

The response declares `schemaName: stockproof.passport` and `schemaVersion: 1.0.0`. The JSON Schema is published at a stable, machine-readable URL:

```text
https://stockproof-solana.vercel.app/schemas/stockproof.passport.v1.schema.json
```

Point a validator at that URL directly; it is the schema's own `$id`. The same file is kept in the repository at [`stockproof-passport.schema.json`](./stockproof-passport.schema.json), and a test fails the build if the two copies ever diverge.

## Request contract

`symbol` is required and **case-sensitive**. It must match a symbol pinned in `shared/assets.js` exactly.

| Request | Response |
| --- | --- |
| `GET /api/scan?symbol=TSLAx` | `200` passport |
| `GET /api/scan` or `GET /api/scan?symbol=` | `400` `Missing symbol` |
| `GET /api/scan?symbol=FAKEx` | `400` `Unsupported symbol` |
| `GET /api/scan?symbol=tslax` | `400` `Unsupported symbol` — case matters |
| `GET /api/scan?symbol=AAPLx&symbol=TSLAx` | `400` `Unsupported symbol` — an ambiguous request is refused |
| `POST /api/scan` | `405` `Method not allowed` |
| `OPTIONS /api/scan` | `204`, `Access-Control-Allow-Origin: *` |
| Any upstream source unavailable | `503` `Live passport unavailable` |

The route never substitutes a default asset. A missing or malformed symbol is an error, not a fallback, because silently answering about a different asset is the exact failure this layer exists to prevent.

## Minimal policy consumer

```js
const response = await fetch(
  'https://stockproof-solana.vercel.app/api/scan?symbol=TSLAx',
)

if (!response.ok) throw new Error('Passport source unavailable')

const passport = await response.json()

if (passport.schemaVersion !== '1.0.0') {
  throw new Error('Unsupported passport schema')
}

const ageMs = Date.now() - Date.parse(passport.scannedAt)
if (passport.mode !== 'live' || passport.state !== 'PASS' || !Number.isFinite(ageMs) || ageMs < -5 * 60_000 || ageMs > 5 * 60_000) {
  throw new Error(`Asset policy stopped: ${passport.state}`)
}

// Continue only after preserving passportId, scannedAt, rpcSlot, and evidence.
displayTokenizedEquity(passport.instrument)
```

## How the verdict is derived

`identity`, `token-program`, `multiplier`, `reserves`, and `controls` are **required** checks.

- Any check in a `fail` state — required or not — produces `BLOCKED`.
- A required check that is missing or `unknown` produces `UNVERIFIABLE`.
- Any check in a `caution` state produces `CAUTION`.
- Otherwise the passport is `PASS`.

Transfer controls are required because "transfers can be frozen and we could not tell" is not a clean conclusion: an unreadable pause extension abstains rather than passing. A set `freezeAuthority` is reported as an observation with `FREEZE SET` in the check result; it is a disclosed property of these issuances, not a failed check, so it does not change the verdict.

`corporate-actions` is observed rather than required. A past-effective record still marked `Scheduled` in the issuer feed downgrades the verdict to `CAUTION` without claiming the action failed.

`CAUTION` is not equivalent to `PASS`; the consuming product decides whether the visible warning is acceptable. `BLOCKED` means a required integrity check failed. `UNVERIFIABLE` means a required evidence layer was missing or invalid. A snapshot never represents current chain evidence.

## Provenance

Every passport carries `rpcSlot`, `scannedAt`, and an `evidence` array. Each evidence item names its `source`, `endpoint`, `retrievedAt`, and `state`. The Solana evidence record names the exact RPC host that answered, so a consumer can tell which endpoint produced the slot.

The Surface page executes this five-minute sample policy against the currently selected passport. It is a working consumer example within StockProof, not a claim that an external protocol has integrated the API.

The API is deterministic and does not provide a price prediction, trading signal, or independent custodian audit.
