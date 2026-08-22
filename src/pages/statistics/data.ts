// The statistics page is a small report builder. Everything the left panel
// collects lands in ReportParams, and buildReport() re-aggregates the campaign
// dataset from scratch against it - nothing here is precomputed, so a filter, a
// threshold or a different period really does change the numbers on the chart.
//
// The dataset itself is the campaigns one (the prototype has a single source of
// truth for campaign metrics); this module only slices, spreads over days and
// re-aggregates it.

import {
  AD_ACCOUNTS,
  CAMPAIGNS,
  COLUMNS,
  parseProductId,
  PLATFORMS,
  PORTFOLIOS,
  PRODUCTS,
  type Column,
  type MetricKey,
  type PlatformId,
  type Row,
} from "@/pages/campaigns/data"
import {
  addDays,
  fmtDay,
  startOfDay,
  type DateRange,
} from "@/pages/campaigns/date-utils"

// ---- what a report can be cut by ----

export type Dimension =
  | "date"
  | "platform"
  | "adAccount"
  | "portfolio"
  | "product"
  | "campaign"

export const DIMENSIONS: { id: Dimension; label: string; hint: string }[] = [
  { id: "date", label: "Дата", hint: "динаміка по днях періоду" },
  { id: "platform", label: "Платформа", hint: "Facebook · Google · TikTok" },
  { id: "adAccount", label: "Рекламний кабінет", hint: "по кабінетах" },
  { id: "portfolio", label: "Бізнес-акаунт", hint: "по портфелях" },
  { id: "product", label: "Товар", hint: "по ID товару в назві" },
  { id: "campaign", label: "Кампанія", hint: "кожна кампанія окремо" },
]

export function isTimeDimension(dim: Dimension) {
  return dim === "date"
}

export type ChartKind = "line" | "area" | "bar" | "hbar" | "donut"

// Which chart types make sense for which cut: a time cut is a trend (line /
// area / columns), a category cut is a comparison (columns / ranking / share).
export const CHART_KINDS: {
  id: ChartKind
  label: string
  dims: "time" | "category" | "both"
}[] = [
  { id: "line", label: "Лінія", dims: "time" },
  { id: "area", label: "Площа", dims: "time" },
  { id: "bar", label: "Стовпці", dims: "both" },
  { id: "hbar", label: "Рейтинг", dims: "category" },
  { id: "donut", label: "Частки", dims: "category" },
]

export function chartAllowed(kind: ChartKind, dim: Dimension) {
  const spec = CHART_KINDS.find((c) => c.id === kind)
  if (!spec) return false
  if (spec.dims === "both") return true
  return spec.dims === (isTimeDimension(dim) ? "time" : "category")
}

// ---- metrics ----

// Metrics that add up across rows and days. Everything else is a rate and has
// to be re-derived after aggregation, never summed.
export const ADDITIVE_KEYS: MetricKey[] = [
  "leads",
  "approves",
  "spend",
  "returns",
  "ccCost",
  "packaging",
  "probableIncome",
  "buyerIncome",
  "ownerIncome",
]
const RATE_KEYS: MetricKey[] = COLUMNS.map((c) => c.key).filter(
  (k) => !ADDITIVE_KEYS.includes(k)
)

export function isAdditive(key: MetricKey) {
  return ADDITIVE_KEYS.includes(key)
}

const COLUMN_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c]))

export function metricColumn(key: MetricKey): Column {
  return COLUMN_BY_KEY.get(key) ?? COLUMNS[0]
}

// A chart can carry four series before the palette runs out of slots that stay
// apart under colour-blind simulation, so the picker stops there.
export const MAX_METRICS = 4

// The selection is a fixed-length list of slots rather than a plain array: the
// slot index is what picks the series colour, so removing a metric must not
// repaint the ones that stay. Hole in the middle = that colour is free again.
export type MetricSlots = (MetricKey | null)[]

export type SelectedMetric = { key: MetricKey; slot: number; column: Column }

export function selectedMetrics(slots: MetricSlots): SelectedMetric[] {
  return slots.flatMap((key, slot) =>
    key ? [{ key, slot, column: metricColumn(key) }] : []
  )
}

export function metricCount(slots: MetricSlots) {
  return slots.filter(Boolean).length
}

export function hasMetric(slots: MetricSlots, key: MetricKey) {
  return slots.includes(key)
}

// Adding takes the lowest free slot; removing leaves a hole behind.
export function toggleMetricSlot(
  slots: MetricSlots,
  key: MetricKey
): MetricSlots {
  const next = [...slots]
  const at = next.indexOf(key)
  if (at !== -1) {
    next[at] = null
    return next
  }
  const free = next.indexOf(null)
  if (free === -1) return slots // already at MAX_METRICS
  next[free] = key
  return next
}

// series colours - see the --viz-* block in index.css for how they were picked
export const SERIES_COLORS = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
]

export function seriesColor(slot: number) {
  return SERIES_COLORS[slot % SERIES_COLORS.length]
}

// ---- parameters ----

export type CampaignStatus = "all" | "active" | "paused"

export const STATUSES: { id: CampaignStatus; label: string }[] = [
  { id: "all", label: "Усі кампанії" },
  { id: "active", label: "Тільки активні" },
  { id: "paused", label: "Тільки зупинені" },
]

export type ReportParams = {
  range: DateRange
  /** only used by the "Дата" cut */
  step: "day" | "week"
  dim: Dimension
  metrics: MetricSlots
  chart: ChartKind
  platforms: PlatformId[]
  adAccounts: string[]
  portfolios: string[]
  /** product ids; "none" stands for campaigns with no id in the name */
  products: string[]
  status: CampaignStatus
  query: string
  // thresholds are typed by hand, so they stay strings until the report is built
  minSpend: string
  minLeads: string
  minRoi: string
  /** how many categories to keep; the rest fold into "Інше" */
  topN: string
  sortBy: MetricKey
  sortDir: "desc" | "asc"
  compare: boolean
  labels: boolean
}

export const NO_PRODUCT = "none"

export const ALL_PLATFORMS = PLATFORMS.map((p) => p.id)
export const ALL_AD_ACCOUNTS = AD_ACCOUNTS.map((a) => a.id)
export const ALL_PORTFOLIOS = PORTFOLIOS.map((p) => p.id)

export const PLATFORM_OPTIONS = PLATFORMS.map((p) => ({
  id: p.id,
  label: p.label,
}))
export const AD_ACCOUNT_OPTIONS = AD_ACCOUNTS.map((a) => ({
  id: a.id,
  label: a.name,
}))
export const PORTFOLIO_OPTIONS = PORTFOLIOS.map((p) => ({
  id: p.id,
  label: p.name,
}))

// Only the products that actually carry campaigns are offered - the rest of the
// catalogue would filter everything down to an empty report.
export const PRODUCT_OPTIONS: { id: string; label: string }[] = (() => {
  const ids = new Set<string>()
  let orphans = false
  for (const c of CAMPAIGNS) {
    const { id } = parseProductId(c.name)
    if (id) ids.add(id)
    else orphans = true
  }
  const list = [...ids]
    .sort()
    .map((id) => ({ id, label: `${id} · ${PRODUCTS[id] ?? "Без назви"}` }))
  return orphans
    ? [...list, { id: NO_PRODUCT, label: "Без ID товару в назві" }]
    : list
})()

export const ALL_PRODUCTS = PRODUCT_OPTIONS.map((p) => p.id)

export function defaultParams(): ReportParams {
  const today = startOfDay(new Date())
  return {
    range: { from: addDays(today, -13), to: today },
    step: "day",
    dim: "date",
    metrics: ["leads", "approves", null, null],
    chart: "line",
    platforms: [...ALL_PLATFORMS],
    adAccounts: [...ALL_AD_ACCOUNTS],
    portfolios: [...ALL_PORTFOLIOS],
    products: [...ALL_PRODUCTS],
    status: "all",
    query: "",
    minSpend: "",
    minLeads: "",
    minRoi: "",
    topN: "8",
    sortBy: "spend",
    sortDir: "desc",
    compare: true,
    labels: true,
  }
}

// ---- report ----

export type ReportPoint = Record<MetricKey, number> & {
  key: string
  label: string
  /** second line under the label (platform of an ad account, product id, …) */
  sub?: string
}

export type SparkPoint = Record<MetricKey, number> & { label: string }

export type Report = {
  params: ReportParams
  metrics: SelectedMetric[]
  points: ReportPoint[]
  totals: Record<MetricKey, number>
  /** same slice over the period right before this one, when "порівняти" is on */
  prev: Record<MetricKey, number> | null
  /** daily series of the whole slice, for the sparkline on each tile */
  spark: SparkPoint[]
  /** campaigns that passed every filter */
  campaigns: number
  /** categories folded into "Інше" by the Топ-N cap */
  folded: number
  days: number
}

const DAY_MS = 86_400_000

function round(n: number, d = 0) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

// deterministic 0..1, so the mock series never jumps between renders
function noise(a: number, b: number) {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// A campaign row carries a ~30-day total, so a single day is 1/30 of it, shaped
// by a stable per-campaign wobble and a weekend dip. Same day + same campaign
// always yields the same share, which is what keeps two reports over
// overlapping periods consistent with each other.
function dayShare(campaign: number, date: Date) {
  const dayNo = Math.round(date.getTime() / DAY_MS)
  const weekday = (date.getDay() + 6) % 7
  const weekend = weekday >= 5 ? 0.78 : 1.09
  return ((0.72 + noise(dayNo, campaign + 1) * 0.56) * weekend) / 30
}

function eachDay(range: DateRange): Date[] {
  const from = startOfDay(range.from)
  const to = startOfDay(range.to)
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS)
  return Array.from({ length: Math.max(1, days + 1) }, (_, i) =>
    addDays(from, i)
  )
}

function mondayOf(d: Date) {
  return addDays(d, -((d.getDay() + 6) % 7))
}

// ---- aggregation ----

type Acc = {
  add: Record<string, number>
  rate: Record<string, number>
  /** leads in the slice - the weight rate metrics are averaged by */
  weight: number
}

function newAcc(): Acc {
  const add: Record<string, number> = {}
  const rate: Record<string, number> = {}
  for (const k of ADDITIVE_KEYS) add[k] = 0
  for (const k of RATE_KEYS) rate[k] = 0
  return { add, rate, weight: 0 }
}

function accumulate(acc: Acc, row: Row, share: number) {
  for (const k of ADDITIVE_KEYS) acc.add[k] += row[k] * share
  const w = row.leads * share
  for (const k of RATE_KEYS) acc.rate[k] += row[k] * w
  acc.weight += w
}

function mergeAcc(target: Acc, source: Acc) {
  for (const k of ADDITIVE_KEYS) target.add[k] += source.add[k]
  for (const k of RATE_KEYS) target.rate[k] += source.rate[k]
  target.weight += source.weight
}

function finish(acc: Acc): Record<MetricKey, number> {
  const out = {} as Record<MetricKey, number>
  const w = acc.weight || 1
  for (const k of ADDITIVE_KEYS) out[k] = round(acc.add[k])
  for (const k of RATE_KEYS) out[k] = round(acc.rate[k] / w, 2)
  // the three ratios that can be derived exactly are derived, so the report
  // never shows a weighted average where the real quotient exists
  const { leads, approves, spend } = out
  out.costPerLead = round(leads ? spend / leads : 0, 1)
  out.approveRate = round(leads ? (approves / leads) * 100 : 0, 1)
  out.costPerApprove = round(approves ? spend / approves : 0, 1)
  return out
}

// ---- filtering ----

type Candidate = { row: Row; index: number; share: number }

function productKeyOf(row: Row) {
  return parseProductId(row.name).id ?? NO_PRODUCT
}

function num(value: string): number | null {
  const parsed = Number(value.replace(",", ".").trim())
  return value.trim() === "" || Number.isNaN(parsed) ? null : parsed
}

function passesFilters(p: ReportParams, row: Row) {
  if (!p.platforms.includes(row.platform)) return false
  if (!p.adAccounts.includes(row.adAccount)) return false
  if (!p.portfolios.includes(row.portfolio)) return false
  if (!p.products.includes(productKeyOf(row))) return false
  if (p.status === "active" && !row.active) return false
  if (p.status === "paused" && row.active) return false
  const q = p.query.trim().toLowerCase()
  if (q && !row.name.toLowerCase().includes(q)) return false
  return true
}

// Thresholds are read against the campaign's numbers *for the chosen period*,
// which is what "мінімум витрат" means to someone looking at this period.
function passesThresholds(p: ReportParams, c: Candidate) {
  const minSpend = num(p.minSpend)
  const minLeads = num(p.minLeads)
  const minRoi = num(p.minRoi)
  if (minSpend !== null && c.row.spend * c.share < minSpend) return false
  if (minLeads !== null && c.row.leads * c.share < minLeads) return false
  if (minRoi !== null && c.row.roi < minRoi) return false
  return true
}

// ---- grouping ----

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]))
const ACCOUNT_BY_ID = new Map(AD_ACCOUNTS.map((a) => [a.id, a]))
const PORTFOLIO_BY_ID = new Map(PORTFOLIOS.map((p) => [p.id, p]))

function groupOf(
  dim: Dimension,
  row: Row
): { key: string; label: string; sub?: string } {
  switch (dim) {
    case "platform": {
      const p = PLATFORM_BY_ID.get(row.platform)
      return { key: row.platform, label: p?.label ?? row.platform }
    }
    case "adAccount": {
      const a = ACCOUNT_BY_ID.get(row.adAccount)
      return {
        key: row.adAccount,
        label: a?.name ?? row.adAccount,
        sub: PLATFORM_BY_ID.get(row.platform)?.label,
      }
    }
    case "portfolio": {
      const p = PORTFOLIO_BY_ID.get(row.portfolio)
      return { key: row.portfolio, label: p?.name ?? row.portfolio }
    }
    case "product": {
      const id = productKeyOf(row)
      if (id === NO_PRODUCT)
        return { key: NO_PRODUCT, label: "Без ID товару", sub: "не згруповано" }
      return { key: id, label: PRODUCTS[id] ?? `Товар ${id}`, sub: `ID ${id}` }
    }
    default: {
      const { id, rest } = parseProductId(row.name)
      return {
        key: row.name,
        label: id ? rest : row.name,
        sub: PLATFORM_BY_ID.get(row.platform)?.label,
      }
    }
  }
}

function weekLabel(start: Date) {
  const end = addDays(start, 6)
  return `${start.getDate()}–${fmtDay(end)}`
}

// ---- the builder ----

export function buildReport(p: ReportParams): Report {
  const metrics = selectedMetrics(p.metrics)
  const days = eachDay(p.range)

  const candidates: Candidate[] = CAMPAIGNS.map((row, index) => ({
    row,
    index,
    share: 0,
  }))
    .filter((c) => passesFilters(p, c.row))
    .map((c) => ({
      ...c,
      share: days.reduce((sum, d) => sum + dayShare(c.index, d), 0),
    }))
    .filter((c) => passesThresholds(p, c))

  // whole-slice totals + the daily series behind every tile's sparkline
  const totalAcc = newAcc()
  const spark: SparkPoint[] = days.map((d) => {
    const acc = newAcc()
    for (const c of candidates) accumulate(acc, c.row, dayShare(c.index, d))
    mergeAcc(totalAcc, acc)
    return { label: fmtDay(d), ...finish(acc) }
  })

  let points: ReportPoint[]
  let folded = 0

  if (isTimeDimension(p.dim)) {
    // one bucket per day, or per week when the period is long enough to ask for it
    const buckets = new Map<string, { label: string; acc: Acc }>()
    for (const d of days) {
      const bucketDay = p.step === "week" ? mondayOf(d) : d
      const key = String(bucketDay.getTime())
      let bucket = buckets.get(key)
      if (!bucket) {
        bucket = {
          label: p.step === "week" ? weekLabel(bucketDay) : fmtDay(d),
          acc: newAcc(),
        }
        buckets.set(key, bucket)
      }
      for (const c of candidates)
        accumulate(bucket.acc, c.row, dayShare(c.index, d))
    }
    points = [...buckets.entries()].map(([key, b]) => ({
      key,
      label: b.label,
      ...finish(b.acc),
    }))
  } else {
    const buckets = new Map<string, { label: string; sub?: string; acc: Acc }>()
    for (const c of candidates) {
      const g = groupOf(p.dim, c.row)
      let bucket = buckets.get(g.key)
      if (!bucket) {
        bucket = { label: g.label, sub: g.sub, acc: newAcc() }
        buckets.set(g.key, bucket)
      }
      accumulate(bucket.acc, c.row, c.share)
    }

    const entries = [...buckets.entries()].map(([key, b]) => ({
      key,
      label: b.label,
      sub: b.sub,
      acc: b.acc,
      values: finish(b.acc),
    }))
    const dir = p.sortDir === "asc" ? 1 : -1
    entries.sort((a, b) => (a.values[p.sortBy] - b.values[p.sortBy]) * dir)

    const cap = num(p.topN)
    const keep = cap !== null && cap > 0 ? Math.floor(cap) : entries.length
    const head = entries.slice(0, keep)
    const tail = entries.slice(keep)
    folded = tail.length

    points = head.map((e) => ({
      key: e.key,
      label: e.label,
      sub: e.sub,
      ...e.values,
    }))
    if (tail.length > 0) {
      // the tail is folded rather than dropped, so the totals still add up
      const rest = newAcc()
      for (const e of tail) mergeAcc(rest, e.acc)
      points.push({
        key: "__rest__",
        label: "Інше",
        sub: `${tail.length} поз.`,
        ...finish(rest),
      })
    }
  }

  // the same slice over the period immediately before this one
  let prev: Record<MetricKey, number> | null = null
  if (p.compare) {
    const span = days.length
    const prevDays = eachDay({
      from: addDays(p.range.from, -span),
      to: addDays(p.range.from, -1),
    })
    const acc = newAcc()
    for (const c of candidates)
      for (const d of prevDays) accumulate(acc, c.row, dayShare(c.index, d))
    prev = finish(acc)
  }

  return {
    params: p,
    metrics,
    points,
    totals: finish(totalAcc),
    prev,
    spark,
    campaigns: candidates.length,
    folded,
    days: days.length,
  }
}

// ---- formatting ----

// Compact axis / label numbers: the axis is read at a glance, so 116 200 ₴
// becomes "116 К" and the exact figure lives in the tooltip and the table.
export function fmtCompact(value: number, unit: Column["unit"], rate = 1) {
  const v = unit === "₴" ? value / rate : value
  const abs = Math.abs(v)
  const sign = v < 0 ? "−" : ""
  // uk-UA writes the decimal with a comma, like every other number on the page
  const dec = (n: number, digits: number) =>
    String(round(n, digits)).replace(".", ",")
  let body: string
  if (abs >= 1_000_000) body = `${dec(abs / 1_000_000, 1)} млн`
  else if (abs >= 10_000) body = `${dec(abs / 1000, 0)} К`
  else if (abs >= 1000) body = `${dec(abs / 1000, 1)} К`
  else body = dec(abs, abs < 10 ? 1 : 0)
  return sign + body + (unit === "%" ? "%" : "")
}

// percent change vs the previous period; null when there is nothing to compare
export function delta(now: number, before: number | undefined): number | null {
  if (before === undefined || before === 0) return null
  return round(((now - before) / Math.abs(before)) * 100, 1)
}

// For most metrics up is good; for the cost ones it is the other way round.
const LOWER_IS_BETTER: MetricKey[] = [
  "costPerLead",
  "costPerApprove",
  "cpm",
  "cpc",
  "spend",
  "returns",
  "ccCost",
  "packaging",
]

export function deltaIsGood(key: MetricKey, value: number) {
  const up = value >= 0
  return LOWER_IS_BETTER.includes(key) ? !up : up
}

// Some combinations cannot be drawn - a share chart needs a metric that adds
// up, a trend needs a time cut. Rather than refuse, the report falls back to
// the nearest chart that works, and the panel shows what it landed on.
export function normalizeParams(p: ReportParams): ReportParams {
  let chart = p.chart
  if (!chartAllowed(chart, p.dim))
    chart = isTimeDimension(p.dim) ? "line" : "bar"
  const primary = selectedMetrics(p.metrics)[0]
  if (chart === "donut" && (!primary || !isAdditive(primary.key))) chart = "bar"
  return chart === p.chart ? p : { ...p, chart }
}

// how many filters differ from the defaults - the count on the "Фільтри" chip
export function activeFilterCount(p: ReportParams) {
  let n = 0
  if (p.platforms.length !== ALL_PLATFORMS.length) n++
  if (p.adAccounts.length !== ALL_AD_ACCOUNTS.length) n++
  if (p.portfolios.length !== ALL_PORTFOLIOS.length) n++
  if (p.products.length !== ALL_PRODUCTS.length) n++
  if (p.status !== "all") n++
  if (p.query.trim()) n++
  if (num(p.minSpend) !== null) n++
  if (num(p.minLeads) !== null) n++
  if (num(p.minRoi) !== null) n++
  return n
}
