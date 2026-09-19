/* ============================================================
   Pricing engine — India-anchored, USD-canonical.

   The ACTUAL price of every listing is derived from the provider's
   real MONTHLY plan price in INDIA (MONTHLY_IN, in ₹). That India
   value is the single source of truth and is the same for everyone,
   everywhere — twelve does not re-price by the buyer's country.

   Internally every price is expressed in USD (the canonical currency)
   so the Wallet, ledger and settlement all use one unit. The country
   selector only converts that USD value to a local currency for
   DISPLAY (see lib/currency.js) — the underlying value never changes.

   Buyer price for a duration uses a convex rental curve:
       price(hours) = monthlyUSD × (hours / 720) ^ EXPONENT
   EXPONENT < 1 → short bookings carry a convenience premium; multi-day
   bookings taper toward, but stay below, the full monthly plan. A small
   floor keeps every booking commercially meaningful.

   Revenue split is TIERED by duration (provider reserve is always 20%,
   paid to the actual provider e.g. Netflix; the owner's share grows
   with longer bookings while twelve's platform fee shrinks):
       ≤12h : owner 30% · twelve 50% · provider 20%
        24h : owner 35% · twelve 45% · provider 20%
        3d  : owner 40% · twelve 40% · provider 20%
        ≥7d : owner 45% · twelve 35% · provider 20%
   ============================================================ */

import { DURATIONS } from '../data/listings'

// Real-ish MONTHLY plan price in INDIA (₹), premium tier. Source of truth.
const MONTHLY_IN = {
  // Entertainment
  netflix: 499, prime: 399, max: 499, disney: 299, hotstar: 299,
  tencent: 199, iqiyi: 199, paramount: 299, hulu: 499, peacock: 499,
  viu: 199, canal: 599, appletv: 99, youtubetv: 149, crunchyroll: 199,
  dazn: 499, shahid: 299, zee5: 149, sonyliv: 299, tubi: 99,
  // Education
  coursera: 3999, udemy: 700, masterclass: 1250, linkedin: 1400, skillshare: 999, learnbox: 799,
  // AI
  chatgpt: 1999, claude: 1999, gemini: 1950, perplexity: 1680, midjourney: 2499, twelveai: 999
}
const DEFAULT_MONTHLY_IN = 499

// FX used only to express the India-anchored value in the canonical USD unit.
const INR_PER_USD = 83

export const COUNTRY_NAMES = {
  US: 'United States', CA: 'Canada', GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France',
  NL: 'Netherlands', SE: 'Sweden', ES: 'Spain', IT: 'Italy', AU: 'Australia', NZ: 'New Zealand',
  SG: 'Singapore', AE: 'United Arab Emirates', SA: 'Saudi Arabia', JP: 'Japan', KR: 'South Korea',
  CN: 'China', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka', ID: 'Indonesia',
  PH: 'Philippines', VN: 'Vietnam', TH: 'Thailand', MY: 'Malaysia', BR: 'Brazil', MX: 'Mexico',
  AR: 'Argentina', CO: 'Colombia', ZA: 'South Africa', NG: 'Nigeria', EG: 'Egypt', KE: 'Kenya',
  TR: 'Turkey', RU: 'Russia'
}
export const COUNTRY_LIST = Object.keys(COUNTRY_NAMES).map((code) => ({ code, name: COUNTRY_NAMES[code] }))
export const countryName = (code) => COUNTRY_NAMES[code] || code

const round2 = (n) => Math.round(n * 100) / 100
const HOURS_PER_MONTH = 720 // 30 days — the anchor at which price ≈ the monthly plan
const DURATION_EXPONENT = 0.55 // <1 → short bookings cost proportionally more per hour
const MIN_BOOKING = 0.35 // minimum booking total in USD (~₹29) — applied to the shortest step
const MIN_STEP_RATIO = 1.2 // each duration costs ≥20% more than the previous, so every step is distinct

// India monthly plan price expressed in the canonical USD unit.
// (The `code` argument is accepted for backward-compatibility and ignored —
// the actual price is India's, regardless of the viewer's country.)
export function monthlyPrice(providerId, _code) {
  const inr = MONTHLY_IN[providerId] ?? DEFAULT_MONTHLY_IN
  return round2(inr / INR_PER_USD)
}

// Raw convex-curve value (canonical USD), before any floor/step adjustment.
function curvePrice(monthly, hours) {
  const h = Math.max(0, Number(hours) || 0)
  const ratio = Math.pow(Math.min(h, HOURS_PER_MONTH) / HOURS_PER_MONTH, DURATION_EXPONENT)
  return monthly * ratio
}

// Build the full duration ladder for a monthly plan (canonical USD). The shortest
// step is floored at MIN_BOOKING; every later step is at least MIN_STEP_RATIO× the
// one before it — so the prices are always DISTINCT and strictly increasing, even
// for cheap plans where the raw curve would collapse several steps onto the floor.
// Never exceeds the monthly plan price.
function buildLadder(monthly) {
  let prev = 0
  return DURATIONS.map((d, i) => {
    const raw = curvePrice(monthly, d.hours)
    let price = i === 0 ? Math.max(MIN_BOOKING, raw) : Math.max(raw, prev * MIN_STEP_RATIO)
    price = round2(Math.min(monthly, price))
    prev = price
    return { ...d, price }
  })
}

// Buyer price (canonical USD) for a single duration, taken from the ladder so it
// is identical no matter which listing (or cap) it is shown under.
export function priceForHours(providerId, _code, hours) {
  const monthly = monthlyPrice(providerId)
  const hit = buildLadder(monthly).find((d) => d.hours === Number(hours))
  return hit ? hit.price : round2(Math.max(MIN_BOOKING, Math.min(monthly, curvePrice(monthly, hours))))
}

// Effective per-hour rate (canonical USD, for display), referenced at 24 hours.
export function hourlyRate(providerId, _code) {
  const ladder = buildLadder(monthlyPrice(providerId))
  const d24 = ladder.find((d) => d.hours === 24) || ladder[ladder.length - 1]
  return round2(d24.price / 24)
}

// Duration-tiered revenue split (fractions). Provider reserve is always 20%.
// Kept in sync with the server copy in server/market.js.
export function splitForHours(hours) {
  const h = Number(hours) || 0
  if (h <= 12) return { owner: 0.30, platform: 0.50, provider: 0.20 }
  if (h <= 24) return { owner: 0.35, platform: 0.45, provider: 0.20 }
  if (h <= 72) return { owner: 0.40, platform: 0.40, provider: 0.20 }
  return { owner: 0.45, platform: 0.35, provider: 0.20 }
}

// Full pricing object for a listing (all amounts canonical USD).
export function listingPricing(listing, _code) {
  const monthly = monthlyPrice(listing.provider)
  const durations = buildLadder(monthly)
  const def = durations.find((d) => d.hours === listing.defaultHours) || durations.find((d) => d.hours === 24) || durations[0]
  return { monthly, hourly: hourlyRate(listing.provider), durations, price: def.price, defaultHours: def.hours }
}
