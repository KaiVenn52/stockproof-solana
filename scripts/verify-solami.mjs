if (!process.env.SOLAMI_API_KEY?.trim()) {
  console.error('SOLAMI_API_KEY is required. Add it to the Git-ignored .env.local file.')
  process.exit(1)
}
await import('./validate-live.mjs')
