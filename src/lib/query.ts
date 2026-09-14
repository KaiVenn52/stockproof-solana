const aliases: Record<string, string[]> = {
  NVDAx: ['nvdax', 'nvda', 'nvidia'],
  AAPLx: ['aaplx', 'aapl', 'apple'],
  TSLAx: ['tslax', 'tsla', 'tesla'],
  QQQx: ['qqqx', 'qqq', 'nasdaq', 'invesco'],
}

export function resolveInstrument(query: string): string | null {
  const tokens: string[] = query.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return Object.entries(aliases).find(([, terms]) => terms.some((term) => tokens.includes(term)))?.[0] ?? null
}
