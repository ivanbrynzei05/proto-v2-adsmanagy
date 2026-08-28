/**
 * GET /api/v1/statistics — the response, as it actually is.
 *
 * These types are a transcript of the contract, not a shape of the prototype's
 * own. That is the whole point of this file: the page draws what the response
 * says — its series, its points, its tiles, its columns — and the prototype only
 * decides what the thing looks like. A series the backend adds tomorrow appears
 * on the chart with no change here; a key nothing has a name for shows up under
 * its own key rather than being quietly dropped.
 *
 * Two things the backend deliberately does not send, and this file supplies:
 * the wording (every `label` is null unless it comes out of the data — a CRM
 * status, a product, a person) and the colours. Both are display, and display
 * is the client's.
 */
export type Format = "currency" | "percent" | "number" | "text"
export type Step = "hour" | "day" | "range"
export type Values = Record<string, number | null>

export type ApiSeriesItem = {
  key: string
  label: string | null
  format: Format
  total: number | null
}

export type ApiSeries = {
  key: string
  label: string | null
  type: "line" | "column" | "area"
  stack: string | null
  format: Format
  total: number | null
  visible: boolean
  items: ApiSeriesItem[]
}

export type ApiPoint = { x: string; values: Values }

export type ApiChart = {
  step: Step
  series: ApiSeries[]
  points: ApiPoint[]
}

export type ApiKpi = {
  key: string
  label: string | null
  format: Format
  value: number | null
}

export type ApiIcon = { kind: string; key: string }

export type ApiColumn = {
  key: string
  label: string | null
  format: Format
  source: "values" | "label"
  sortable: boolean
}

export type ApiRow = {
  id: string
  label: string | null
  icon: ApiIcon | null
  values: Values
  children: ApiRow[]
}

export type ApiPage = {
  number: number
  size: number
  total_rows: number
  total_pages: number
}

export type ApiTable = {
  columns: ApiColumn[]
  rows: ApiRow[]
  totals: { values: Values }
  page: ApiPage
  sort: string
  dir: "asc" | "desc"
}

export type ApiFilterOption = {
  id: string
  label: string
  children?: ApiFilterOption[] | null
}

export type ApiFilter = {
  key: string
  levels: string[]
  options: ApiFilterOption[]
}

export type ApiWarning = { key: string; params: Record<string, unknown> }

export type ApiMeta = {
  period: { date_from: string; date_to: string }
  min_date: string | null
  today: string
  breakdown: string
  available_breakdowns: string[]
  filters: ApiFilter[]
  warnings: ApiWarning[]
}

export type ApiStatistics = {
  meta: ApiMeta
  data: {
    chart: ApiChart | null
    kpis: ApiKpi[]
    table: ApiTable | null
  }
}

export type RealBreakdown = "income" | "orders" | "product"

/** Which filter categories the request carries, keyed as the response names them. */
export type FilterSelection = Record<string, string[]>

export type ReportQuery = {
  breakdown: RealBreakdown
  from: string
  to: string
  selection?: FilterSelection
  page?: number
  sort?: string
  dir?: "asc" | "desc"
  /** ask for the table alone when paging or re-sorting it */
  tableOnly?: boolean
}

export type ReportResult = { body: ApiStatistics; live: boolean }

export async function fetchStatistics(query: ReportQuery): Promise<ReportResult> {
  const params = new URLSearchParams({
    date_from: query.from,
    date_to: query.to,
    breakdown: query.breakdown,
  })
  for (const [key, values] of Object.entries(query.selection ?? {})) {
    if (values.length) params.set(key, values.join(","))
  }
  if (query.page && query.page > 1) params.set("page", String(query.page))
  if (query.sort) params.set("sort", query.sort)
  if (query.dir) params.set("dir", query.dir)
  if (query.tableOnly) params.set("blocks", "table")

  try {
    const res = await fetch(`/api/v1/statistics?${params}`, {
      credentials: "include",
    })
    if (!res.ok) throw new Error(String(res.status))
    return { body: (await res.json()) as ApiStatistics, live: true }
  } catch {
    // The preview backend is behind an ssh tunnel; without it the page falls
    // back to the response saved for 22–28.08 so it still shows real numbers.
    // The snapshot answers one period, one page and one sort — the page says so
    // rather than pretending the controls worked.
    const res = await fetch(
      `${import.meta.env.BASE_URL}real/${query.breakdown}.json`
    )
    return { body: (await res.json()) as ApiStatistics, live: false }
  }
}

// --- wording -----------------------------------------------------------------
//
// Every key the three breakdowns send today. A key that is missing renders as
// itself: a new column with no name yet is a thing to notice, not to hide.

const LABELS: Record<string, string> = {
  // money series and what they are made of
  revenue: "Виручка",
  costs: "Витрати",
  income: "Дохід",
  cogs: "Собівартість",
  ad_spend: "Реклама",
  call_center: "Колцентр",
  packaging: "Пакування",
  returns: "Вартість повернень",
  bought_out_orders: "Викуплені замовлення",
  avg_check: "Середній чек",
  team_income: "Дохід баєра",
  viewer_income: "Дохід овнера",
  // the funnel
  leads: "Ліди",
  confirmed: "Підтверджені",
  completed: "Завершені",
  rejected: "Повернення",
  approved: "Апруви",
  bought_out: "Викуплені",
  returned: "Повернення",
  // rates
  roi: "ROI",
  romi: "ROMI",
  margin: "Маржинальність",
  approve_rate: "% апруву",
  buyout_rate: "% викупу",
  cpl: "Ціна ліда",
  cpa: "Ціна апруву",
  cpbo: "Ціна викупу",
  // table columns
  platform: "Платформа",
  status: "Статус",
  product: "Товар",
  orders: "Замовлень",
  units: "Продано",
  category_pct: "% категорії",
  leads_pct: "% лідів",
  // ad networks — named by the row's id, since the response sends no wording
  facebook: "Facebook",
  google_ads: "Google",
  tiktok: "TikTok",
  // filter categories
  team: "Команда",
  ads: "Реклама",
  products: "Товари",
  call_centers: "Колцентри",
  crm: "CRM",
}

const BREAKDOWN_LABELS: Record<string, string> = {
  income: "Дохід",
  orders: "Замовлення",
  product: "Товари",
}

/** The wording for a key, or the key itself where nothing names it yet. */
export function labelOf(key: string, given?: string | null) {
  return given ?? LABELS[key] ?? key
}

export function breakdownLabel(key: string) {
  return BREAKDOWN_LABELS[key] ?? LABELS[key] ?? key
}

// --- colour ------------------------------------------------------------------

const COLORS: Record<string, string> = {
  revenue: "var(--viz-1)",
  costs: "var(--viz-2)",
  income: "var(--viz-3)",
  cogs: "var(--viz-4)",
  leads: "var(--viz-1)",
  confirmed: "var(--st-approved)",
  completed: "var(--st-completed)",
  rejected: "var(--st-rejected)",
}

const FALLBACK = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
]

/** A colour for a series, stable for the keys we know and cycled for the rest. */
export function colorOf(key: string, index: number) {
  return COLORS[key] ?? FALLBACK[index % FALLBACK.length]
}

// --- values ------------------------------------------------------------------

const NB = " "

/** Ukrainian grouping — spaces between thousands, comma before the kopiykas. */
function uk(value: number, digits = 2) {
  return value.toLocaleString("uk", { maximumFractionDigits: digits })
}

/**
 * A figure in the unit the response says it is in.
 *
 * Money is NOT converted here. The backend already reports in the account's
 * display currency, and running it through the prototype's converter a second
 * time would divide by the rate twice. The symbol is the one this account is
 * read in — the response carries no currency, and the real client takes it from
 * the user it already holds.
 */
export function formatValue(value: number | null | undefined, format: Format) {
  if (value === null || value === undefined) return "—"
  if (format === "currency") return uk(value) + NB + "₴"
  if (format === "percent") return uk(value) + "%"
  if (format === "text") return String(value)
  return uk(value)
}

/** Whether a figure is one a loss can be read off — money and rates. */
export function signed(format: Format) {
  return format === "currency" || format === "percent"
}

// --- warnings ----------------------------------------------------------------

const WARNINGS: Record<string, (params: Record<string, unknown>) => string> = {
  ads_hourly_missing: (p) =>
    `Погодинних даних немає у: ${list(p.providers)} — їхні витрати є в підсумку, але не в точках`,
  mixed_currencies_converted: (p) => `Сконвертовано з ${list(p.currencies)}`,
  fx_rate_missing: (p) => `Немає курсу для ${list(p.currencies)} — суми не конвертовані`,
  fx_rate_stale: (p) => `Курс станом на ${String(p.date ?? "")}`,
}

export function warningText(warning: ApiWarning) {
  const render = WARNINGS[warning.key]
  return render ? render(warning.params) : warning.key
}

function list(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : String(value ?? "")
}
