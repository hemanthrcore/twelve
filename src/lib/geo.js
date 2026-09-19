/* Detect the visitor's country by IP (client-side, best-effort).
   Falls back to United States if detection fails or is blocked. */

import { countryName } from './pricing'

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

export async function detectCountry() {
  // Primary provider
  try {
    const res = await withTimeout(fetch('https://ipapi.co/json/'), 2800)
    if (res.ok) {
      const j = await res.json()
      if (j && j.country_code) {
        return { code: j.country_code, name: j.country_name || countryName(j.country_code) }
      }
    }
  } catch {}

  // Fallback provider
  try {
    const res = await withTimeout(fetch('https://get.geojs.io/v1/ip/country.json'), 2800)
    if (res.ok) {
      const j = await res.json()
      if (j && j.country) {
        return { code: j.country, name: j.name || countryName(j.country) }
      }
    }
  } catch {}

  return { code: 'US', name: 'United States' }
}
