// Money is stored canonically in USD; the country selector converts the DISPLAY
// currency. `setDisplayCurrency` is called by AppContext when the country changes
// so the formatters below present amounts in the viewer's local currency.
import { formatMoney, currencyForCountry, DEFAULT_CURRENCY } from './currency'
import { splitForHours } from './pricing'

let activeCurrency = DEFAULT_CURRENCY
export function setDisplayCurrency(countryCode) {
  activeCurrency = currencyForCountry(countryCode)
}
export const displayCurrency = () => activeCurrency

// Format a canonical USD amount in the active display currency.
export const money = (n) => formatMoney(n, activeCurrency)
export const usd = money  // legacy aliases — both format in the active currency
export const inr = money

export const pad = (n) => String(n).padStart(2, '0')

const round2 = (n) => Math.round(n * 100) / 100

// Split a gross price (USD) into owner / twelve / provider shares. The split is
// TIERED by booking duration (hours); the provider reserve is always 20%.
export function splitFee(price, hours = 24) {
  const s = splitForHours(hours)
  const owner = round2(price * s.owner)
  const platformFee = round2(price * s.platform)
  const provider = round2(price - owner - platformFee)
  return { owner, platformFee, provider }
}

export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export function fmtDateTime(ts) {
  const d = new Date(ts)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 86400000)
  const same = (a, b) => a.toDateString() === b.toDateString()
  const t = fmtTime(ts)
  if (same(d, today)) return `${t} today`
  if (same(d, tomorrow)) return `${t} tomorrow`
  return `${t} · ${fmtDate(ts)}`
}

export function durationLabel(hours) {
  if (hours < 24) return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`
  const days = Math.round((hours / 24) * 10) / 10
  return `${days} ${days === 1 ? 'Day' : 'Days'}`
}
