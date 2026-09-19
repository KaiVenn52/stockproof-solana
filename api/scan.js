import {
  PASSPORT_SCHEMA_NAME,
  PASSPORT_SCHEMA_VERSION,
  derivePassportState,
  displayedMintSupply,
  finiteNumber,
  multiplierState,
  passportId,
  reserveCoverage,
  reserveEvidenceState,
} from '../shared/passport-engine.js'

const XSTOCKS_BASE = 'https://api.xstocks.fi/api/v2'
const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

const allowed = new Map([
  ['NVDAx', { company: 'NVIDIA xStock', mint: 'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh' }],
  ['AAPLx', { company: 'Apple xStock', mint: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp' }],
  ['TSLAx', { company: 'Tesla xStock', mint: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB' }],
  ['QQQx', { company: 'Nasdaq xStock', mint: 'Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ' }],
])

const json = async (url, signal) => {
  const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'StockProof/0.1' }, signal })
  if (!response.ok) throw new Error(`${new URL(url).pathname} failed (${response.status})`)
  return response.json()
}

const rpc = async (method, params, signal) => {
  const response = await fetch(process.env.SOLANA_RPC_URL || DEFAULT_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
    signal,
  })
  const payload = await response.json()
  if (!response.ok || payload.error) throw new Error(`Solana ${method} failed`)
  return payload.result
}

const time = (value) => new Date(value).toISOString().slice(11, 16)

export default async function handler(req, res) {
  res.setHeader?.('Access-Control-Allow-Origin', '*')
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader?.('Cache-Control', 's-maxage=15, stale-while-revalidate=30')
  if (req.method === 'OPTIONS') return res.status(204).end()
  const symbol = String(req.query.symbol || 'NVDAx')
  const meta = allowed.get(symbol)
  if (!meta) return res.status(400).json({ error: 'Unsupported symbol' })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const encoded = encodeURIComponent(symbol)
    const asset = await json(`${XSTOCKS_BASE}/public/assets/${encoded}`, controller.signal)
    const deployment = asset.deployments?.find((item) => item.network === 'Solana')
    const mint = deployment?.address
    if (!mint) throw new Error('Issuer returned no Solana deployment')
    const [price, multiplier, reserves, corporate, account] = await Promise.all([
      json(`${XSTOCKS_BASE}/public/assets/${encoded}/price-data`, AbortSignal.timeout(1_500)).catch(() => ({ quote: null })),
      json(`${XSTOCKS_BASE}/public/assets/${encoded}/multiplier?network=Solana`, controller.signal),
      json(`${XSTOCKS_BASE}/public/proof-of-reserves/${encoded}`, controller.signal),
      json(`${XSTOCKS_BASE}/public/corporate-actions/upcoming?symbol=${encoded}&pageSize=100`, controller.signal),
      rpc('getAccountInfo', [mint, { encoding: 'jsonParsed', commitment: 'confirmed' }], controller.signal),
    ])

    const scannedAt = new Date().toISOString()
    const mintInfo = account?.value?.data?.parsed?.info
    if (!mintInfo) throw new Error('Mint account was not parseable')
    const extensions = new Map((mintInfo.extensions || []).map((item) => [item.extension, item.state]))
    const scaled = extensions.get('scaledUiAmountConfig')
    const pausable = extensions.get('pausableConfig')
    const nowSeconds = Math.floor(Date.now() / 1000)
    const effectiveMultiplier = scaled
      ? finiteNumber(nowSeconds >= Number(scaled.newMultiplierEffectiveTimestamp) ? scaled.newMultiplier : scaled.multiplier)
      : null
    const issuerMultiplier = finiteNumber(multiplier.currentMultiplier)
    const coverage = reserveCoverage(reserves.sharesHeld, reserves.circulatingSupply)
    const identityState = mint === meta.mint && asset.symbol === symbol ? 'pass' : 'fail'
    const programState = account.value.owner === TOKEN_2022_PROGRAM && account.value.data.program === 'spl-token-2022' && mintInfo.isInitialized === true ? 'pass' : 'fail'
    const multiplierCheckState = multiplierState(issuerMultiplier, effectiveMultiplier)
    const reserveCheckState = reserveEvidenceState(coverage, reserves.timestamp)
    const displayedSupply = displayedMintSupply(mintInfo.supply, mintInfo.decimals, effectiveMultiplier)
    const paused = typeof pausable?.paused === 'boolean' ? pausable.paused : null
    const staleScheduled = (corporate.nodes || []).filter((item) => item.status === 'Scheduled' && Date.parse(item.effectiveTimeUtc) < Date.now())
    const futureActions = (corporate.nodes || []).filter((item) => Date.parse(item.effectiveTimeUtc) >= Date.now())
    const corporateState = staleScheduled.length ? 'caution' : 'pass'

    const checks = [
      { id: 'identity', title: 'Issuer-to-mint identity', summary: 'Official asset metadata resolves to the allowlisted Solana mint', state: identityState, result: identityState === 'pass' ? 'MATCHED' : 'MISMATCH', detail: 'StockProof treats the ticker and mint as a pair. A changed mint cannot silently pass through the interface.', observations: [{ label: 'Ticker', value: asset.symbol }, { label: 'Solana mint', value: mint }, { label: 'Underlying', value: asset.underlying?.symbol || asset.underlyingSymbol }] },
      { id: 'token-program', title: 'Token-2022 state', summary: 'The mint is parsed directly from Solana mainnet', state: programState, result: programState === 'pass' ? 'VERIFIED' : 'UNEXPECTED', detail: 'The RPC response must identify an initialized mint owned by the SPL Token-2022 program.', observations: [{ label: 'Program', value: account.value.data.program }, { label: 'Decimals', value: String(mintInfo.decimals) }, { label: 'RPC slot', value: String(account.context.slot) }] },
      { id: 'multiplier', title: 'Corporate-action multiplier', summary: 'Issuer multiplier agrees with the effective Scaled UI value onchain', state: multiplierCheckState, result: effectiveMultiplier == null ? 'UNAVAILABLE' : effectiveMultiplier.toFixed(9), detail: 'Solana raw balances require the Token-2022 Scaled UI multiplier. StockProof selects the effective value by timestamp before comparing it with issuer metadata.', observations: [{ label: 'Issuer API', value: issuerMultiplier == null ? 'Unavailable' : issuerMultiplier.toFixed(12), accent: multiplierCheckState }, { label: 'Effective onchain', value: effectiveMultiplier == null ? 'Unavailable' : effectiveMultiplier.toFixed(12), accent: multiplierCheckState }] },
      { id: 'reserves', title: 'Reserve coverage', summary: 'Issuer-reported shares cover issuer-reported circulating tokens', state: reserveCheckState, result: coverage == null ? 'UNAVAILABLE' : `${(coverage * 100).toFixed(3)}%`, detail: 'This checks the internal ratio in the issuer report, not independent custody or onchain circulating supply. A missing or future-dated timestamp is unverifiable; a report older than the product policy of 72 hours is CAUTION. Total mint supply is shown separately because inventory and system wallets may be included.', observations: [{ label: 'Shares held', value: String(reserves.sharesHeld) }, { label: 'Circulating', value: String(reserves.circulatingSupply) }, { label: 'PoR timestamp', value: String(reserves.timestamp ?? 'Unavailable') }, { label: 'Freshness policy', value: '72 hours' }] },
      { id: 'controls', title: 'Transfer controls', summary: 'The onchain pause control is surfaced instead of hidden', state: paused == null ? 'unknown' : paused ? 'caution' : 'pass', result: paused == null ? 'UNAVAILABLE' : paused ? 'PAUSED' : 'ACTIVE', detail: 'Tokenized equities can include administrative controls. StockProof makes the live pause state visible before downstream integration.', observations: [{ label: 'Pausable extension', value: paused == null ? 'Not parsed' : paused ? 'Paused' : 'Not paused' }, { label: 'Freeze authority', value: mintInfo.freezeAuthority || 'None' }] },
      { id: 'corporate-actions', title: 'Corporate-action schedule', summary: 'Scheduled events are checked against their effective timestamps', state: corporateState, result: staleScheduled.length ? `${staleScheduled.length} STALE` : futureActions.length ? `${futureActions.length} UPCOMING` : 'CLEAR', detail: staleScheduled.length ? 'The public upcoming feed contains scheduled records whose effective time has already passed. StockProof preserves this as a data-quality warning; it does not claim the action failed.' : 'No past-effective scheduled record was returned by the upcoming feed.', observations: [{ label: 'Upcoming records', value: String(futureActions.length) }, { label: 'Past-effective scheduled', value: String(staleScheduled.length), accent: corporateState }, ...(staleScheduled[0] ? [{ label: 'Example event', value: String(staleScheduled[0].eventId) }, { label: 'API status', value: String(staleScheduled[0].status) }, { label: 'Effective UTC', value: String(staleScheduled[0].effectiveTimeUtc) }] : [])] },
    ]
    const state = derivePassportState(checks)
    const latestAction = futureActions[0] || staleScheduled[0]
    const explorer = `https://explorer.solana.com/address/${mint}`
    const evidence = [
      { id: 'issuer', title: 'Official asset identity', summary: `${symbol} resolves to ${mint.slice(0, 8)}…${mint.slice(-6)} on Solana.`, state: identityState, timestamp: time(scannedAt), source: 'xStocks public API', endpoint: `/public/assets/${symbol}`, retrievedAt: scannedAt },
      { id: 'chain', title: 'Solana mint account', summary: `${account.value.data.program} at confirmed slot ${account.context.slot}.`, state: programState, timestamp: time(scannedAt), source: 'Solana mainnet RPC', endpoint: 'getAccountInfo', retrievedAt: scannedAt, href: explorer },
      { id: 'reserves', title: 'Proof of reserves', summary: `${reserves.sharesHeld} shares reported against ${reserves.circulatingSupply} circulating tokens.`, state: reserveCheckState, timestamp: Number.isFinite(Date.parse(reserves.timestamp)) ? time(reserves.timestamp) : '--:--', source: 'xStocks proof of reserves', endpoint: `/public/proof-of-reserves/${symbol}`, retrievedAt: scannedAt },
      { id: 'multiplier', title: 'Balance multiplier', summary: `Issuer ${issuerMultiplier?.toFixed(9) ?? 'unavailable'} · effective onchain ${effectiveMultiplier?.toFixed(9) ?? 'unavailable'}.`, state: multiplierCheckState, timestamp: time(scannedAt), source: 'xStocks API + Solana Token-2022', endpoint: `/public/assets/${symbol}/multiplier + getAccountInfo`, retrievedAt: scannedAt },
      { id: 'corporate', title: 'Corporate-action schedule', summary: staleScheduled.length ? `${staleScheduled.length} past-effective record(s) remain marked Scheduled in the upcoming feed.` : `${futureActions.length} future record(s) observed.`, state: corporateState, timestamp: time(latestAction?.effectiveTimeUtc || scannedAt), source: 'xStocks corporate actions', endpoint: `/public/corporate-actions/upcoming?symbol=${symbol}`, retrievedAt: scannedAt },
    ]
    const timeline = [
      { id: 't1', time: Number.isFinite(Date.parse(reserves.timestamp)) ? time(reserves.timestamp) : '--:--', title: 'Reserve proof', detail: coverage == null ? 'Coverage unavailable' : `${(coverage * 100).toFixed(2)}% reported coverage`, kind: 'underlying', offset: 12 },
      { id: 't2', time: time(scannedAt), title: 'Issuer snapshot', detail: asset.trading?.currentPeriod || 'Observed', kind: 'news', offset: 43 },
      { id: 't3', time: time(scannedAt), title: 'Solana confirmed', detail: `slot ${account.context.slot}`, kind: 'token', offset: 73 },
      { id: 't4', time: time(scannedAt), title: 'Passport issued', detail: state, kind: 'underlying', offset: 94 },
    ]
    const warning = staleScheduled.length ? ` The issuer's upcoming-actions feed also contains ${staleScheduled.length} past-effective record${staleScheduled.length === 1 ? '' : 's'} still marked Scheduled, so the passport is CAUTION rather than PASS.` : ''
    const reserveWarning = reserveCheckState === 'caution' && Number.isFinite(coverage) && coverage >= 1 ? ' The issuer reserve report exceeds the 72-hour freshness policy.' : ''
    const brief = `${symbol} resolves to ${identityState === 'pass' ? 'the expected' : 'an unexpected'} Solana Token-2022 mint at confirmed slot ${account.context.slot}. The effective onchain balance multiplier ${effectiveMultiplier?.toFixed(9) ?? 'could not be read'} ${multiplierCheckState === 'pass' ? 'matches' : 'does not cleanly match'} issuer metadata, and issuer-reported reserve coverage is ${coverage == null ? 'unavailable' : `${(coverage * 100).toFixed(3)}%`}. The mint pause flag is ${paused === false ? 'off' : paused === true ? 'on' : 'unavailable'}.${reserveWarning}${warning}`

    return res.status(200).json({
      schemaName: PASSPORT_SCHEMA_NAME,
      schemaVersion: PASSPORT_SCHEMA_VERSION,
      passportId: passportId(symbol, account.context.slot, scannedAt),
      instrument: { symbol, underlyingSymbol: asset.underlying?.symbol || asset.underlyingSymbol, company: asset.name || meta.company, tokenPrice: price.quote ?? null, mintAddress: mint, logo: asset.logo, network: 'Solana' },
      state,
      mode: 'live',
      scannedAt,
      sessionState: asset.trading?.currentPeriod || 'Observed',
      rpcSlot: account.context.slot,
      tokenProgram: account.value.data.program,
      decimals: mintInfo.decimals,
      displayedSupply,
      reserveCoverage: Number.isFinite(coverage) ? coverage : null,
      multiplier: effectiveMultiplier,
      paused,
      corporateAction: staleScheduled.length ? `${staleScheduled.length} schedule warning${staleScheduled.length === 1 ? '' : 's'}` : futureActions.length ? `${futureActions.length} upcoming` : 'No upcoming record',
      checks,
      evidence,
      timeline,
      brief,
      researchAction: state === 'PASS' ? 'The required identity, chain, multiplier, and reserve checks agree. Downstream apps can consume this passport with its evidence timestamps.' : state === 'BLOCKED' ? 'A required integrity check failed. Downstream apps must not treat this asset state as trusted input.' : 'Inspect the warning or missing layer before a downstream app treats this asset state as clean. Re-scan after the affected source updates.',
      reasoningNote: 'Deterministic evidence graph · no model-generated facts',
    })
  } catch (error) {
    return res.status(503).json({ error: 'Live passport unavailable', detail: error instanceof Error ? error.message : 'Unknown error' })
  } finally {
    clearTimeout(timer)
  }
}
