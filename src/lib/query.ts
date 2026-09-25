import { QUERY_ALIASES } from '../../shared/assets.js'

// Aliases come from the shared registry, so free-text resolution can only ever
// return a symbol that is already pinned in the allowlist.
export function resolveInstrument(query: string): string | null {
  const tokens: string[] = query.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return Object.entries(QUERY_ALIASES).find(([, terms]) => terms.some((term) => tokens.includes(term)))?.[0] ?? null
}

// A query can legitimately name more than one asset. Surfacing that ambiguity is
// safer than silently picking whichever alias happens to be first.
export function resolveInstrumentMatches(query: string): string[] {
  const tokens: string[] = query.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return Object.entries(QUERY_ALIASES)
    .filter(([, terms]) => terms.some((term) => tokens.includes(term)))
    .map(([symbol]) => symbol)
}
