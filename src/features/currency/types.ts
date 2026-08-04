// Display currency for every money figure in the analytics.
// All data is stored in UAH; a different currency is a conversion applied at
// display time, using either the NBU quote or a rate the user types in.

export const BASE_CURRENCY_CODE = "UAH"

// What a table needs to print an amount: the code, the sign welded to the
// number, and how many ₴ one unit is worth.
export type DisplayCurrency = {
  code: string
  symbol: string
  /** ₴ per one unit of the currency */
  rate: number
}

export const BASE_CURRENCY: DisplayCurrency = {
  code: BASE_CURRENCY_CODE,
  symbol: "₴",
  rate: 1,
}

// Demo NBU quotes (₴ per 1 unit) - in production these come from the NBU API.
// The USD one matches the rate the metric formulas already use.
export const NBU_RATES: Record<string, number> = {
  USD: 41.5,
  EUR: 45.2,
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  UAH: "₴",
  USD: "$",
  EUR: "€",
}

// The currencies offered in the select, base first.
export const CURRENCY_OPTIONS = [BASE_CURRENCY_CODE, "USD", "EUR"]

export type CurrencySettings = {
  code: string
  /** Follow the NBU quote instead of the rate below */
  useNbuRate: boolean
  /** Manual rate, ₴ per one unit - free text, like the expense fields */
  rate: string
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  code: BASE_CURRENCY_CODE,
  useNbuRate: true,
  rate: "",
}

// Guards against a code left in storage that the select no longer offers.
export function currencyCode(settings: CurrencySettings) {
  return CURRENCY_OPTIONS.includes(settings.code)
    ? settings.code
    : BASE_CURRENCY_CODE
}

// null for the base currency - there's nothing to quote it against.
export function nbuRate(code: string): number | null {
  return NBU_RATES[code] ?? null
}

// "41,5" and "41.5" are the same number to someone typing on a Ukrainian layout.
export function parseRate(value: string): number | null {
  const n = Number(value.replace(",", ".").replace(/\s/g, ""))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function formatRate(rate: number) {
  return rate.toLocaleString("uk", { maximumFractionDigits: 4 })
}

// Settings → what the tables format with. A manual rate that's still empty
// falls back to the NBU quote, so the numbers never go through a rate of 1.
export function displayCurrency(settings: CurrencySettings): DisplayCurrency {
  const code = currencyCode(settings)
  if (code === BASE_CURRENCY_CODE) return BASE_CURRENCY

  const quoted = nbuRate(code)
  const manual = parseRate(settings.rate)
  const rate =
    (settings.useNbuRate ? (quoted ?? manual) : (manual ?? quoted)) ?? 1

  return { code, symbol: CURRENCY_SYMBOLS[code] ?? code, rate }
}
