// The data behind the Статистика report. The numbers are mock, but the shape is
// the real one: a CRM gives us its own status list plus the mapping the user
// made when connecting it, and every chart here is built out of that mapping
// rather than out of invented categories.

import {
  autoMatchStatus,
  MOCK_CRM_STATUSES,
  type CallCenter,
  type ConnectedCrm,
  type CrmStatusOption,
} from "@/features/integrations/types"
import {
  AD_ACCOUNTS,
  CAMPAIGNS,
  parseProductId,
  PLATFORMS,
  PRODUCTS,
  SETTINGS,
  type PlatformId,
} from "@/pages/campaigns/data"
import {
  addDays,
  fmtDay,
  startOfDay,
  UA_MONTHS,
  UA_MONTHS_SHORT,
  UA_WEEKDAYS,
  type DateRange,
} from "@/pages/campaigns/date-utils"

// ---- what the report is cut by ----

export type BreakdownId =
  | "income"
  | "orders"
  | "callcenters"
  | "ads"
  | "products"

export const BREAKDOWNS: {
  id: BreakdownId
  label: string
  soon?: boolean
}[] = [
  { id: "income", label: "Дохід" },
  { id: "orders", label: "Замовлення" },
  { id: "callcenters", label: "Колцентри" },
  { id: "ads", label: "Реклама" },
  { id: "products", label: "Товари" },
]

// ---- the block under the chart ----

/**
 * One figure of the summary under a chart.
 *
 * Every breakdown builds its own list once, and both the tiles under the chart
 * and the summary a tooltip closes with are rendered from it - the tooltip is
 * the same block read for one column instead of the whole period, so the two
 * can never say different things. It is also what the rail beside the chart is
 * measured against: a figure that has a tile here is not repeated there.
 */
export type TileUnit = "" | "₴" | "%" | "шт" | "хв"

export type TileFigure = {
  key: string
  label: string
  value: number
  unit: TileUnit
  /** the colour the chart draws it with, where it has one */
  dot?: string
  /** red once it goes negative */
  signed?: boolean
}

// How wide one column is. An hourly cut only makes sense over a short period -
// past the limit the chart would be a picket fence, so the step is offered but
// disabled, and the report falls back to the widest one that fits.
export type Step = "hour" | "2h" | "day" | "week" | "month" | "quarter"

/**
 * The ceiling on columns, whatever the period. A week is seven of them, a
 * quarter is thirteen, five years is twenty - past thirty they stop being
 * columns and turn into a picket fence.
 */
export const MAX_COLUMNS = 30

// Every step carries the longest period it can still draw inside that budget,
// and a period past it is served by the next step up. Finest first - that order
// is what the fallback walks.
export const STEPS: {
  id: Step
  /** how the step reads in the list */
  label: string
  /** how it reads on the trigger, next to the period it belongs to */
  short: string
  hours: number
  /** the longest period this step can carry - MAX_COLUMNS of its own width */
  maxDays: number
  /** the shortest period it says anything on */
  minDays: number
}[] = [
  {
    id: "hour",
    label: "По годині",
    short: "по годині",
    hours: 1,
    maxDays: 1,
    minDays: 1,
  },
  {
    id: "2h",
    label: "По 2 години",
    short: "по 2 год",
    hours: 2,
    maxDays: 2,
    minDays: 1,
  },
  {
    id: "day",
    label: "По днях",
    short: "по днях",
    hours: 24,
    maxDays: MAX_COLUMNS,
    minDays: 1,
  },
  {
    id: "week",
    label: "По тижнях",
    short: "по тижнях",
    hours: 24 * 7,
    maxDays: MAX_COLUMNS * 7,
    minDays: 14,
  },
  {
    id: "month",
    label: "По місяцях",
    short: "по місяцях",
    hours: 24 * 30,
    maxDays: MAX_COLUMNS * 30,
    minDays: 60,
  },
  // the catch-all: whatever period is thrown at the page lands here, and even a
  // decade of it is forty columns rather than a hundred and twenty
  {
    id: "quarter",
    label: "По кварталах",
    short: "по кварталах",
    hours: 24 * 91,
    maxDays: Infinity,
    minDays: 365,
  },
]

export function daysInRange(range: DateRange) {
  const from = startOfDay(range.from).getTime()
  const to = startOfDay(range.to).getTime()
  return Math.round((to - from) / 86_400_000) + 1
}

export function stepAllowed(step: Step, range: DateRange) {
  const meta = STEPS.find((s) => s.id === step)
  if (!meta) return false
  const days = daysInRange(range)
  return days <= meta.maxDays && days >= meta.minDays
}

// The step actually drawn: the chosen one while it fits the period, otherwise
// the finest one that does. A year of data lands on weeks, five years on
// months - the column count stays in the same band whatever the period.
export function resolveStep(step: Step, range: DateRange): Step {
  if (stepAllowed(step, range)) return step
  return STEPS.find((s) => stepAllowed(s.id, range))?.id ?? "day"
}

/**
 * The cut a period gets, with nobody asked.
 *
 * Once every step is capped at the same thirty columns, the finest one that
 * fits is simply the most detail the period can carry - there is no second
 * sensible answer for a picker to offer, so the page stopped offering one.
 */
export function stepFor(range: DateRange): Step {
  return resolveStep(STEPS[0].id, range)
}

// ---- money (the "Дохід" breakdown) ----

// The chart is three lines, and only three: what came in, what it cost, and
// what is left. Everything else - which costs, whose income - is detail the
// rail and the tooltip carry, not another line on the plot.
//
// The three hues are the first three slots of the series palette, the only
// subset that clears every check on all pairs rather than just neighbours
// (CVD ΔE 9.2 light / 9.4 dark, normal-vision 24.0 / 20.9).
export type LineKey = "sales" | "costs" | "profit"

export const MONEY_LINES: {
  key: LineKey
  label: string
  color: string
  /** the line the page is about - drawn heavier than the other two */
  strong?: boolean
}[] = [
  { key: "sales", label: "Виручка", color: "var(--viz-1)" },
  { key: "costs", label: "Витрати", color: "var(--viz-2)" },
  { key: "profit", label: "Дохід", color: "var(--viz-3)", strong: true },
]

// What each line is made of. The plot stays three lines; these are what the
// summary beside it opens them up into, so "за що витрати" and "звідки виручка"
// have an answer without another series on the chart.
export type CostKey = "ads" | "cogs" | "cc" | "packaging" | "returns"

export const COSTS: { key: CostKey; label: string }[] = [
  { key: "ads", label: "Реклама" },
  { key: "cogs", label: "Собівартість товару" },
  { key: "cc", label: "Колцентр" },
  { key: "packaging", label: "Пакування" },
  { key: "returns", label: "Повернення" },
]

export type IncomeKey = "sales" | "profit" | "buyer" | "owner"

export const PROFIT_SHARES: { key: "buyer" | "owner"; label: string }[] = [
  { key: "buyer", label: "Дохід баєра" },
  { key: "owner", label: "Дохід овнера" },
]

// ---- status categories ----

// The three buckets every CRM status is mapped into on the connect screen. They
// are a status palette, not series colours - the hue means a state, so it is
// never handed out to a metric (see the --st-* block in index.css).
export type CategoryKey = "approved" | "completed" | "rejected"

// bottom of the column up, so the money sits on the baseline and the losses cap
// the stack
export const CATEGORY_KEYS: CategoryKey[] = [
  "completed",
  "approved",
  "rejected",
]

export const CATEGORIES: {
  key: CategoryKey
  label: string
  color: string
}[] = [
  { key: "completed", label: "Завершені", color: "var(--st-completed)" },
  { key: "approved", label: "Підтверджені", color: "var(--st-approved)" },
  { key: "rejected", label: "Відмови", color: "var(--st-rejected)" },
]

// The status list to draw from: a connected CRM brings its own statuses and the
// mapping the user made for them; without one we fall back to the mock list run
// through the same keyword matcher the connect screen uses, so a demo account
// still has a realistic hundred-odd statuses behind the columns.
export function statusesByCategory(
  crms: ConnectedCrm[] = []
): Record<CategoryKey, CrmStatusOption[]> {
  const out: Record<CategoryKey, CrmStatusOption[]> = {
    completed: [],
    approved: [],
    rejected: [],
  }
  const sources = crms.length
    ? crms.map((crm) => ({
        list: crm.statuses?.length ? crm.statuses : MOCK_CRM_STATUSES,
        mapping: crm.statusMapping,
      }))
    : [{ list: MOCK_CRM_STATUSES, mapping: undefined }]

  const seen = new Set<string>()
  for (const source of sources) {
    for (const status of source.list) {
      if (seen.has(status.name)) continue
      const bucket = source.mapping?.[status.id] ?? autoMatchStatus(status.name)
      if (bucket && bucket in out) {
        seen.add(status.name)
        out[bucket as CategoryKey].push(status)
      }
    }
  }
  return out
}

// ---- the series ----

export type StatusSlice = { name: string; value: number }

export type OrdersPoint = {
  key: number
  /** short axis label - "12 сер" or "14:00" */
  label: string
  /** what the tooltip says - always unambiguous, date included */
  full: string
  leads: number
  completed: number
  approved: number
  rejected: number
  /** leads still sitting in statuses that map to nothing */
  inWork: number
  statuses: Record<CategoryKey, StatusSlice[]>
}

// What the three categories say about the funnel. Кожен показник рахується з
// підсумків періоду, а не як середнє по колонках.
export type OrderRateKey =
  | "approveRate"
  | "buyoutRate"
  | "rejectRate"
  | "inWorkRate"

export const ORDER_RATES: { key: OrderRateKey; label: string }[] = [
  { key: "approveRate", label: "% апруву" },
  { key: "buyoutRate", label: "% викупу" },
  { key: "rejectRate", label: "% відмов" },
  { key: "inWorkRate", label: "% у роботі" },
]

export type OrderRates = Record<OrderRateKey, number>

export type OrdersReport = {
  points: OrdersPoint[]
  step: Step
  totals: { leads: number } & Record<CategoryKey, number> & { inWork: number }
  /** every status that carried orders in the period, biggest first */
  statusTotals: Record<CategoryKey, StatusSlice[]>
  /** how many CRM statuses feed each category */
  counts: Record<CategoryKey, number>
  rates: OrderRates
}

// deterministic pseudo-random, so the mock series does not jump on re-render
function noise(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973
  return h
}

// Leads do not arrive evenly through the day - the shape below is the usual one
// for UA e-commerce: nothing overnight, a morning ramp, an evening peak.
const HOUR_WEIGHT = [
  0.2, 0.1, 0.08, 0.08, 0.1, 0.2, 0.5, 0.9, 1.3, 1.6, 1.8, 1.9, 1.8, 1.7, 1.7,
  1.8, 1.9, 2, 1.9, 1.6, 1.2, 0.9, 0.6, 0.35,
]
const HOUR_TOTAL = HOUR_WEIGHT.reduce((a, b) => a + b, 0)

const LEADS_PER_DAY = 640

// Column starts across the period. Day steps walk by calendar day so a DST
// switch cannot shift them; anything shorter walks in fixed hours. Buckets that
// have not happened yet are dropped rather than drawn as zeroes.
function bucketStarts(range: DateRange, step: Step, now: Date): Date[] {
  const hours = STEPS.find((s) => s.id === step)?.hours ?? 24
  const end = addDays(range.to, 1)
  const out: Date[] = []
  if (
    step === "day" ||
    step === "week" ||
    step === "month" ||
    step === "quarter"
  ) {
    const next = (d: Date) => {
      if (step === "day") return addDays(d, 1)
      if (step === "week") return addDays(d, 7)
      const m = startOfDay(d)
      m.setMonth(m.getMonth() + (step === "quarter" ? 3 : 1))
      return m
    }
    for (let d = startOfDay(range.from); d < end; d = next(d)) {
      if (d > now) break
      out.push(d)
    }
    return out
  }
  const stepMs = hours * 3_600_000
  for (
    let t = startOfDay(range.from).getTime();
    t < end.getTime();
    t += stepMs
  ) {
    if (t > now.getTime()) break
    out.push(new Date(t))
  }
  return out
}

// How the column names itself: short on the axis, unambiguous in the tooltip.
function bucketLabels(start: Date, hours: number, step: Step) {
  if (step === "quarter") {
    const n = Math.floor(start.getMonth() / 3) + 1
    return {
      label: `${n} кв`,
      full: `${n} квартал ${start.getFullYear()}`,
    }
  }
  if (step === "month") {
    return {
      label: UA_MONTHS_SHORT[start.getMonth()],
      full: `${UA_MONTHS[start.getMonth()]} ${start.getFullYear()}`,
    }
  }
  if (step === "week") {
    const till = addDays(start, 6)
    return {
      label: fmtDay(start),
      full: `${fmtDay(start)} – ${fmtDay(till, true)}`,
    }
  }
  const weekday = UA_WEEKDAYS[(start.getDay() + 6) % 7]
  const hh = String(start.getHours()).padStart(2, "0")
  const till = String((start.getHours() + hours) % 24).padStart(2, "0")
  return step === "day"
    ? { label: fmtDay(start), full: `${weekday}, ${fmtDay(start, true)}` }
    : { label: `${hh}:00`, full: `${fmtDay(start)}, ${hh}:00–${till}:00` }
}

// The leads of one column, shared by both breakdowns so CRM and Показники never
// disagree about how many leads a day brought.
function bucketLeads(start: Date, i: number, hours: number, step: Step) {
  // how much of a day's traffic this column covers - a week is seven of them,
  // a month roughly thirty, a quarter about ninety
  const weight =
    step === "day"
      ? 1
      : step === "week"
        ? 7
        : step === "month"
          ? 30
          : step === "quarter"
            ? 91
            : Array.from(
                { length: hours },
                (_, h) => HOUR_WEIGHT[(start.getHours() + h) % 24]
              ).reduce((a, b) => a + b, 0) / HOUR_TOTAL
  return Math.max(
    0,
    Math.round(LEADS_PER_DAY * weight * (0.78 + noise(i, 3) * 0.5))
  )
}

// Cuts `total` across the statuses of one category. Weights are fixed per
// status, so the same status keeps its share from column to column, and the
// largest-remainder rounding makes the slices add back up to `total` exactly -
// the tooltip is a decomposition of the column, not an approximation of it.
function splitAcross(
  total: number,
  statuses: CrmStatusOption[],
  seed: number
): StatusSlice[] {
  if (total <= 0 || statuses.length === 0) return []
  const weights = statuses.map(
    (s, i) => 0.25 + noise(hash(s.id) + i, seed) * 1.75
  )
  const sum = weights.reduce((a, b) => a + b, 0)
  const exact = weights.map((w) => (w / sum) * total)
  const slices = statuses.map((s, i) => ({
    name: s.name,
    value: Math.floor(exact[i]),
  }))
  let left = total - slices.reduce((a, b) => a + b.value, 0)
  const byRemainder = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem)
  for (const { i } of byRemainder) {
    if (left <= 0) break
    slices[i].value++
    left--
  }
  return slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value)
}

// ---- how much of an account a period touches ----

// What the longest period reaches. A week runs a slice of the catalogue; three
// years runs all of it, and a real account's all is about fifteen hundred.
const PRODUCT_POOL = 1500
const CAMPAIGN_POOL = 1500
/** the period at which the whole pool is in play */
const FULL_POOL_DAYS = 1095

// Sublinear on purpose: a seven-day report still has to carry enough rows to be
// worth a table, and a three-year one has to carry the lot.
function poolSize(pool: number, range: DateRange) {
  const share = Math.min(1, daysInRange(range) / FULL_POOL_DAYS) ** 0.6
  return Math.max(12, Math.round(pool * share))
}

// ---- the Товари report ----

// The catalogue a name is built out of. Three independent digits of the index
// pick the parts, so the pool runs to thousands before it ever repeats itself.
const KINDS = [
  "Масажер для шиї",
  "Робот-пилосос",
  "Тример для бороди",
  "Смарт-годинник",
  "Корсет для постави",
  "Набір кухонних ножів",
  "Сушарка для взуття",
  "Органайзер для авто",
  "Масажний пістолет",
  "Зволожувач повітря",
  "Портативний блендер",
  "Лампа для манікюру",
  "Бездротові навушники",
  "Крапельна кавоварка",
  "Тепловентилятор",
  "Відпарювач для одягу",
  "Пилосос для авто",
  "Фітнес-браслет",
  "Кухонні ваги",
  "Нічник-проектор",
  "Тримач для телефона",
  "Сушарка для фруктів",
  "Соковижималка",
  "Машинка для стрижки",
  "Аромадифузор",
  "Термокружка",
  "Рюкзак-антизлодій",
  "Електрощітка для взуття",
  "Гриль контактний",
  "Вологозахисний чохол",
]
const BRANDS = [
  "Neck Relax",
  "CleanMax",
  "BarberPro",
  "FitWatch",
  "PostureFix",
  "SharpEdge",
  "DryStep",
  "CarTidy",
  "PulseGun",
  "AromaMist",
  "FreshMix",
  "GelPro",
  "SoundPods",
  "BrewGo",
  "WarmAir",
  "SteamGo",
  "AutoVac",
  "PulseBand",
  "KitchenScale",
  "StarLight",
  "GripFix",
  "DryFruit",
  "JuicePro",
  "TrimGo",
  "ScentBox",
  "KeepHot",
  "SafeBag",
  "ShineStep",
  "GrillMate",
  "AquaShield",
]
const MODELS = [
  "Pro",
  "Max",
  "Lite",
  "S2",
  "X",
  "3",
  "5",
  "7",
  "9",
  "Plus",
  "Mini",
  "Air",
  "Ultra",
  "Neo",
  "One",
]

function synthProduct(i: number) {
  const kind = KINDS[i % KINDS.length]
  const brand = BRANDS[Math.floor(i / KINDS.length) % BRANDS.length]
  const model =
    MODELS[Math.floor(i / (KINDS.length * BRANDS.length)) % MODELS.length]
  return `${kind} ${brand} ${model}`
}

// The whole catalogue, real names first and synthetic ones after. This is what
// the page is sized against: a long period really does put a couple of thousand
// products in one report, and the chart, the rail and the table each have to
// hold up at that count rather than at the eight a demo would otherwise show.
const CATALOGUE: { id: string; name: string }[] = (() => {
  const out = Object.entries(PRODUCTS).map(([id, name]) => ({ id, name }))
  for (let i = 0; out.length < PRODUCT_POOL; i++) {
    out.push({ id: String(10_000 + i), name: synthProduct(i) })
  }
  return out
})()

type ProductProfile = {
  id: string
  name: string
  /** hash of the id, kept so the per-bucket loop does not rehash 1500 names */
  seed: number
  weight: number
  avgCheck: number
  cogs: number
  cpl: number
  approve: number
  buyout: number
}

// Each product sells at its own price and converts at its own rate, both
// derived from its id - so a product keeps its economics from report to report.
const PRODUCT_PROFILES: ProductProfile[] = CATALOGUE.map(({ id, name }) => {
  const h = hash(id)
  const avgCheck = Math.round((520 + noise(h, 3) * 980) / 10) * 10
  return {
    id,
    name,
    seed: h,
    weight: 0.5 + noise(h, 7) * 1.1,
    avgCheck,
    cogs: Math.round(avgCheck * (0.45 + noise(h, 11) * 0.2)),
    cpl: 0.8 + noise(h, 13) * 0.5,
    approve: 0.4 + noise(h, 17) * 0.16,
    buyout: 0.55 + noise(h, 19) * 0.22,
  }
})
const PRODUCT_BY_ID = new Map(PRODUCT_PROFILES.map((p) => [p.id, p]))

export type ProductMoney = {
  ads: number
  cogs: number
  cc: number
  packaging: number
  returns: number
  costs: number
  sales: number
  profit: number
}

export type ProductStat = {
  id: string
  name: string
  leads: number
  approves: number
  sold: number
  avgCheck: number
  money: ProductMoney
  rates: {
    approveRate: number
    buyoutRate: number
    costPerLead: number
    roi: number
    marginRate: number
  }
}

// What the Товари chart draws: the four sums that grow with the period. Every
// one of them is `ціна × кількість`, so they all move with the orders behind
// them and share one axis honestly. Averages and rates - середній чек, ціна
// ліда, % апруву, ROI - are `сума / кількість` instead: they sit in a fixed
// band whatever the period, so they stay in the tiles and the table rather
// than lying flat along the baseline of a chart drawn for sums.
export type ProductMetricKey = "sales" | "cogs" | "costs" | "profit"

// The order the rail lists them in. Colours are the shared series palette, one
// slot per metric, matching what the Дохід breakdown draws виручка / витрати /
// дохід with (see the --viz-* block in index.css).
export const PRODUCT_METRICS: {
  key: ProductMetricKey
  label: string
  color: string
}[] = [
  { key: "sales", label: "Виручка", color: "var(--viz-1)" },
  { key: "cogs", label: "Собівартість", color: "var(--viz-4)" },
  { key: "costs", label: "Витрати", color: "var(--viz-2)" },
  { key: "profit", label: "Дохід", color: "var(--viz-3)" },
]

// What a column carries besides its four lines: the figures that have no
// business being lines - a part of витрати, a count, and two averages that stay
// in the same band whatever the period. They are what the tooltip's summary is
// built out of, so a column can be read without going down to the table.
export type ProductDetailKey = "ads" | "sold" | "avgCheck" | "costPerLead"

// The same definitions the table's columns use, so a column of the chart and a
// row of the table can never say two different things about one average.
export function productDetails(t: {
  leads: number
  sold: number
  money: ProductMoney
}): Record<ProductDetailKey, number> {
  return {
    ads: t.money.ads,
    sold: t.sold,
    avgCheck: t.sold ? round(t.money.sales / t.sold) : 0,
    costPerLead: t.leads ? round(t.money.ads / t.leads, 1) : 0,
  }
}

// One figure per metric, from the same numbers the table is built out of. Used
// for a single column and for the whole period, so a line and its total in the
// rail can never drift apart.
export function productMetrics(
  money: ProductMoney
): Record<ProductMetricKey, number> {
  return {
    sales: money.sales,
    cogs: money.cogs,
    costs: money.costs,
    profit: money.profit,
  }
}

// One point of the Товари chart: the four lines and what the tooltip says
// under them, for one bucket of the period. No per-product cut - a couple of
// thousand products in colour is not a breakdown, and the table under the
// chart is what reaches a single one.
export type ProductsPoint = {
  key: number
  /** short axis label - "12 сер" or "14:00" */
  label: string
  /** what the tooltip says - always unambiguous, date included */
  full: string
  /** the column's own rates, so the tooltip can close with the tiles' block */
  rates: ProductStat["rates"]
} & Record<ProductMetricKey, number> &
  Record<ProductDetailKey, number>

// The Товари report: the chart over the period, the tiles, and every product in
// a list you can search and sort.
export type ProductsReport = {
  points: ProductsPoint[]
  step: Step
  /** every product, biggest revenue first */
  products: ProductStat[]
  totals: {
    leads: number
    approves: number
    sold: number
    avgCheck: number
    money: ProductMoney
    rates: ProductStat["rates"]
  }
}

// The block under the Товари chart. A column of the chart carries exactly these
// fields flat, so one bucket and the whole period are summarised by one call.
export function productTiles(t: {
  sold: number
  avgCheck: number
  sales: number
  profit: number
  rates: ProductStat["rates"]
}): TileFigure[] {
  return [
    { key: "sold", label: "Продано", value: t.sold, unit: "шт" },
    { key: "sales", label: "Виручка", value: t.sales, unit: "₴" },
    { key: "profit", label: "Дохід", value: t.profit, unit: "₴", signed: true },
    { key: "roi", label: "ROI", value: t.rates.roi, unit: "%", signed: true },
    { key: "avgCheck", label: "Середній чек", value: t.avgCheck, unit: "₴" },
    {
      key: "approveRate",
      label: "% апруву",
      value: t.rates.approveRate,
      unit: "%",
    },
    {
      key: "buyoutRate",
      label: "% викупу",
      value: t.rates.buyoutRate,
      unit: "%",
    },
    {
      key: "costPerLead",
      label: "Ціна ліда",
      value: t.rates.costPerLead,
      unit: "₴",
    },
  ]
}

const emptyProductMoney = (): ProductMoney => ({
  ads: 0,
  cogs: 0,
  cc: 0,
  packaging: 0,
  returns: 0,
  costs: 0,
  sales: 0,
  profit: 0,
})

// The same money model as the Дохід report, run at one product's own price.
function productMoney(
  r: RawMetrics,
  p: { avgCheck: number; cogs: number }
): ProductMoney {
  const s = SETTINGS
  const gross = p.avgCheck - p.cogs
  const returns = (r.approves - r.buyoutOrders) * s.returnPrice
  const cc =
    r.approves * s.ccPerOrder + gross * r.approves * s.ccUpsellPct * 0.15
  const packaging = r.approves * s.packagingPerParcel
  const cogs = p.cogs * r.buyoutOrders
  const sales = p.avgCheck * r.buyoutOrders
  const costs = r.spend + cogs + cc + packaging + returns
  return {
    ads: r.spend,
    cogs,
    cc,
    packaging,
    returns,
    costs,
    sales,
    profit: sales - costs,
  }
}

function addProductMoney(a: ProductMoney, b: ProductMoney): ProductMoney {
  return {
    ads: a.ads + b.ads,
    cogs: a.cogs + b.cogs,
    cc: a.cc + b.cc,
    packaging: a.packaging + b.packaging,
    returns: a.returns + b.returns,
    costs: a.costs + b.costs,
    sales: a.sales + b.sales,
    profit: a.profit + b.profit,
  }
}

function productRates(
  raw: RawMetrics,
  money: ProductMoney
): ProductStat["rates"] {
  const pct = (part: number, whole: number) =>
    whole ? round((part / whole) * 100, 1) : 0
  return {
    approveRate: pct(raw.approves, raw.leads),
    buyoutRate: pct(raw.buyoutOrders, raw.approves),
    costPerLead: raw.leads ? round(money.ads / raw.leads, 1) : 0,
    roi: money.costs ? round((money.profit / money.costs) * 100, 1) : 0,
    marginRate: money.sales ? round((money.profit / money.sales) * 100, 1) : 0,
  }
}

export function buildProductsReport(
  range: DateRange,
  step: Step,
  filters: ReportFilters = EMPTY_FILTERS,
  now: Date = new Date()
): ProductsReport {
  const resolved = resolveStep(step, range)
  const starts = bucketStarts(range, resolved, now)
  const hours = STEPS.find((s) => s.id === resolved)?.hours ?? 24
  const trafficRatio = trafficShare(filters)

  // A picked catalogue is the report; otherwise it is the slice this period
  // touches. Picking wins over the period so a product stays on screen even
  // when the range is too short to have reached it on its own.
  const profiles = filters.products.length
    ? filters.products
        .map((id) => PRODUCT_BY_ID.get(id))
        .filter((p): p is ProductProfile => p != null)
    : PRODUCT_PROFILES.slice(0, poolSize(PRODUCT_POOL, range))

  const sums = profiles.map(emptyRaw)
  const money = profiles.map(emptyProductMoney)

  // Buyouts come out of the model as fractions, and Продано is whole orders.
  // Rounding the running total rather than each column means the columns still
  // add back up to the Продано the tiles show.
  let soldSoFar = 0

  // The period is walked bucket by bucket: the traffic curve is what makes a
  // Tuesday different from a Sunday, and both the lines and the sums have to
  // come out of the same walk the other breakdowns use.
  const points = starts.map((start, i): ProductsPoint => {
    const leads = Math.round(
      bucketLeads(start, i, hours, resolved) * trafficRatio
    )
    const per = splitInt(
      leads,
      profiles.map((p, j) => p.weight * (0.85 + noise(i * 17 + j, 53) * 0.3))
    )
    const cpl = 38 + noise(i, 31) * 18

    let bucketMoney = emptyProductMoney()
    // the column's own funnel, kept so its rates are derived from the bucket
    // rather than read off the period
    let bucketRaw = emptyRaw()
    const soldBefore = Math.round(soldSoFar)
    profiles.forEach((p, j) => {
      const seed = p.seed + i
      const productLeads = per[j]
      const approves = Math.round(
        productLeads * p.approve * (0.92 + noise(seed, 23) * 0.16)
      )
      const buyoutOrders = approves * p.buyout * (0.92 + noise(seed, 29) * 0.16)
      const raw: RawMetrics = {
        leads: productLeads,
        spend: Math.round(productLeads * cpl * p.cpl),
        approves,
        buyoutOrders,
      }
      const m = productMoney(raw, p)
      soldSoFar += buyoutOrders
      bucketMoney = addProductMoney(bucketMoney, m)
      bucketRaw = addRaw(bucketRaw, raw)
      sums[j] = addRaw(sums[j], raw)
      money[j] = addProductMoney(money[j], m)
    })

    const bucket: ProductMoney = {
      ads: round(bucketMoney.ads),
      cogs: round(bucketMoney.cogs),
      cc: round(bucketMoney.cc),
      packaging: round(bucketMoney.packaging),
      returns: round(bucketMoney.returns),
      costs: round(bucketMoney.costs),
      sales: round(bucketMoney.sales),
      profit: round(bucketMoney.profit),
    }
    return {
      key: start.getTime(),
      ...bucketLabels(start, hours, resolved),
      ...productMetrics(bucket),
      // splitInt hands out the bucket's leads whole, so the column's own leads
      // are the ones the traffic curve drew for it
      ...productDetails({
        leads,
        sold: Math.round(soldSoFar) - soldBefore,
        money: bucket,
      }),
      rates: productRates(bucketRaw, bucket),
    }
  })

  const stats = profiles
    .map((p, j): ProductStat => {
      const raw = sums[j]
      const m = money[j]
      const sold = Math.round(raw.buyoutOrders)
      return {
        id: p.id,
        name: p.name,
        leads: raw.leads,
        approves: raw.approves,
        sold,
        avgCheck: p.avgCheck,
        money: {
          ads: round(m.ads),
          cogs: round(m.cogs),
          cc: round(m.cc),
          packaging: round(m.packaging),
          returns: round(m.returns),
          costs: round(m.costs),
          sales: round(m.sales),
          profit: round(m.profit),
        },
        rates: productRates(raw, m),
      }
    })
    .sort((a, b) => b.money.sales - a.money.sales)

  const rawAll = sums.reduce(addRaw, emptyRaw())
  const moneyAll = money.reduce(addProductMoney, emptyProductMoney())
  const soldAll = Math.round(rawAll.buyoutOrders)

  return {
    points,
    step: resolved,
    products: stats,
    totals: {
      leads: rawAll.leads,
      approves: rawAll.approves,
      sold: soldAll,
      avgCheck: soldAll ? round(moneyAll.sales / soldAll) : 0,
      money: {
        ads: round(moneyAll.ads),
        cogs: round(moneyAll.cogs),
        cc: round(moneyAll.cc),
        packaging: round(moneyAll.packaging),
        returns: round(moneyAll.returns),
        costs: round(moneyAll.costs),
        sales: round(moneyAll.sales),
        profit: round(moneyAll.profit),
      },
      rates: productRates(rawAll, moneyAll),
    },
  }
}

// ---- the Реклама report ----

// Campaigns are handled the same way products are: the chart carries the
// period's own spend and no per-campaign cut, and the table below lists them
// all, with a search and a sort to reach into it.
type CampaignProfile = {
  id: string
  name: string
  /** hash of the name, kept so the per-bucket loop does not rehash 1500 of them */
  seed: number
  /** the catalogue id its name points at, or "" when it points at nothing */
  productId: string
  adAccount: string
  platform: PlatformId
  active: boolean
  weight: number
  cpl: number
  cpc: number
  ctr: number
  approve: number
  buyout: number
  /** the product it sells, when its name carries an id */
  product: { avgCheck: number; cogs: number }
}

// The angle a campaign is cut at - what the tail of its name says.
const ANGLES = [
  "широка",
  "інтереси",
  "лукалайк 1%",
  "лукалайк 3%",
  "ретаргет",
  "відео",
  "каруселя",
  "ЛІД-форма",
  "конверсії",
  "трафік",
  "динаміка",
  "stories",
  "reels",
  "пошук",
]

// The whole book of campaigns: the hand-written ones first, then the pool the
// page is really sized against. Three campaigns per product at different
// angles, spread round-robin over the ad accounts so the source filters keep
// meaning something at this scale.
const CAMPAIGN_BOOK: {
  name: string
  adAccount: string
  platform: PlatformId
  active: boolean
}[] = (() => {
  const out = CAMPAIGNS.map((c) => ({
    name: c.name,
    adAccount: c.adAccount,
    platform: c.platform,
    active: c.active,
  }))
  const short = (name: string) => name.split(" ").slice(-2).join(" ")
  for (let i = 0; out.length < CAMPAIGN_POOL; i++) {
    const product = CATALOGUE[Math.floor(i / 3) % CATALOGUE.length]
    const account = AD_ACCOUNTS[i % AD_ACCOUNTS.length]
    const name = `${product.id} - ${short(product.name)} | ${
      ANGLES[i % ANGLES.length]
    }`
    out.push({
      name,
      adAccount: account.id,
      platform: account.platform,
      // about one in five is paused, and it stays paused from report to report
      active: noise(hash(name), 37) > 0.2,
    })
  }
  return out
})()

// A campaign inherits its ad account's traffic profile, tilts it by its own
// name, and sells whatever product that name points at. Built on first use, not
// at import: it reads the ad-account profiles, which are declared further down
// the module.
let campaignProfileCache: CampaignProfile[] | null = null

function campaignProfiles(): CampaignProfile[] {
  if (campaignProfileCache) return campaignProfileCache
  const byAccount = new Map(ACCOUNTS.map((a) => [a.account.id, a]))
  campaignProfileCache = CAMPAIGN_BOOK.map((c) => {
    const h = hash(c.name)
    const account = byAccount.get(c.adAccount)
    const productId = parseProductId(c.name).id ?? ""
    const product = PRODUCT_BY_ID.get(productId)
    return {
      id: c.name,
      name: c.name,
      seed: h,
      productId,
      adAccount: c.adAccount,
      platform: c.platform,
      active: c.active,
      // a paused campaign still spent what it spent, just less of it
      weight: (0.6 + noise(h, 3) * 0.9) * (c.active ? 1 : 0.45),
      cpl: (account?.cpl ?? 1) * (0.85 + noise(h, 7) * 0.3),
      cpc: 3.2 + noise(h, 11) * 2.4,
      ctr: 1.1 + noise(h, 13) * 1.2,
      approve: account?.approve ?? 0.46,
      buyout: account?.buyout ?? 0.65,
      product: product
        ? { avgCheck: product.avgCheck, cogs: product.cogs }
        : { avgCheck: PRODUCT.avgCheck, cogs: PRODUCT.cogs },
    }
  })
  return campaignProfileCache
}

export type CampaignStat = {
  id: string
  name: string
  platform: PlatformId
  active: boolean
  leads: number
  approves: number
  sold: number
  impressions: number
  clicks: number
  money: ProductMoney
  rates: {
    costPerLead: number
    cpm: number
    cpc: number
    ctr: number
    approveRate: number
    buyoutRate: number
    roi: number
  }
}

// One column: what every campaign together spent in that bucket. Who spent it
// is read off the rail and the table - four colours out of a thousand campaigns
// would be four arbitrary bars rather than a breakdown.
export type AdsPoint = {
  key: number
  label: string
  full: string
  /** what the bucket cost - the same figure as `money.ads`, kept flat because
   *  it is the headline of the column rather than one of its lines */
  spend: number
  leads: number
  approves: number
  sold: number
  impressions: number
  clicks: number
  money: ProductMoney
  /** the column's own rates, so the tooltip can close with the tiles' block */
  rates: CampaignStat["rates"]
}

export type AdsReport = {
  points: AdsPoint[]
  step: Step
  campaigns: CampaignStat[]
  totals: {
    leads: number
    approves: number
    sold: number
    impressions: number
    clicks: number
    money: ProductMoney
    rates: CampaignStat["rates"]
  }
}

type AdsSums = {
  leads: number
  approves: number
  buyoutOrders: number
  impressions: number
  clicks: number
}

const emptyAdsSums = (): AdsSums => ({
  leads: 0,
  approves: 0,
  buyoutOrders: 0,
  impressions: 0,
  clicks: 0,
})

// What the Реклама chart draws: the funnel a cabinet reports, top down. All
// four are counts against one axis - витрати, CPM and ціна ліда are money and
// stay in the block under the chart, where they are read against the counts
// rather than plotted next to them.
export type AdsMetricKey = "impressions" | "clicks" | "leads" | "approves"

// The order the rail lists them in - the order the funnel narrows. Ліди keep
// the slot the Замовлення breakdown draws them with, so one metric is one
// colour across the page.
export const ADS_METRICS: {
  key: AdsMetricKey
  label: string
  color: string
}[] = [
  { key: "impressions", label: "Покази", color: "var(--viz-4)" },
  { key: "clicks", label: "Кліки", color: "var(--viz-2)" },
  { key: "leads", label: "Ліди", color: "var(--viz-1)" },
  { key: "approves", label: "Апруви", color: "var(--viz-3)" },
]

/**
 * Покази start off.
 *
 * A cabinet shows an ad a few hundred times for every lead it brings, so на
 * одній осі покази ставлять решту воронки на нуль. The chart opens on the three
 * that read together and покази are one click away - the axis then rescales to
 * them, which is the only honest way to put both on one plot.
 */
export const DEFAULT_ADS_HIDDEN: AdsMetricKey[] = ["impressions"]

// The block under the Реклама chart, for one column or for the whole period.
export function adsTiles(t: {
  leads: number
  impressions: number
  clicks: number
  money: ProductMoney
  rates: CampaignStat["rates"]
}): TileFigure[] {
  return [
    { key: "ads", label: "Витрати", value: t.money.ads, unit: "₴" },
    { key: "leads", label: "Ліди", value: t.leads, unit: "" },
    {
      key: "costPerLead",
      label: "Ціна ліда",
      value: t.rates.costPerLead,
      unit: "₴",
    },
    { key: "roi", label: "ROI", value: t.rates.roi, unit: "%", signed: true },
    { key: "cpm", label: "CPM", value: t.rates.cpm, unit: "₴" },
    { key: "cpc", label: "CPC", value: t.rates.cpc, unit: "₴" },
    { key: "ctr", label: "CTR", value: t.rates.ctr, unit: "%" },
    {
      key: "approveRate",
      label: "% апруву",
      value: t.rates.approveRate,
      unit: "%",
    },
  ]
}

function campaignRates(t: AdsSums, money: ProductMoney): CampaignStat["rates"] {
  const per = (part: number, whole: number, digits = 1) =>
    whole ? round(part / whole, digits) : 0
  const pct = (part: number, whole: number) =>
    whole ? round((part / whole) * 100, 1) : 0
  return {
    costPerLead: per(money.ads, t.leads),
    cpm: t.impressions ? round((money.ads / t.impressions) * 1000, 1) : 0,
    cpc: per(money.ads, t.clicks),
    ctr: t.impressions ? round((t.clicks / t.impressions) * 100, 2) : 0,
    approveRate: pct(t.approves, t.leads),
    buyoutRate: pct(t.buyoutOrders, t.approves),
    roi: money.costs ? round((money.profit / money.costs) * 100, 1) : 0,
  }
}

export function buildAdsReport(
  range: DateRange,
  step: Step,
  filters: ReportFilters = EMPTY_FILTERS,
  now: Date = new Date()
): AdsReport {
  const resolved = resolveStep(step, range)
  const starts = bucketStarts(range, resolved, now)
  const hours = STEPS.find((s) => s.id === resolved)?.hours ?? 24
  const trafficRatio = trafficShare(filters)

  // the campaigns this period touches, then only those the panel leaves
  // standing: the right cabinet, the right state, selling a picked product
  const kept = new Set(matchingAccounts(filters).map((a) => a.id))
  const states = new Set(filters.states)
  const products = new Set(filters.products)
  const profiles = campaignProfiles()
    .slice(0, poolSize(CAMPAIGN_POOL, range))
    .filter(
      (c) =>
        kept.has(c.adAccount) &&
        (states.size === 0 || states.has(c.active ? "active" : "paused")) &&
        (products.size === 0 || products.has(c.productId))
    )

  const sums = profiles.map(emptyAdsSums)
  const money = profiles.map(emptyProductMoney)
  // one column each: the campaigns of that bucket rolled up, so the tooltip can
  // close with the same block the tiles under the chart show
  const bucketSums: AdsSums[] = []
  const bucketMoney: ProductMoney[] = []

  starts.forEach((start, i) => {
    const leads = Math.round(
      bucketLeads(start, i, hours, resolved) * trafficRatio
    )
    const per = splitInt(
      leads,
      profiles.map((c, j) => c.weight * (0.85 + noise(i * 19 + j, 67) * 0.3))
    )
    const cpl = 38 + noise(i, 31) * 18
    let bucket = emptyAdsSums()
    let bucketCash = emptyProductMoney()

    profiles.forEach((c, j) => {
      const seed = c.seed + i
      const campaignLeads = per[j]
      const spend = Math.round(
        campaignLeads * cpl * c.cpl * (0.92 + noise(seed, 71) * 0.16)
      )
      const clicks = Math.round(spend / c.cpc)
      const approves = Math.round(
        campaignLeads * c.approve * (0.92 + noise(seed, 43) * 0.16)
      )
      const buyoutOrders = approves * c.buyout * (0.92 + noise(seed, 47) * 0.16)

      const impressions = Math.round(clicks / (c.ctr / 100))
      const m = productMoney(
        { leads: campaignLeads, spend, approves, buyoutOrders },
        c.product
      )

      sums[j].leads += campaignLeads
      sums[j].approves += approves
      sums[j].buyoutOrders += buyoutOrders
      sums[j].clicks += clicks
      sums[j].impressions += impressions
      money[j] = addProductMoney(money[j], m)

      bucket = {
        leads: bucket.leads + campaignLeads,
        approves: bucket.approves + approves,
        buyoutOrders: bucket.buyoutOrders + buyoutOrders,
        impressions: bucket.impressions + impressions,
        clicks: bucket.clicks + clicks,
      }
      bucketCash = addProductMoney(bucketCash, m)
    })

    bucketSums.push(bucket)
    bucketMoney.push(bucketCash)
  })

  const stats = profiles
    .map((c, j): CampaignStat => {
      const t = sums[j]
      const m = money[j]
      return {
        id: c.id,
        name: c.name,
        platform: c.platform,
        active: c.active,
        leads: t.leads,
        approves: t.approves,
        sold: Math.round(t.buyoutOrders),
        impressions: t.impressions,
        clicks: t.clicks,
        money: {
          ads: round(m.ads),
          cogs: round(m.cogs),
          cc: round(m.cc),
          packaging: round(m.packaging),
          returns: round(m.returns),
          costs: round(m.costs),
          sales: round(m.sales),
          profit: round(m.profit),
        },
        rates: campaignRates(t, m),
      }
    })
    .sort((a, b) => b.money.ads - a.money.ads)

  const points = bucketSums.map((t, i): AdsPoint => {
    const m: ProductMoney = {
      ads: round(bucketMoney[i].ads),
      cogs: round(bucketMoney[i].cogs),
      cc: round(bucketMoney[i].cc),
      packaging: round(bucketMoney[i].packaging),
      returns: round(bucketMoney[i].returns),
      costs: round(bucketMoney[i].costs),
      sales: round(bucketMoney[i].sales),
      profit: round(bucketMoney[i].profit),
    }
    return {
      key: starts[i].getTime(),
      ...bucketLabels(starts[i], hours, resolved),
      spend: m.ads,
      leads: t.leads,
      approves: t.approves,
      sold: Math.round(t.buyoutOrders),
      impressions: t.impressions,
      clicks: t.clicks,
      money: m,
      rates: campaignRates(t, m),
    }
  })

  const allSums = sums.reduce(
    (a, t) => ({
      leads: a.leads + t.leads,
      approves: a.approves + t.approves,
      buyoutOrders: a.buyoutOrders + t.buyoutOrders,
      impressions: a.impressions + t.impressions,
      clicks: a.clicks + t.clicks,
    }),
    emptyAdsSums()
  )
  const allMoney = money.reduce(addProductMoney, emptyProductMoney())

  return {
    points,
    step: resolved,
    campaigns: stats,
    totals: {
      leads: allSums.leads,
      approves: allSums.approves,
      sold: Math.round(allSums.buyoutOrders),
      impressions: allSums.impressions,
      clicks: allSums.clicks,
      money: {
        ads: round(allMoney.ads),
        cogs: round(allMoney.cogs),
        cc: round(allMoney.cc),
        packaging: round(allMoney.packaging),
        returns: round(allMoney.returns),
        costs: round(allMoney.costs),
        sales: round(allMoney.sales),
        profit: round(allMoney.profit),
      },
      rates: campaignRates(allSums, allMoney),
    },
  }
}

// ---- the Колцентри report ----

// Four slots of the series palette, assigned by the order the centres are
// connected in - never by how much they process, so a slow month does not
// repaint anyone. Past four, the tail folds into "Інші".
export const MAX_CENTERS = 4
const CENTER_COLORS = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
]
const OTHER_COLOR = "var(--muted-foreground)"

// what a demo account sees before it has connected anything
const DEMO_CENTERS = ["КЦ «Альфа»", "КЦ «Вектор»", "КЦ «Лідер»", "КЦ «Контакт»"]

type CenterProfile = {
  id: string
  name: string
  color: string
  weight: number
  /** доля лідів, до яких додзвонилися */
  reach: number
  /** доля апрувів серед тих, до кого додзвонилися */
  approve: number
  /** доля апрувів із допродажем */
  upsell: number
  /** середній чек допродажу, ₴ */
  upsellCheck: number
  /** середній час обробки одного ліда, хв */
  handle: number
  /** ₴ за підтверджене замовлення */
  orderPrice: number
  /** комісія з допродажу, частка */
  upsellFee: number
}

// A centre inherits the account's default prices until it is connected with its
// own, and every rate it works at is derived from its name - so the same centre
// always behaves the same way, and two of them never look alike.
// The centres a report is built from: the connected ones, or the demo set when
// the account has none. The panel offers exactly this list, so a tick in it
// always matches something the report knows about.
export function centerOptions(centers: CallCenter[]) {
  return centers.length
    ? centers.map((c) => ({
        name: c.name,
        orderPrice: Number(c.confirmedOrderPrice) || SETTINGS.ccPerOrder,
        upsellFee:
          (Number(c.upsellFeePercent) || SETTINGS.ccUpsellPct * 100) / 100,
      }))
    : DEMO_CENTERS.map((name) => ({
        name,
        orderPrice: SETTINGS.ccPerOrder,
        upsellFee: SETTINGS.ccUpsellPct,
      }))
}

function centerProfiles(
  centers: CallCenter[],
  picked: string[]
): CenterProfile[] {
  const all = centerOptions(centers)
  const source = picked.length
    ? all.filter((c) => picked.includes(c.name))
    : all

  const kept = source.slice(0, MAX_CENTERS).map((c, i): CenterProfile => {
    const h = hash(c.name)
    return {
      id: c.name,
      name: c.name,
      color: CENTER_COLORS[i],
      weight: 0.7 + noise(h, 3) * 0.6,
      reach: 0.74 + noise(h, 7) * 0.18,
      approve: 0.52 + noise(h, 11) * 0.16,
      upsell: 0.16 + noise(h, 13) * 0.16,
      upsellCheck: 180 + noise(h, 17) * 160,
      handle: 2.4 + noise(h, 19) * 2.6,
      orderPrice: c.orderPrice,
      upsellFee: c.upsellFee,
    }
  })

  // everything past the palette is one grey line rather than a new hue
  const tail = source.slice(MAX_CENTERS)
  if (tail.length > 0) {
    const h = hash("інші")
    kept.push({
      id: "other",
      name: `Інші (${tail.length})`,
      color: OTHER_COLOR,
      weight: tail.length * 0.8,
      reach: 0.76,
      approve: 0.5,
      upsell: 0.18,
      upsellCheck: 220,
      handle: 3.4 + noise(h, 5) * 1,
      orderPrice: tail.reduce((a, c) => a + c.orderPrice, 0) / tail.length,
      upsellFee: tail.reduce((a, c) => a + c.upsellFee, 0) / tail.length,
    })
  }
  return kept
}

export type CenterRates = {
  reachRate: number
  approveRate: number
  upsellRate: number
  costPerApprove: number
  handle: number
}

export type CenterStat = {
  id: string
  name: string
  color: string
  leads: number
  reached: number
  approves: number
  upsells: number
  upsellSum: number
  cost: number
  rates: CenterRates
}

export const CENTER_RATES: {
  key: keyof CenterRates
  label: string
  unit: TileUnit
}[] = [
  { key: "reachRate", label: "% дозвону", unit: "%" },
  { key: "approveRate", label: "% апруву", unit: "%" },
  { key: "upsellRate", label: "% допродажів", unit: "%" },
  { key: "costPerApprove", label: "Ціна апруву", unit: "₴" },
  { key: "handle", label: "Сер. час обробки", unit: "хв" },
]

/** the account as a whole, or one column of it - the same set of figures */
export type CenterTotals = Omit<CenterStat, "id" | "name" | "color">

export type CentersPoint = {
  key: number
  label: string
  full: string
  leads: number
  /** what each centre confirmed in the bucket, by centre id. Nested rather
   *  than spread flat: a centre is keyed by its own name, and a centre called
   *  "leads" would otherwise overwrite the column's own figures. */
  byCenter: Record<string, number>
  /** the bucket rolled up, so the tooltip closes with the tiles' own block */
  sum: CenterTotals
}

export type CentersReport = {
  points: CentersPoint[]
  step: Step
  centers: CenterStat[]
  totals: CenterTotals
}

// The block under the Колцентри chart, for one column or the whole period.
export function centerTiles(t: CenterTotals): TileFigure[] {
  return [
    ...CENTER_RATES.map((r) => ({
      key: r.key,
      label: r.label,
      value: t.rates[r.key],
      unit: r.unit,
    })),
    { key: "approves", label: "Апруви", value: t.approves, unit: "" as const },
    { key: "upsells", label: "Допродажі", value: t.upsells, unit: "" as const },
    {
      key: "upsellSum",
      label: "Сума допродажів",
      value: t.upsellSum,
      unit: "₴" as const,
    },
    {
      key: "cost",
      label: "Витрати на КЦ",
      value: t.cost,
      unit: "₴" as const,
    },
  ]
}

const emptyCenterSums = () => ({
  leads: 0,
  reached: 0,
  approves: 0,
  upsells: 0,
  upsellSum: 0,
  cost: 0,
  handleWeighted: 0,
})

function centerRates(t: {
  leads: number
  reached: number
  approves: number
  upsells: number
  cost: number
  handleWeighted: number
}): CenterRates {
  const pct = (part: number, whole: number) =>
    whole ? round((part / whole) * 100, 1) : 0
  return {
    reachRate: pct(t.reached, t.leads),
    approveRate: pct(t.approves, t.leads),
    upsellRate: pct(t.upsells, t.approves),
    costPerApprove: t.approves ? round(t.cost / t.approves, 1) : 0,
    handle: t.leads ? round(t.handleWeighted / t.leads, 1) : 0,
  }
}

export function buildCentersReport(
  range: DateRange,
  step: Step,
  filters: ReportFilters = EMPTY_FILTERS,
  centers: CallCenter[] = [],
  now: Date = new Date()
): CentersReport {
  const resolved = resolveStep(step, range)
  const starts = bucketStarts(range, resolved, now)
  const hours = STEPS.find((s) => s.id === resolved)?.hours ?? 24
  const profiles = centerProfiles(centers, filters.centers)
  const trafficRatio = trafficShare(filters)

  const sums = profiles.map(emptyCenterSums)

  const points = starts.map((start, i): CentersPoint => {
    const leads = Math.round(
      bucketLeads(start, i, hours, resolved) * trafficRatio
    )
    const per = splitInt(
      leads,
      profiles.map((p, j) => p.weight * (0.85 + noise(i * 13 + j, 29) * 0.3))
    )

    const byCenter: Record<string, number> = {}
    const bucket = emptyCenterSums()
    bucket.leads = leads

    profiles.forEach((p, j) => {
      const seed = hash(p.id) + i
      const centerLeads = per[j]
      const reached = Math.round(
        centerLeads * p.reach * (0.94 + noise(seed, 23) * 0.12)
      )
      const approves = Math.round(
        reached * p.approve * (0.94 + noise(seed, 31) * 0.12)
      )
      const upsells = Math.round(
        approves * p.upsell * (0.9 + noise(seed, 37) * 0.2)
      )
      const upsellSum = upsells * p.upsellCheck
      const cost = approves * p.orderPrice + upsellSum * p.upsellFee
      const handle = p.handle * (0.92 + noise(seed, 41) * 0.16)

      byCenter[p.id] = approves

      sums[j].leads += centerLeads
      sums[j].reached += reached
      sums[j].approves += approves
      sums[j].upsells += upsells
      sums[j].upsellSum += upsellSum
      sums[j].cost += cost
      sums[j].handleWeighted += handle * centerLeads

      bucket.reached += reached
      bucket.approves += approves
      bucket.upsells += upsells
      bucket.upsellSum += upsellSum
      bucket.cost += cost
      bucket.handleWeighted += handle * centerLeads
    })

    return {
      key: start.getTime(),
      ...bucketLabels(start, hours, resolved),
      leads,
      byCenter,
      sum: {
        leads,
        reached: bucket.reached,
        approves: bucket.approves,
        upsells: bucket.upsells,
        upsellSum: round(bucket.upsellSum),
        cost: round(bucket.cost),
        rates: centerRates(bucket),
      },
    }
  })

  const stats = profiles.map((p, j): CenterStat => {
    const t = sums[j]
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      leads: t.leads,
      reached: t.reached,
      approves: t.approves,
      upsells: t.upsells,
      upsellSum: round(t.upsellSum),
      cost: round(t.cost),
      rates: centerRates(t),
    }
  })

  const all = sums.reduce(
    (a, t) => ({
      leads: a.leads + t.leads,
      reached: a.reached + t.reached,
      approves: a.approves + t.approves,
      upsells: a.upsells + t.upsells,
      upsellSum: a.upsellSum + t.upsellSum,
      cost: a.cost + t.cost,
      handleWeighted: a.handleWeighted + t.handleWeighted,
    }),
    emptyCenterSums()
  )

  return {
    points,
    step: resolved,
    centers: stats,
    totals: {
      leads: all.leads,
      reached: all.reached,
      approves: all.approves,
      upsells: all.upsells,
      upsellSum: round(all.upsellSum),
      cost: round(all.cost),
      rates: centerRates(all),
    },
  }
}

// ---- the Дохід report ----

// The product economics one campaign runs on: what a parcel sells for, what the
// goods in it cost, and the buyer's cut of what is left.
const PRODUCT = { avgCheck: 990, cogs: 600, buyerPct: 0.3 }

// what a column (or a whole period) is measured from - every figure below is
// derived out of these four, never stored on its own
type RawMetrics = {
  leads: number
  spend: number
  approves: number
  buyoutOrders: number
}

export type MoneyFigures = Record<CostKey, number> &
  Record<IncomeKey, number> & {
    costs: number
    /** дохід / виручка, % - what a hryvnia of revenue actually leaves behind */
    marginRate: number
    /** the two figures the виручка is: parcels bought out × what one is worth */
    orders: number
    avgCheck: number
    /** the funnel the money came through, kept so every rate below is derived
     *  from the period's own counts rather than averaged over columns */
    leads: number
    approves: number
  }

// ---- how profitable that money was ----

export type RateKey =
  | "roi"
  | "romi"
  | "marginRate"
  | "costPerLead"
  | "costPerApprove"
  | "costPerOrder"
  | "approveRate"
  | "buyoutRate"

export const RATES: { key: RateKey; label: string; unit: "" | "₴" | "%" }[] = [
  { key: "roi", label: "ROI", unit: "%" },
  { key: "romi", label: "ROMI", unit: "%" },
  { key: "marginRate", label: "Маржинальність", unit: "%" },
  { key: "approveRate", label: "% апруву", unit: "%" },
  { key: "buyoutRate", label: "% викупу", unit: "%" },
  { key: "costPerLead", label: "Ціна ліда", unit: "₴" },
  { key: "costPerApprove", label: "Ціна апруву", unit: "₴" },
  { key: "costPerOrder", label: "Ціна викупу", unit: "₴" },
]

export type Rates = Record<RateKey, number>

// ROI is measured against every hryvnia that went out, ROMI only against the
// ad spend - the pair says whether the product or the traffic is the problem.
export function ratesOf(m: MoneyFigures): Rates {
  return {
    roi: round((m.profit / (m.costs || 1)) * 100, 1),
    romi: round((m.profit / (m.ads || 1)) * 100, 1),
    marginRate: m.marginRate,
    approveRate: round((m.approves / (m.leads || 1)) * 100, 1),
    buyoutRate: round((m.orders / (m.approves || 1)) * 100, 1),
    costPerLead: round(m.ads / (m.leads || 1), 1),
    costPerApprove: round(m.ads / (m.approves || 1), 1),
    costPerOrder: round(m.ads / (m.orders || 1), 1),
  }
}

// A column of the Дохід chart is a MoneyFigures of its own, so the block under
// the chart and the one a tooltip closes with come out of the same call.
export function incomeTiles(m: MoneyFigures): TileFigure[] {
  const rates = ratesOf(m)
  return RATES.map((r) => ({
    key: r.key,
    label: r.label,
    value: rates[r.key],
    unit: r.unit,
    signed: r.key === "roi" || r.key === "romi",
  }))
}

// ---- the same, cut by traffic source ----

// Each platform buys leads at its own price and converts them at its own rate -
// that spread is the whole point of the table under the chart.
const PLATFORM_PROFILE: Record<
  PlatformId,
  {
    share: number
    /** how its lead price compares to the account average */
    cpl: number
    approve: number
    buyout: number
  }
> = {
  facebook: { share: 0.52, cpl: 1, approve: 0.47, buyout: 0.67 },
  google: { share: 0.28, cpl: 1.24, approve: 0.53, buyout: 0.72 },
  tiktok: { share: 0.2, cpl: 0.76, approve: 0.4, buyout: 0.58 },
}

// Every ad account runs its own traffic: it inherits its platform's profile and
// then tilts it a little, so two cabinets on the same platform are never the
// same. The report is generated cabinet by cabinet, which is what lets a filter
// simply drop the ones it excludes.
const ACCOUNTS = AD_ACCOUNTS.map((account) => {
  const p = PLATFORM_PROFILE[account.platform]
  const siblings = AD_ACCOUNTS.filter(
    (x) => x.platform === account.platform
  ).length
  const h = hash(account.id)
  return {
    account,
    weight: (p.share / siblings) * (0.8 + noise(h, 5) * 0.4),
    cpl: p.cpl * (0.9 + noise(h, 9) * 0.2),
    approve: p.approve * (0.94 + noise(h, 13) * 0.12),
    buyout: p.buyout * (0.95 + noise(h, 17) * 0.1),
  }
})

const TOTAL_WEIGHT = ACCOUNTS.reduce((a, x) => a + x.weight, 0)

// How much of the account's traffic the current filter leaves standing. Both
// breakdowns scale by it, so "тільки TikTok" means the same number of leads on
// the Дохід chart and on the Замовлення one.
function trafficShare(filters: ReportFilters) {
  const kept = matchingAccounts(filters).map((a) => a.id)
  const weight = ACCOUNTS.filter((x) => kept.includes(x.account.id)).reduce(
    (a, x) => a + x.weight,
    0
  )
  return weight / TOTAL_WEIGHT
}

// An empty list means "усі" - a filter narrows only once something is ticked.
// One object for the whole panel, even though a given breakdown only reads part
// of it: the sources are a property of the account, not of the chart currently
// on screen, so they do not appear and disappear as the tabs are clicked.
export type CampaignState = "active" | "paused"

export type ReportFilters = {
  platforms: PlatformId[]
  portfolios: string[]
  accounts: string[]
  /** running or paused, as a campaign's own state */
  states: CampaignState[]
  /** product ids, out of a catalogue that runs to thousands */
  products: string[]
  /** call centre names, as the integrations provider spells them */
  centers: string[]
  /** CRM labels, as the integrations provider spells them */
  crms: string[]
}

export const EMPTY_FILTERS: ReportFilters = {
  platforms: [],
  portfolios: [],
  accounts: [],
  states: [],
  products: [],
  centers: [],
  crms: [],
}

/** the whole catalogue, for the product picker in the panel */
export const PRODUCT_OPTIONS: { id: string; name: string }[] = CATALOGUE

const passes = (list: string[], value: string) =>
  list.length === 0 || list.includes(value)

// The cabinets a report is built from, and the same predicate the picker uses
// to grey out cabinets that no longer fit the platforms above them.
export function matchingAccounts(filters: ReportFilters) {
  return AD_ACCOUNTS.filter(
    (a) =>
      passes(filters.platforms, a.platform) &&
      passes(filters.portfolios, a.business) &&
      passes(filters.accounts, a.id)
  )
}

export type PlatformStat = {
  id: PlatformId
  label: string
  money: MoneyFigures
  rates: Rates
}

export type MoneyPoint = {
  key: number
  label: string
  full: string
} & MoneyFigures

export type IncomeReport = {
  points: MoneyPoint[]
  step: Step
  totals: MoneyFigures
  rates: Rates
  platforms: PlatformStat[]
}

function round(n: number, d = 0) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

// One model, three lines, no double counting: виручка is what the bought-out
// parcels brought in, витрати is every hryvnia that went out to make them
// happen, and дохід is exactly the difference. Feeding this the period's sums
// is what produces the summary, so the rail is re-derived from the period
// rather than added up out of rounded columns.
function deriveMoney(r: RawMetrics): MoneyFigures {
  const s = SETTINGS
  const grossPerOrder = PRODUCT.avgCheck - PRODUCT.cogs
  const refusals = r.approves - r.buyoutOrders

  const returns = refusals * s.returnPrice
  const cc =
    r.approves * s.ccPerOrder +
    grossPerOrder * r.approves * s.ccUpsellPct * 0.15
  const packaging = r.approves * s.packagingPerParcel
  const cogs = PRODUCT.cogs * r.buyoutOrders

  const sales = PRODUCT.avgCheck * r.buyoutOrders
  const costs = r.spend + cogs + cc + packaging + returns
  const profit = sales - costs
  const buyer = profit > 0 ? profit * PRODUCT.buyerPct : 0

  return {
    ads: round(r.spend),
    cogs: round(cogs),
    cc: round(cc),
    packaging: round(packaging),
    returns: round(returns),
    costs: round(costs),
    sales: round(sales),
    profit: round(profit),
    buyer: round(buyer),
    owner: round(profit - buyer),
    marginRate: round((profit / (sales || 1)) * 100, 1),
    orders: round(r.buyoutOrders),
    avgCheck: PRODUCT.avgCheck,
    leads: r.leads,
    approves: r.approves,
  }
}

// Cuts a whole number across weights without losing anyone to rounding - the
// platforms of a column always add back up to the column.
function splitInt(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const exact = weights.map((w) => (w / sum) * total)
  const out = exact.map(Math.floor)
  let left = total - out.reduce((a, b) => a + b, 0)
  const byRemainder = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem)
  for (const { i } of byRemainder) {
    if (left <= 0) break
    out[i]++
    left--
  }
  return out
}

const emptyRaw = (): RawMetrics => ({
  leads: 0,
  spend: 0,
  approves: 0,
  buyoutOrders: 0,
})

function addRaw(a: RawMetrics, b: RawMetrics): RawMetrics {
  return {
    leads: a.leads + b.leads,
    spend: a.spend + b.spend,
    approves: a.approves + b.approves,
    buyoutOrders: a.buyoutOrders + b.buyoutOrders,
  }
}

export function buildIncomeReport(
  range: DateRange,
  step: Step,
  filters: ReportFilters = EMPTY_FILTERS,
  now: Date = new Date()
): IncomeReport {
  const resolved = resolveStep(step, range)
  const starts = bucketStarts(range, resolved, now)
  const hours = STEPS.find((s) => s.id === resolved)?.hours ?? 24

  const kept = matchingAccounts(filters).map((a) => a.id)
  const selected = ACCOUNTS.filter((x) => kept.includes(x.account.id))
  const keptWeight = selected.reduce((a, x) => a + x.weight, 0)

  // Every column is built cabinet by cabinet and only then added up, so the
  // table under the chart and the lines on it can never disagree - and a filter
  // takes its cabinets out of the sum instead of scaling the result down.
  const byBucket = starts.map((start, i) => {
    const pool = bucketLeads(start, i, hours, resolved)
    const leads = Math.round(pool * (keptWeight / TOTAL_WEIGHT))
    // ~38-56 ₴ a lead on average, the band this account's campaigns buy at
    const cpl = 38 + noise(i, 31) * 18
    const leadsPer = splitInt(
      leads,
      selected.map((x, j) => x.weight * (0.85 + noise(i * 11 + j, 61) * 0.3))
    )

    return selected.map((x, j): RawMetrics => {
      const seed = hash(x.account.id) + i
      const accountLeads = leadsPer[j]
      const approves = Math.round(
        accountLeads * x.approve * (0.9 + noise(seed, 43) * 0.2)
      )
      return {
        leads: accountLeads,
        spend: Math.round(
          accountLeads * cpl * x.cpl * (0.92 + noise(seed, 71) * 0.16)
        ),
        approves,
        buyoutOrders: approves * x.buyout * (0.92 + noise(seed, 47) * 0.16),
      }
    })
  })

  const raws = byBucket.map((perAccount) =>
    perAccount.reduce(addRaw, emptyRaw())
  )

  const points = raws.map(
    (raw, i): MoneyPoint => ({
      key: starts[i].getTime(),
      ...bucketLabels(starts[i], hours, resolved),
      ...deriveMoney(raw),
    })
  )

  const sum = raws.reduce(addRaw, emptyRaw())
  const totals = deriveMoney(sum)

  // only the platforms still in the selection get a row
  const platforms = PLATFORMS.filter((p) =>
    selected.some((x) => x.account.platform === p.id)
  ).map((p): PlatformStat => {
    const money = deriveMoney(
      byBucket.reduce(
        (acc, perAccount) =>
          perAccount.reduce(
            (inner, raw, j) =>
              selected[j].account.platform === p.id
                ? addRaw(inner, raw)
                : inner,
            acc
          ),
        emptyRaw()
      )
    )
    return { id: p.id, label: p.label, money, rates: ratesOf(money) }
  })

  return { points, step: resolved, totals, rates: ratesOf(totals), platforms }
}

// Апрув is everything that was ever confirmed - both what is still being
// fulfilled and what was already bought out; викуп is measured inside it.
export function orderRatesOf(t: OrdersReport["totals"]): OrderRates {
  const approved = t.approved + t.completed
  const pct = (part: number, whole: number) =>
    whole ? Math.round((part / whole) * 1000) / 10 : 0
  return {
    approveRate: pct(approved, t.leads),
    buyoutRate: pct(t.completed, approved),
    rejectRate: pct(t.rejected, t.leads),
    inWorkRate: pct(t.inWork, t.leads),
  }
}

// A column of the Замовлення chart carries the same shape the period does, so
// one bucket and the whole report are summarised by the same call.
export function orderTiles(t: OrdersReport["totals"]): TileFigure[] {
  const rates = orderRatesOf(t)
  return [
    ...ORDER_RATES.map((r) => ({
      key: r.key,
      label: r.label,
      value: rates[r.key],
      unit: "%" as const,
    })),
    { key: "leads", label: "Ліди", value: t.leads, unit: "" as const },
    ...[...CATEGORIES].reverse().map((c) => ({
      key: c.key,
      label: c.label,
      value: t[c.key],
      unit: "" as const,
      dot: c.color,
    })),
  ]
}

export function buildOrdersReport(
  range: DateRange,
  step: Step,
  filters: ReportFilters = EMPTY_FILTERS,
  crms: ConnectedCrm[] = [],
  now: Date = new Date()
): OrdersReport {
  const resolved = resolveStep(step, range)
  const byCategory = statusesByCategory(crms)
  const starts = bucketStarts(range, resolved, now)
  const hours = STEPS.find((s) => s.id === resolved)?.hours ?? 24
  // the same traffic the Дохід breakdown would draw for these filters
  const trafficRatio = trafficShare(filters)

  const points = starts.map((start, i): OrdersPoint => {
    const leads = Math.round(
      bucketLeads(start, i, hours, resolved) * trafficRatio
    )

    // Orders need days to reach an outcome, so the freshest columns are mostly
    // still in work and the older ones have settled into завершено / відмова.
    const hoursOld = Math.max(
      0,
      (now.getTime() - start.getTime()) / 3_600_000 - hours / 2
    )
    const maturity = Math.min(1, hoursOld / 96)

    const share = (key: CategoryKey, value: number) =>
      byCategory[key].length === 0 ? 0 : value
    const completedShare = share(
      "completed",
      (0.28 + noise(i, 11) * 0.1) * maturity
    )
    const rejectedShare = share(
      "rejected",
      (0.2 + noise(i, 17) * 0.07) * (0.35 + 0.65 * maturity)
    )
    const approvedShare = share(
      "approved",
      Math.max(0.05, 0.32 - 0.14 * maturity + noise(i, 23) * 0.06)
    )

    const completed = Math.round(leads * completedShare)
    const rejected = Math.round(leads * rejectedShare)
    const approved = Math.min(
      Math.round(leads * approvedShare),
      Math.max(0, leads - completed - rejected)
    )
    const inWork = Math.max(0, leads - completed - rejected - approved)

    const counts = { completed, approved, rejected }
    const statuses = {
      completed: splitAcross(completed, byCategory.completed, i + 1),
      approved: splitAcross(approved, byCategory.approved, i + 41),
      rejected: splitAcross(rejected, byCategory.rejected, i + 83),
    }

    return {
      key: start.getTime(),
      ...bucketLabels(start, hours, resolved),
      leads,
      ...counts,
      inWork,
      statuses,
    }
  })

  const totals = points.reduce(
    (acc, p) => ({
      leads: acc.leads + p.leads,
      completed: acc.completed + p.completed,
      approved: acc.approved + p.approved,
      rejected: acc.rejected + p.rejected,
      inWork: acc.inWork + p.inWork,
    }),
    { leads: 0, completed: 0, approved: 0, rejected: 0, inWork: 0 }
  )

  // the same decomposition the tooltip shows for one column, rolled up over the
  // whole period - that is what the rail beside the chart reads from
  const statusTotals = {} as Record<CategoryKey, StatusSlice[]>
  for (const key of CATEGORY_KEYS) {
    const sums = new Map<string, number>()
    for (const point of points) {
      for (const slice of point.statuses[key]) {
        sums.set(slice.name, (sums.get(slice.name) ?? 0) + slice.value)
      }
    }
    statusTotals[key] = [...sums]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }

  return {
    points,
    step: resolved,
    totals,
    statusTotals,
    counts: {
      completed: byCategory.completed.length,
      approved: byCategory.approved.length,
      rejected: byCategory.rejected.length,
    },
    rates: orderRatesOf(totals),
  }
}
