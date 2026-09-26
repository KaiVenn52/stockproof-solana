// Small, deterministic projection of the Token-2022 fields StockProof cares
// about. This powers change detection; it does not itself issue a passport.
export function trackedMintState(account) {
  const info = account?.data?.parsed?.info
  if (!info || !Array.isArray(info.extensions)) return null
  const scaled = info.extensions.find((item) => item.extension === 'scaledUiAmountConfig')?.state
  const pausable = info.extensions.find((item) => item.extension === 'pausableConfig')?.state
  if (!scaled || typeof pausable?.paused !== 'boolean') return null
  return {
    supply: String(info.supply),
    decimals: Number(info.decimals),
    multiplier: String(scaled.multiplier),
    newMultiplier: String(scaled.newMultiplier),
    newMultiplierEffectiveTimestamp: String(scaled.newMultiplierEffectiveTimestamp),
    paused: pausable.paused,
    freezeAuthority: info.freezeAuthority || null,
  }
}

export function changedFields(before, after) {
  if (!before || !after) return []
  return Object.keys(after).filter((key) => before[key] !== after[key])
}
