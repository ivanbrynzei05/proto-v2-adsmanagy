// Real responses from GET /api/v1/statistics mapped onto the prototype's own
// report shapes. Live through the vite proxy; the bundled JSON in public/real
// is the fallback for when the preview backend is gone.
import type { PlatformId } from "@/pages/campaigns/data"
import type { DateRange } from "@/pages/campaigns/date-utils"

import type {
  CategoryKey,
  IncomeReport,
  MoneyFigures,
  OrdersReport,
  ProductStat,
  ProductsReport,
  Rates,
  Step,
  StatusSlice,
} from "./data"

type Values = Record<string, number | null>

type ApiItem = { key: string; label: string | null; total: number | null }

type ApiSeries = {
  key: string
  type: string
  stack: string | null
  total: number | null
  items: ApiItem[]
}

type ApiRow = {
  id: string
  label: string | null
  icon: { kind: string; key: string } | null
  values: Values
  children: ApiRow[]
}

export type ApiResponse = {
  meta: {
    period: { date_from: string; date_to: string }
    breakdown: string
    warnings: { key: string; params: Record<string, unknown> }[]
  }
  data: {
    chart: {
      step: "hour" | "day" | "range"
      series: ApiSeries[]
      points: { x: string; values: Values }[]
    } | null
    kpis: { key: string; value: number | null }[]
    table: {
      rows: ApiRow[]
      totals: { values: Values }
      page: { total_rows: number }
    } | null
  }
}

export type RealBreakdown = "income" | "orders" | "product"

const MONTHS = [
  "січ", "лют", "бер", "кві", "тра", "чер",
  "лип", "сер", "вер", "жов", "лис", "гру",
]

const n = (v: number | null | undefined) => (typeof v === "number" ? v : 0)
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d
const pct = (part: number, whole: number) => (whole ? round((part / whole) * 100) : 0)

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

export async function fetchReport(
  breakdown: RealBreakdown,
  range: DateRange
): Promise<ApiResponse> {
  const query = new URLSearchParams({
    date_from: iso(range.from),
    date_to: iso(range.to ?? range.from),
    breakdown,
  })
  try {
    const res = await fetch(`/api/v1/statistics?${query}`, {
      credentials: "include",
    })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as ApiResponse
  } catch {
    // The preview backend is not reachable — fall back to the response saved
    // for 22–28.08, so the page still shows real numbers rather than nothing.
    const res = await fetch(`${import.meta.env.BASE_URL}real/${breakdown}.json`)
    return (await res.json()) as ApiResponse
  }
}

function axisLabel(x: string): { label: string; full: string } {
  const time = x.match(/\d{2}:\d{2}$/)
  if (time) return { label: time[0], full: x }
  const [from, to] = x.split("–").map((part) => part.trim())
  const short = (value: string) => {
    const [d, m] = value.split(".")
    return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m}`
  }
  return { label: to ? `${short(from)} – ${short(to)}` : short(from), full: x }
}

const STEPS: Record<string, Step> = { hour: "hour", day: "day", range: "week" }

/** Series and item totals as one flat map, shaped like a point's values. */
function totalsOf(series: ApiSeries[]): Values {
  const out: Values = {}
  for (const s of series) {
    out[s.key] = s.total
    for (const item of s.items) out[item.key] = item.total
  }
  return out
}

function kpisOf(api: ApiResponse): Values {
  return Object.fromEntries(api.data.kpis.map((k) => [k.key, k.value]))
}

function money(v: Values, leads: number, approves: number): MoneyFigures {
  const sales = n(v.revenue)
  const profit = n(v.income)
  return {
    ads: n(v.ad_spend),
    cogs: n(v.cogs),
    cc: n(v.call_center),
    packaging: n(v.packaging),
    returns: n(v.returns),
    costs: n(v.costs),
    sales,
    profit,
    buyer: n(v.team_income),
    owner: n(v.viewer_income),
    marginRate: pct(profit, sales),
    orders: n(v.bought_out_orders),
    avgCheck: n(v.avg_check),
    leads,
    approves,
  }
}

function ratesOf(k: Values): Rates {
  return {
    roi: n(k.roi),
    romi: n(k.romi),
    marginRate: n(k.margin),
    approveRate: n(k.approve_rate),
    buyoutRate: n(k.buyout_rate),
    costPerLead: n(k.cpl),
    costPerApprove: n(k.cpa),
    costPerOrder: n(k.cpbo),
  }
}

const PLATFORMS: Record<string, PlatformId> = {
  facebook: "facebook",
  google_ads: "google",
  tiktok: "tiktok",
}

// The API splits confirmed / completed / rejected; the prototype calls the
// first of those "approved".
const CATEGORIES: Record<string, CategoryKey> = {
  confirmed: "approved",
  completed: "completed",
  rejected: "rejected",
}

export function toIncomeReport(
  api: ApiResponse,
  funnel: ApiResponse | null
): IncomeReport {
  const chart = api.data.chart
  const points = chart?.points ?? []
  // Leads and approvals are the orders breakdown's; the two share an axis, so
  // a point's counts come straight off the matching point there.
  const counts = (funnel?.data.chart?.points ?? []).map((p) => ({
    leads: n(p.values.leads),
    approves: n(p.values.confirmed) + n(p.values.completed) + n(p.values.rejected),
  }))
  const totalCounts = funnel ? kpisOf(funnel) : {}

  return {
    step: STEPS[chart?.step ?? "day"] ?? "day",
    points: points.map((point, i) => ({
      key: i,
      ...axisLabel(point.x),
      ...money(point.values, counts[i]?.leads ?? 0, counts[i]?.approves ?? 0),
    })),
    totals: money(
      totalsOf(chart?.series ?? []),
      n(totalCounts.leads),
      n(totalCounts.approved)
    ),
    rates: ratesOf(kpisOf(api)),
    platforms: (api.data.table?.rows ?? []).map((row) => {
      const rowMoney = money(
        { ...row.values, revenue: null, costs: null },
        n(row.values.leads),
        0
      )
      return {
        id: PLATFORMS[row.id] ?? "facebook",
        label: row.label ?? row.id,
        money: rowMoney,
        rates: {
          ...ratesOf({}),
          roi: n(row.values.roi),
          approveRate: n(row.values.approve_rate),
          buyoutRate: n(row.values.buyout_rate),
          costPerLead: n(row.values.cpl),
        },
      }
    }),
  }
}

export function toOrdersReport(api: ApiResponse): OrdersReport {
  const chart = api.data.chart
  const series = chart?.series ?? []
  const empty = (): Record<CategoryKey, StatusSlice[]> => ({
    completed: [],
    approved: [],
    rejected: [],
  })

  // key → which category it belongs to and what to call it
  const index = new Map<string, { category: CategoryKey; name: string }>()
  const statusTotals = empty()
  const counts: Record<CategoryKey, number> = {
    completed: 0,
    approved: 0,
    rejected: 0,
  }
  for (const s of series) {
    const category = CATEGORIES[s.key]
    if (!category) continue
    counts[category] = s.items.length
    for (const item of s.items) {
      const name = item.label ?? item.key
      index.set(item.key, { category, name })
      statusTotals[category].push({ name, value: n(item.total) })
    }
  }

  const totalsBySeries = totalsOf(series)
  const leads = n(totalsBySeries.leads)
  const approved = n(totalsBySeries.confirmed)
  const completed = n(totalsBySeries.completed)
  const rejected = n(totalsBySeries.rejected)
  const inWork = Math.max(0, leads - approved - completed - rejected)
  const kpis = kpisOf(api)

  return {
    step: STEPS[chart?.step ?? "day"] ?? "day",
    points: (chart?.points ?? []).map((point, i) => {
      const statuses = empty()
      for (const [key, value] of Object.entries(point.values)) {
        const known = index.get(key)
        if (known) statuses[known.category].push({ name: known.name, value: n(value) })
      }
      const a = n(point.values.confirmed)
      const c = n(point.values.completed)
      const r = n(point.values.rejected)
      const l = n(point.values.leads)
      return {
        key: i,
        ...axisLabel(point.x),
        leads: l,
        approved: a,
        completed: c,
        rejected: r,
        inWork: Math.max(0, l - a - c - r),
        statuses,
      }
    }),
    totals: { leads, approved, completed, rejected, inWork },
    statusTotals,
    counts,
    rates: {
      approveRate: n(kpis.approve_rate),
      buyoutRate: n(kpis.buyout_rate),
      rejectRate: pct(rejected, leads),
      inWorkRate: pct(inWork, leads),
    },
  }
}

function productMoney(v: Values) {
  const sales = n(v.revenue)
  const profit = n(v.income)
  return {
    ads: n(v.ad_spend),
    cogs: n(v.cogs),
    cc: 0,
    packaging: 0,
    returns: 0,
    costs: sales - profit,
    sales,
    profit,
  }
}

export function toProductsReport(api: ApiResponse): ProductsReport {
  const chart = api.data.chart
  const table = api.data.table
  const kpis = kpisOf(api)

  const products: ProductStat[] = (table?.rows ?? []).map((row) => {
    const m = productMoney(row.values)
    const sold = n(row.values.units)
    return {
      id: row.id,
      name: row.label ?? row.id,
      // no leads per product: an ad brings a lead, and which product it was for
      // is only known once the order exists
      leads: 0,
      approves: n(row.values.orders),
      sold,
      avgCheck: sold ? round(m.sales / sold) : 0,
      money: m,
      rates: {
        approveRate: 0,
        buyoutRate: n(row.values.buyout_rate),
        costPerLead: 0,
        roi: n(row.values.roi),
        marginRate: pct(m.profit, m.sales),
      },
    }
  })

  const totalsValues = totalsOf(chart?.series ?? [])
  const totalMoney = productMoney(totalsValues)
  const sold = n(totalsValues.bought_out_orders)

  const point = (values: Values) => {
    const m = productMoney(values)
    const orders = n(values.bought_out_orders)
    return {
      sales: m.sales,
      cogs: m.cogs,
      costs: m.costs,
      profit: m.profit,
      ads: m.ads,
      sold: orders,
      avgCheck: n(values.avg_check),
      costPerLead: 0,
      rates: {
        approveRate: 0,
        buyoutRate: 0,
        costPerLead: 0,
        roi: pct(m.profit, m.costs),
        marginRate: pct(m.profit, m.sales),
      },
    }
  }

  return {
    step: STEPS[chart?.step ?? "day"] ?? "day",
    points: (chart?.points ?? []).map((p, i) => ({
      key: i,
      ...axisLabel(p.x),
      ...point(p.values),
    })),
    products,
    totals: {
      leads: 0,
      approves: n(table?.totals.values.orders),
      sold,
      avgCheck: n(totalsValues.avg_check),
      money: totalMoney,
      rates: {
        approveRate: 0,
        buyoutRate: n(kpis.buyout_rate),
        costPerLead: 0,
        roi: n(kpis.roi),
        marginRate: n(kpis.margin),
      },
    },
  }
}
