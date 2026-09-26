import { ASSETS } from '../shared/assets.js'
import { changedFields, trackedMintState } from '../shared/solami-monitor.js'
import handler from '../api/scan.js'

const key = process.env.SOLAMI_API_KEY?.trim()
if (!key) {
  console.error('SOLAMI_API_KEY is required. Add it to the Git-ignored .env.local file.')
  process.exit(1)
}

const durationArg = process.argv.find((arg) => arg.startsWith('--duration='))
const durationSeconds = durationArg ? Number(durationArg.split('=')[1]) : 30
if (!Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 3600) {
  console.error('Use --duration=SECONDS with an integer from 0 (continuous) to 3600.')
  process.exit(1)
}

const emit = (type, details) => console.log(JSON.stringify({ type, at: new Date().toISOString(), ...details }))
const rpcUrl = `https://rpc.solami.dev/sol?api_key=${encodeURIComponent(key)}`
const wsUrl = `wss://ws.solami.dev/ws/sol?api_key=${encodeURIComponent(key)}`
const stateByMint = new Map()
const subscriptionRequests = new Map()
const subscriptionToMint = new Map()
let latestSlot = 0
let updates = 0
let changes = 0
let rescans = 0
let socket
let stopping = false
const pendingRescans = new Set()

async function rpc(method, params) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    })
    const data = await response.json()
    if (!response.ok || data.error) throw new Error(`${method} failed (${response.status}; RPC ${data.error?.code ?? 'unknown'})`)
    return data.result
  } finally {
    clearTimeout(timer)
  }
}

function stop(reason) {
  if (stopping) return
  stopping = true
  emit('summary', { reason, trackedMints: ASSETS.length, subscriptions: subscriptionToMint.size, latestSlot, updates, changes, rescans })
  socket?.close()
}

async function rescanChangedMint(asset, changedAtSlot) {
  if (pendingRescans.has(asset.mint)) return
  pendingRescans.add(asset.mint)
  try {
    const passport = await new Promise((resolve, reject) => {
      const response = {
        statusCode: 200,
        setHeader() {},
        status(code) { this.statusCode = code; return this },
        json(payload) { this.statusCode >= 400 ? reject(new Error('Passport scan unavailable')) : resolve(payload) },
      }
      handler({ method: 'GET', query: { symbol: asset.symbol } }, response).catch(reject)
    })
    rescans += 1
    emit('passport_refreshed', { symbol: asset.symbol, changedAtSlot, passportSlot: passport.rpcSlot, passportId: passport.passportId, state: passport.state, source: passport.evidence.find((item) => item.id === 'chain')?.source })
  } catch {
    emit('passport_refresh_failed', { symbol: asset.symbol, changedAtSlot })
  } finally {
    pendingRescans.delete(asset.mint)
  }
}

try {
  // A confirmed Solami snapshot makes the watcher useful immediately, even if
  // a particular mint does not change during a short live demo.
  const snapshot = await rpc('getMultipleAccounts', [ASSETS.map(({ mint }) => mint), { encoding: 'jsonParsed', commitment: 'confirmed' }])
  latestSlot = snapshot?.context?.slot || 0
  if (!latestSlot || snapshot?.value?.length !== ASSETS.length) throw new Error('Incomplete Solami snapshot')
  for (const [index, asset] of ASSETS.entries()) {
    const state = trackedMintState(snapshot.value[index])
    if (!state) throw new Error(`Unparseable ${asset.symbol} mint state`)
    stateByMint.set(asset.mint, state)
    emit('snapshot', { symbol: asset.symbol, mint: asset.mint, slot: latestSlot, multiplier: state.multiplier, nextMultiplier: state.newMultiplier, paused: state.paused })
  }

  socket = new WebSocket(wsUrl)
  socket.addEventListener('open', () => {
    emit('connected', { provider: 'Solami WebSocket', trackedMints: ASSETS.length, snapshotSlot: latestSlot })
    socket.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'slotSubscribe' }))
    for (const [index, asset] of ASSETS.entries()) {
      const id = index + 2
      subscriptionRequests.set(id, asset.mint)
      socket.send(JSON.stringify({ jsonrpc: '2.0', id, method: 'accountSubscribe', params: [asset.mint, { encoding: 'jsonParsed', commitment: 'confirmed' }] }))
    }
  })
  socket.addEventListener('message', (event) => {
    let data
    try { data = JSON.parse(String(event.data)) } catch { return }
    if (data.error) {
      emit('subscription_error', { code: data.error.code, requestId: data.id })
      process.exitCode = 1
      stop('subscription_error')
      return
    }
    if (Number.isInteger(data.id) && Number.isInteger(data.result)) {
      const mint = subscriptionRequests.get(data.id)
      if (mint) subscriptionToMint.set(data.result, mint)
      return
    }
    if (data.method === 'slotNotification') {
      latestSlot = Math.max(latestSlot, Number(data.params?.result?.slot) || 0)
      return
    }
    if (data.method !== 'accountNotification') return
    const mint = subscriptionToMint.get(data.params?.subscription)
    const asset = ASSETS.find((item) => item.mint === mint)
    if (!mint || !asset) return
    const next = trackedMintState(data.params?.result?.value)
    const slot = Number(data.params?.result?.context?.slot) || latestSlot
    updates += 1
    if (!next) {
      emit('unparseable_update', { symbol: asset.symbol, mint, slot })
      return
    }
    const fields = changedFields(stateByMint.get(mint), next)
    stateByMint.set(mint, next)
    if (fields.length) {
      changes += 1
      emit('mint_changed', { symbol: asset.symbol, mint, slot, fields, multiplier: next.multiplier, nextMultiplier: next.newMultiplier, paused: next.paused })
      void rescanChangedMint(asset, slot)
    }
  })
  socket.addEventListener('error', () => {
    if (stopping) return
    emit('stream_error', { provider: 'Solami WebSocket' })
    process.exitCode = 1
    stop('stream_error')
  })
  socket.addEventListener('close', (event) => {
    if (!stopping) {
      emit('stream_closed', { code: event.code })
      process.exitCode = 1
      stop('stream_closed')
    }
  })
  const heartbeat = setInterval(() => emit('health', { latestSlot, subscriptions: subscriptionToMint.size, updates, changes, rescans }), 5_000)
  heartbeat.unref()
  if (durationSeconds) setTimeout(() => stop('duration_elapsed'), durationSeconds * 1000)
  process.once('SIGINT', () => stop('interrupted'))
} catch (error) {
  // Never print the credential-bearing endpoint or a transport exception URL.
  emit('fatal', { reason: error instanceof Error ? error.message : 'Unknown monitor failure' })
  process.exitCode = 1
}
