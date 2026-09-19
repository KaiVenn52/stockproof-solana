# Passport integration contract

StockProof exposes a read-only, versioned JSON passport:

```text
GET https://stockproof-solana.vercel.app/api/scan?symbol=TSLAx
```

The response declares `schemaName: stockproof.passport` and `schemaVersion: 1.0.0`. The JSON Schema is published in [`stockproof-passport.schema.json`](./stockproof-passport.schema.json).

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

`CAUTION` is not equivalent to `PASS`; the consuming product decides whether the visible warning is acceptable. `BLOCKED` means a required integrity check failed. `UNVERIFIABLE` means a required evidence layer was missing or invalid. A snapshot never represents current chain evidence.

The Surface page executes this five-minute sample policy against the currently selected passport. It is a working consumer example within StockProof, not a claim that an external protocol has integrated the API.

The API is deterministic and does not provide a price prediction, trading signal, or independent custodian audit.
