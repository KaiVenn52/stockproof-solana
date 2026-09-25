export interface RegisteredAsset {
  symbol: string
  underlyingSymbol: string
  company: string
  mint: string
}

export const TOKEN_2022_PROGRAM: string
export const ASSETS: RegisteredAsset[]
export const assetBySymbol: Map<string, RegisteredAsset>
export const supportedSymbols: string[]
export const QUERY_ALIASES: Record<string, string[]>
