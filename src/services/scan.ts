import { snapshotFor } from '../data/snapshots'
import type { Passport } from '../types'

const TIMEOUT_MS = 12_000

export async function runScan(symbol: string, researchQuestion = `Verify ${symbol} on Solana`): Promise<Passport> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`/api/scan?symbol=${encodeURIComponent(symbol)}`, { signal: controller.signal })
    if (!response.ok) throw new Error(`Scan API returned ${response.status}`)
    return { ...(await response.json()) as Passport, researchQuestion }
  } catch {
    await new Promise((resolve) => window.setTimeout(resolve, 320))
    return { ...snapshotFor(symbol), researchQuestion }
  } finally {
    window.clearTimeout(timeout)
  }
}
