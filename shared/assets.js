// Canonical StockProof asset registry — the single source of truth for
// issuer-to-mint identity. Both the serverless route (api/scan.js) and the
// frontend (src/data/snapshots.ts) read this file, so a mint can never drift
// between the evidence engine and the interface.
//
// Trust decision: mints are pinned here on purpose. StockProof never accepts a
// mint discovered dynamically from issuer metadata, because a silently changed
// deployment address is exactly the failure this product exists to catch.
//
// Adding an asset is a deliberate act:
//   1. confirm the official xStocks Solana deployment and pin its mint here,
//   2. add its query aliases below,
//   3. run `npm.cmd run live:verify`.
// That gate fails if the mint does not reconcile, or if the account is not an
// initialized Token-2022 mint exposing both scaledUiAmountConfig and
// pausableConfig. An unreadable pause extension is treated as missing evidence,
// so an asset without it can never produce a PASS passport.

export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

export const ASSETS = [
  { symbol: 'AAPLx', underlyingSymbol: 'AAPL', company: 'Apple xStock', mint: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp' },
  { symbol: 'NVDAx', underlyingSymbol: 'NVDA', company: 'NVIDIA xStock', mint: 'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh' },
  { symbol: 'MSFTx', underlyingSymbol: 'MSFT', company: 'Microsoft xStock', mint: 'XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX' },
  { symbol: 'TSLAx', underlyingSymbol: 'TSLA', company: 'Tesla xStock', mint: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB' },
  { symbol: 'AMZNx', underlyingSymbol: 'AMZN', company: 'Amazon.com xStock', mint: 'Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg' },
  { symbol: 'GOOGLx', underlyingSymbol: 'GOOGL', company: 'Alphabet xStock', mint: 'XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN' },
  { symbol: 'METAx', underlyingSymbol: 'META', company: 'Meta xStock', mint: 'Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu' },
  { symbol: 'AVGOx', underlyingSymbol: 'AVGO', company: 'Broadcom xStock', mint: 'XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo' },
  { symbol: 'NFLXx', underlyingSymbol: 'NFLX', company: 'Netflix xStock', mint: 'XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL' },
  { symbol: 'AMDx', underlyingSymbol: 'AMD', company: 'AMD xStock', mint: 'XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF' },
  { symbol: 'PLTRx', underlyingSymbol: 'PLTR', company: 'Palantir xStock', mint: 'XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4' },
  { symbol: 'MSTRx', underlyingSymbol: 'MSTR', company: 'MicroStrategy xStock', mint: 'XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ' },
  { symbol: 'COINx', underlyingSymbol: 'COIN', company: 'Coinbase xStock', mint: 'Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu' },
  { symbol: 'JPMx', underlyingSymbol: 'JPM', company: 'JPMorgan Chase xStock', mint: 'XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C' },
  { symbol: 'Vx', underlyingSymbol: 'V', company: 'Visa xStock', mint: 'XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p' },
  { symbol: 'UBERx', underlyingSymbol: 'UBER', company: 'Uber xStock', mint: 'XsAsZLF4MmsvS1sDxRMrUz7REjHfwbC9UAMXSRBqgEB' },
  { symbol: 'ORCLx', underlyingSymbol: 'ORCL', company: 'Oracle xStock', mint: 'XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL' },
  { symbol: 'QQQx', underlyingSymbol: 'QQQ', company: 'Nasdaq xStock', mint: 'Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ' },
  { symbol: 'SPYx', underlyingSymbol: 'SPY', company: 'SP500 xStock', mint: 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W' },
  { symbol: 'GLDx', underlyingSymbol: 'GLD', company: 'Gold xStock', mint: 'Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re' },
]

export const assetBySymbol = new Map(ASSETS.map((asset) => [asset.symbol, asset]))

export const supportedSymbols = ASSETS.map((asset) => asset.symbol)

// Query aliases let a user type "google", "alphabet" or "googl" and still reach
// the pinned GOOGLx mint. They never introduce a new mint: every alias resolves
// to a symbol already present in ASSETS.
export const QUERY_ALIASES = {
  AAPLx: ['aaplx', 'aapl', 'apple'],
  NVDAx: ['nvdax', 'nvda', 'nvidia'],
  MSFTx: ['msftx', 'msft', 'microsoft'],
  TSLAx: ['tslax', 'tsla', 'tesla'],
  AMZNx: ['amznx', 'amzn', 'amazon'],
  GOOGLx: ['googlx', 'googl', 'goog', 'google', 'alphabet'],
  METAx: ['metax', 'meta', 'facebook'],
  AVGOx: ['avgox', 'avgo', 'broadcom'],
  NFLXx: ['nflxx', 'nflx', 'netflix'],
  AMDx: ['amdx', 'amd'],
  PLTRx: ['pltrx', 'pltr', 'palantir'],
  MSTRx: ['mstrx', 'mstr', 'microstrategy', 'strategy'],
  COINx: ['coinx', 'coinbase'],
  JPMx: ['jpmx', 'jpm', 'jpmorgan'],
  Vx: ['vx', 'visa'],
  UBERx: ['uberx', 'uber'],
  ORCLx: ['orclx', 'orcl', 'oracle'],
  QQQx: ['qqqx', 'qqq', 'nasdaq', 'invesco'],
  SPYx: ['spyx', 'spy', 'sp500', 'sandp'],
  GLDx: ['gldx', 'gld', 'gold'],
}
