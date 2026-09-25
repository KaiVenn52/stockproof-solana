import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

// Fetches the published schema over HTTP and validates real passports against
// it — exactly what an integrator would do.
//
//   npm.cmd run verify:schema
//   STOCKPROOF_URL=http://127.0.0.1:4188 npm.cmd run verify:schema

const BASE = process.env.STOCKPROOF_URL || 'https://stockproof-solana.vercel.app'
const SYMBOLS = (process.env.STOCKPROOF_SYMBOLS || 'GLDx,TSLAx,AAPLx,NFLXx,COINx').split(',')

const schemaResponse = await fetch(`${BASE}/schemas/stockproof.passport.v1.schema.json`)
const schema = await schemaResponse.json()
console.log(`schema HTTP ${schemaResponse.status} · content-type ${schemaResponse.headers.get('content-type')}`)
console.log(`schema $id  ${schema.$id}`)

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

let failures = 0
for (const symbol of SYMBOLS) {
  const response = await fetch(`${BASE}/api/scan?symbol=${encodeURIComponent(symbol)}`)
  const passport = await response.json()
  const valid = validate(passport)
  if (!valid) failures++
  console.log(`${symbol.padEnd(7)} HTTP ${response.status} state=${String(passport.state).padEnd(9)} schemaValid=${valid}${valid ? '' : ` ${JSON.stringify(validate.errors)}`}`)
}

// Negative control: a tampered passport must not validate.
const tampered = { ...(await (await fetch(`${BASE}/api/scan?symbol=${encodeURIComponent(SYMBOLS[0])}`)).json()), state: 'TOTALLY_FINE' }
const rejected = validate(tampered) === false
console.log(`negative control (tampered state) rejected=${rejected} (expected true)`)
if (!rejected) failures++

console.log(failures ? `\nFAIL: ${failures} check(s) failed` : '\nAll live passports validate against the published schema.')
process.exitCode = failures ? 1 : 0
