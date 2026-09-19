/* ============================================================
   Display-currency layer.

   twelve has ONE canonical internal currency: USD. Every price,
   Wallet balance, earning and ledger amount is stored and settled
   in USD. The *actual* value of each price is derived from the
   provider's India monthly plan (see lib/pricing.js) — so the price
   a buyer pays is the India-anchored value, identical worldwide.

   The country selector only changes how that USD value is PRESENTED:
   it is converted to the selected country's local currency for
   display. Default (and the anchor) is USD ("dollars only").

   Rates are approximate, fixed reference rates (units per 1 USD) —
   fine for a prototype; a production build would fetch live FX.
   ============================================================ */

export const DEFAULT_CURRENCY = 'USD'

// code → { symbol, perUSD (local units per 1 USD), decimals }
export const CURRENCIES = {
  USD: { symbol: '$',   perUSD: 1,     decimals: 2 },
  INR: { symbol: '₹',   perUSD: 83,    decimals: 0 },
  GBP: { symbol: '£',   perUSD: 0.79,  decimals: 2 },
  EUR: { symbol: '€',   perUSD: 0.92,  decimals: 2 },
  CAD: { symbol: 'C$',  perUSD: 1.36,  decimals: 2 },
  AUD: { symbol: 'A$',  perUSD: 1.52,  decimals: 2 },
  NZD: { symbol: 'NZ$', perUSD: 1.64,  decimals: 2 },
  SGD: { symbol: 'S$',  perUSD: 1.35,  decimals: 2 },
  SEK: { symbol: 'kr',  perUSD: 10.6,  decimals: 2 },
  AED: { symbol: 'AED ',perUSD: 3.67,  decimals: 2 },
  SAR: { symbol: 'SAR ',perUSD: 3.75,  decimals: 2 },
  JPY: { symbol: '¥',   perUSD: 157,   decimals: 0 },
  KRW: { symbol: '₩',   perUSD: 1350,  decimals: 0 },
  CNY: { symbol: 'CN¥', perUSD: 7.2,   decimals: 2 },
  PKR: { symbol: '₨',   perUSD: 278,   decimals: 0 },
  BDT: { symbol: '৳',   perUSD: 118,   decimals: 0 },
  LKR: { symbol: 'Rs ', perUSD: 300,   decimals: 0 },
  IDR: { symbol: 'Rp ', perUSD: 16000, decimals: 0 },
  PHP: { symbol: '₱',   perUSD: 58,    decimals: 2 },
  VND: { symbol: '₫',   perUSD: 25000, decimals: 0 },
  THB: { symbol: '฿',   perUSD: 36,    decimals: 2 },
  MYR: { symbol: 'RM',  perUSD: 4.7,   decimals: 2 },
  BRL: { symbol: 'R$',  perUSD: 5.4,   decimals: 2 },
  MXN: { symbol: 'MX$', perUSD: 18,    decimals: 2 },
  ARS: { symbol: 'AR$', perUSD: 950,   decimals: 0 },
  COP: { symbol: 'CO$', perUSD: 4000,  decimals: 0 },
  ZAR: { symbol: 'R',   perUSD: 18.5,  decimals: 2 },
  NGN: { symbol: '₦',   perUSD: 1600,  decimals: 0 },
  EGP: { symbol: 'E£',  perUSD: 49,    decimals: 2 },
  KES: { symbol: 'KSh ',perUSD: 130,   decimals: 0 },
  TRY: { symbol: '₺',   perUSD: 34,    decimals: 2 },
  RUB: { symbol: '₽',   perUSD: 92,    decimals: 0 }
}

// Country → its display currency.
export const CURRENCY_BY_COUNTRY = {
  US: 'USD', CA: 'CAD', GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR', NL: 'EUR', ES: 'EUR', IT: 'EUR',
  SE: 'SEK', AU: 'AUD', NZ: 'NZD', SG: 'SGD', AE: 'AED', SA: 'SAR', JP: 'JPY', KR: 'KRW', CN: 'CNY',
  IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', ID: 'IDR', PH: 'PHP', VN: 'VND', TH: 'THB', MY: 'MYR',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CO: 'COP', ZA: 'ZAR', NG: 'NGN', EG: 'EGP', KE: 'KES', TR: 'TRY', RU: 'RUB'
}

export const currencyForCountry = (code) => CURRENCIES[CURRENCY_BY_COUNTRY[code]] ? CURRENCY_BY_COUNTRY[code] : DEFAULT_CURRENCY
export const currencyInfo = (currencyCode) => CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY]

// Convert a canonical USD amount into a currency and format it with the symbol.
export function formatMoney(usdAmount, currencyCode = DEFAULT_CURRENCY) {
  const c = currencyInfo(currencyCode)
  const value = (Number(usdAmount) || 0) * c.perUSD
  const dec = c.decimals ?? 2
  const num = value.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  return c.symbol + num
}
