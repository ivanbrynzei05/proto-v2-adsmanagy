// Mock data + metric formulas for the campaigns table (UAH ₴).
// Ported from the original prototype's data.js - numbers are internally
// consistent so column toggles and totals look believable.

// ---- base settings (would come from "Налаштування") ----
const SETTINGS = {
  ccPerOrder: 20, // ₴ за оброблене замовлення
  ccUpsellPct: 0.2, // 20% від маржі допродажу
  packagingPerParcel: 15, // ₴ за запаковану посилку
  returnPrice: 70, // ₴ ціна повернення (ТТН)
  usdRate: 41.5, // курс для реклами
  defaultBuyout: 0.62, // стартовий % викупу
}

function round(n: number, d = 0) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

export type PlatformId = "facebook" | "google" | "tiktok"

export type Platform = {
  id: PlatformId
  label: string
  short: string
  color: string
}

export type Portfolio = {
  id: string
  name: string
  primary?: boolean
}

// A single ad account, which always belongs to one business + one platform.
export type AdAccount = {
  id: string
  name: string
  platform: PlatformId
  business: string // Portfolio (business account) id
}

// Whether ad spend could be tied to orders/products.
//  ok         – matched (UTM present or campaign named "<productId> - ...")
//  no_utm     – orders have no UTM tags for this campaign
//  no_product – campaign name does not start with a product id
export type MatchStatus = "ok" | "no_utm" | "no_product"

// numeric metrics - everything the table can sort / total on
export type MetricKey =
  | "leads"
  | "costPerLead"
  | "approves"
  | "approveRate"
  | "costPerApprove"
  | "spend"
  | "breakEvenLeadPrice"
  | "cpm"
  | "cpc"
  | "ctr"
  | "buyoutRate"
  | "returns"
  | "ccCost"
  | "packaging"
  | "probableIncome"
  | "buyerIncome"
  | "ownerIncome"
  | "roi"
  | "romi"

export type Row = Record<MetricKey, number> & {
  name: string
  active: boolean
  portfolio: string // business account id
  platform: PlatformId
  adAccount: string // ad account id
  match: MatchStatus
  campaign?: string
  group?: string
}

// Metrics that come from CRM / order data — they can only be computed once ad
// spend is matched to orders. When a row is unmatched these are shown as "—".
export const CRM_METRIC_KEYS: MetricKey[] = [
  "approves",
  "approveRate",
  "costPerApprove",
  "breakEvenLeadPrice",
  "buyoutRate",
  "returns",
  "ccCost",
  "packaging",
  "probableIncome",
  "buyerIncome",
  "ownerIncome",
  "roi",
  "romi",
]

export type ColumnGroup = "perf" | "money" | "derived"

export type Column = {
  key: MetricKey
  label: string
  unit: "" | "₴" | "%"
  group: ColumnGroup
  hint: string
  owner?: boolean
  emphasize?: boolean
}

type RawCampaign = {
  name: string
  // data source + product matching (was stored in parallel arrays before)
  platform: PlatformId
  adAccount: string
  portfolio: string
  match: MatchStatus
  active: boolean
  leads: number
  spend: number
  approves: number
  impressions: number
  clicks: number
  avgCheck: number
  margin: number
  cogs: number
  buyout: number
  buyerPct: number
}

// Product catalogue: a campaign whose name starts with one of these ids can be
// grouped and broken down by product. Names without an id can't be tied to a
// product, so the table warns about them instead of grouping them.
export const PRODUCTS: Record<string, string> = {
  "1042": "Масажер для шиї Neck Relax",
  "2087": "Робот-пилосос CleanMax X9",
  "3310": "Тример для бороди BarberPro",
  "4120": "Смарт-годинник FitWatch 7",
  "5006": "Корсет для постави PostureFix",
  "6033": "Набір кухонних ножів SharpEdge",
  "7008": "Електросушарка для взуття DryStep",
  "8102": "Органайзер для авто CarTidy",
}

// Pulls the leading product id out of a campaign name, e.g.
// "1042 - Neck Relax | FB" → { id: "1042", rest: "Neck Relax | FB" }.
// Names that don't start with an id return { id: null } and get a warning.
export function parseProductId(name: string): { id: string | null; rest: string } {
  const m = name.match(/^\s*#?(\d{3,6})\s*[-–—.:|·]\s*(.*\S)\s*$/)
  if (m) return { id: m[1], rest: m[2] }
  return { id: null, rest: name.trim() }
}

// raw inputs per campaign (the rest is computed). Several products now carry
// more than one campaign (same id prefix) so the table can group them; a few
// have no id prefix on purpose to demo the "no product breakdown" warning.
const RAW: RawCampaign[] = [
  // ── product 1042 · Масажер для шиї Neck Relax — 3 campaigns ──
  {
    name: "1042 - Neck Relax | FB широка",
    platform: "facebook", adAccount: "fb_neo", portfolio: "p1", match: "ok",
    active: true,
    leads: 920, spend: 35300, approves: 372, impressions: 205000, clicks: 4600,
    avgCheck: 1290, margin: 520, cogs: 410, buyout: 0.67, buyerPct: 0.3,
  },
  {
    name: "1042 - Neck Relax | Google пошук",
    platform: "google", adAccount: "g_neo", portfolio: "p1", match: "ok",
    active: true,
    leads: 610, spend: 26100, approves: 236, impressions: 128000, clicks: 2900,
    avgCheck: 1290, margin: 520, cogs: 410, buyout: 0.64, buyerPct: 0.3,
  },
  {
    name: "1042 - Neck Relax | TikTok відео",
    platform: "tiktok", adAccount: "tt_test", portfolio: "p2", match: "ok",
    active: false,
    leads: 310, spend: 12200, approves: 104, impressions: 79000, clicks: 1600,
    avgCheck: 1290, margin: 520, cogs: 410, buyout: 0.63, buyerPct: 0.3,
  },
  // ── product 2087 · Робот-пилосос CleanMax X9 — 2 campaigns ──
  {
    name: "2087 - CleanMax X9 | FB ретаргет",
    platform: "facebook", adAccount: "fb_neo2", portfolio: "p1", match: "ok",
    active: true,
    leads: 720, spend: 50100, approves: 268, impressions: 198000, clicks: 3600,
    avgCheck: 3490, margin: 1180, cogs: 1620, buyout: 0.6, buyerPct: 0.25,
  },
  {
    name: "2087 - CleanMax X9 | Google",
    platform: "google", adAccount: "g_prem", portfolio: "p3", match: "ok",
    active: true,
    leads: 600, spend: 42300, approves: 220, impressions: 168000, clicks: 3100,
    avgCheck: 3490, margin: 1180, cogs: 1620, buyout: 0.58, buyerPct: 0.25,
  },
  // ── product 3310 · Тример для бороди BarberPro — 2 campaigns ──
  {
    name: "3310 - BarberPro | FB широка",
    platform: "facebook", adAccount: "fb_neo", portfolio: "p1", match: "ok",
    active: true,
    leads: 1400, spend: 39200, approves: 588, impressions: 314000, clicks: 7700,
    avgCheck: 890, margin: 360, cogs: 240, buyout: 0.72, buyerPct: 0.3,
  },
  {
    name: "3310 - BarberPro | TikTok",
    platform: "tiktok", adAccount: "tt_prem", portfolio: "p3", match: "ok",
    active: true,
    leads: 1010, spend: 28280, approves: 422, impressions: 226000, clicks: 5500,
    avgCheck: 890, margin: 360, cogs: 240, buyout: 0.7, buyerPct: 0.3,
  },
  // ── single-campaign products (unique id, shown with a product chip) ──
  {
    name: "5006 - Корсет для постави PostureFix",
    platform: "facebook", adAccount: "fb_neo", portfolio: "p1", match: "ok",
    active: true,
    leads: 980, spend: 31360, approves: 402, impressions: 248000, clicks: 5400,
    avgCheck: 740, margin: 310, cogs: 150, buyout: 0.63, buyerPct: 0.35,
  },
  {
    name: "4120 - Смарт-годинник FitWatch 7",
    platform: "facebook", adAccount: "fb_neo", portfolio: "p1", match: "ok",
    active: true,
    leads: 1660, spend: 116200, approves: 560, impressions: 470000, clicks: 8900,
    avgCheck: 1990, margin: 690, cogs: 920, buyout: 0.55, buyerPct: 0.25,
  },
  {
    name: "6033 - Набір ножів SharpEdge",
    platform: "google", adAccount: "g_test", portfolio: "p2", match: "ok",
    active: true,
    leads: 1120, spend: 39200, approves: 470, impressions: 286000, clicks: 6100,
    avgCheck: 1150, margin: 470, cogs: 360, buyout: 0.68, buyerPct: 0.3,
  },
  {
    name: "7008 - Сушарка для взуття DryStep",
    platform: "google", adAccount: "g_prem", portfolio: "p3", match: "ok",
    active: false,
    leads: 410, spend: 11070, approves: 158, impressions: 108000, clicks: 2400,
    avgCheck: 590, margin: 250, cogs: 110, buyout: 0.57, buyerPct: 0.3,
  },
  {
    name: "8102 - Органайзер CarTidy",
    platform: "tiktok", adAccount: "tt_test", portfolio: "p2", match: "ok",
    active: true,
    leads: 880, spend: 22000, approves: 372, impressions: 210000, clicks: 5000,
    avgCheck: 690, margin: 300, cogs: 130, buyout: 0.69, buyerPct: 0.35,
  },
  // ── campaigns with NO product id up front — can't be split by product ──
  {
    name: "Розпродаж тижня — мікс товарів",
    platform: "facebook", adAccount: "fb_neo2", portfolio: "p1", match: "no_product",
    active: true,
    leads: 1450, spend: 40600, approves: 300, impressions: 300000, clicks: 7000,
    avgCheck: 850, margin: 300, cogs: 200, buyout: 0.55, buyerPct: 0.3,
  },
  {
    name: "Масажний пістолет PulseGun",
    platform: "google", adAccount: "g_prem", portfolio: "p3", match: "no_product",
    active: true,
    leads: 1290, spend: 90300, approves: 442, impressions: 352000, clicks: 7200,
    avgCheck: 2290, margin: 820, cogs: 1080, buyout: 0.58, buyerPct: 0.25,
  },
  {
    name: "Зволожувач повітря AromaMist",
    platform: "tiktok", adAccount: "tt_prem", portfolio: "p3", match: "no_product",
    active: false,
    leads: 540, spend: 16740, approves: 196, impressions: 142000, clicks: 3100,
    avgCheck: 990, margin: 380, cogs: 300, buyout: 0.6, buyerPct: 0.3,
  },
]

type Computed = Record<MetricKey, number> & { name: string; active: boolean }

function compute(r: RawCampaign): Computed {
  const s = SETTINGS
  const { leads, approves, spend } = r

  const costPerLead = spend / leads
  const approveRate = (approves / leads) * 100
  const costPerApprove = spend / approves

  const cpm = (spend / r.impressions) * 1000
  const cpc = spend / r.clicks
  const ctr = (r.clicks / r.impressions) * 100

  const buyoutRate = r.buyout * 100
  const buyoutOrders = approves * r.buyout
  const refusals = approves - buyoutOrders

  // витрати
  const returns = refusals * s.returnPrice
  const ccCost =
    approves * s.ccPerOrder + r.margin * approves * s.ccUpsellPct * 0.15
  const packaging = approves * s.packagingPerParcel // забрані + повернені = всі апруви
  const cogsTotal = r.cogs * buyoutOrders

  // доходи
  const marginBuyout = r.margin * buyoutOrders
  const probableIncome =
    marginBuyout - (spend + returns + ccCost + packaging + cogsTotal)
  const buyerIncome = probableIncome > 0 ? probableIncome * r.buyerPct : 0
  const ownerIncome = probableIncome - buyerIncome

  // точка беззбитковості ціни ліда
  const breakEvenLeadPrice =
    (marginBuyout - (returns + ccCost + packaging + cogsTotal)) / leads

  const totalSales = r.avgCheck * buyoutOrders
  const costsWithCogs = spend + returns + ccCost + packaging + cogsTotal
  const costsNoCogs = spend + returns + ccCost + packaging
  const roi = ((totalSales - costsWithCogs) / costsWithCogs) * 100
  const romi = ((marginBuyout - costsNoCogs) / costsNoCogs) * 100

  return {
    name: r.name,
    active: r.active,
    leads,
    costPerLead: round(costPerLead, 1),
    approves,
    approveRate: round(approveRate, 1),
    costPerApprove: round(costPerApprove, 1),
    spend: round(spend),
    breakEvenLeadPrice: round(breakEvenLeadPrice, 1),
    cpm: round(cpm, 1),
    cpc: round(cpc, 1),
    ctr: round(ctr, 2),
    buyoutRate: round(buyoutRate, 1),
    returns: round(returns),
    ccCost: round(ccCost),
    packaging: round(packaging),
    probableIncome: round(probableIncome),
    buyerIncome: round(buyerIncome),
    ownerIncome: round(ownerIncome),
    roi: round(roi, 1),
    romi: round(romi, 1),
  }
}

// ---- business portfolios (data source) ----
export const PORTFOLIOS: Portfolio[] = [
  { id: "p1", name: "Бізнес-акаунт «Основний»", primary: true },
  { id: "p2", name: "Бізнес-акаунт «Тест-2»" },
  { id: "p3", name: "Бізнес-акаунт «Преміум»" },
]
// ---- ad accounts / platforms (data source) ----
export const PLATFORMS: Platform[] = [
  { id: "facebook", label: "Facebook", short: "f", color: "#1877F2" },
  { id: "google", label: "Google", short: "G", color: "#34A853" },
  { id: "tiktok", label: "TikTok", short: "T", color: "#EE1D52" },
]

// ---- ad accounts (each sits under one business + one platform) ----
export const AD_ACCOUNTS: AdAccount[] = [
  { id: "fb_neo", name: "Neo Ads · Facebook", platform: "facebook", business: "p1" },
  { id: "fb_neo2", name: "Neo Ads · Facebook 2", platform: "facebook", business: "p1" },
  { id: "g_neo", name: "Neo Ads · Google", platform: "google", business: "p1" },
  { id: "g_test", name: "Тест-кабінет · Google", platform: "google", business: "p2" },
  { id: "tt_test", name: "Тест-кабінет · TikTok", platform: "tiktok", business: "p2" },
  { id: "g_prem", name: "Prime · Google", platform: "google", business: "p3" },
  { id: "tt_prem", name: "Prime · TikTok", platform: "tiktok", business: "p3" },
]

export const CAMPAIGNS: Row[] = RAW.map((r) => ({
  ...compute(r),
  portfolio: r.portfolio,
  platform: r.platform,
  adAccount: r.adAccount,
  match: r.match,
}))

// ---- ad groups & ads (drill-down entities under a campaign) ----
// scale a RAW campaign's count fields by a fraction; rate-like fields stay
function scaleRaw(
  r: RawCampaign,
  frac: number,
  overrides?: Partial<RawCampaign>
): RawCampaign {
  return {
    ...r,
    leads: Math.max(1, Math.round(r.leads * frac)),
    spend: Math.round(r.spend * frac),
    approves: Math.max(1, Math.round(r.approves * frac)),
    impressions: Math.round(r.impressions * frac),
    clicks: Math.round(r.clicks * frac),
    ...overrides,
  }
}

const GROUP_LABELS = ["Широка аудиторія", "Lookalike 3%", "Ретаргетинг"]
const AD_LABELS = ["Відео 15с", "Каруселя", "Статика", "Сторіс"]

export const AD_GROUPS: Row[] = []
export const ADS: Row[] = []

RAW.forEach((r, ci) => {
  // keep the product id (if any) as a prefix so child rows stay tied to it,
  // then a short readable stem for the group / ad names
  const { id, rest } = parseProductId(r.name)
  const prefix = id ? id + " - " : ""
  const short = rest.split(" ").slice(0, 2).join(" ")
  const nGroups = 2 + (ci % 2) // 2 or 3 groups
  const gFracs = nGroups === 3 ? [0.45, 0.33, 0.22] : [0.6, 0.4]
  gFracs.forEach((gf, gi) => {
    const gRaw = scaleRaw(r, gf, {
      buyout: Math.min(0.86, Math.max(0.42, r.buyout + (gi - 1) * 0.03)),
    })
    gRaw.name = prefix + short + " · " + GROUP_LABELS[gi]
    AD_GROUPS.push({
      ...compute(gRaw),
      portfolio: r.portfolio,
      platform: r.platform,
      adAccount: r.adAccount,
      match: r.match,
      campaign: r.name,
    })
    const aFracs = [0.6, 0.4]
    aFracs.forEach((af, ai) => {
      const aRaw = scaleRaw(gRaw, af)
      aRaw.name =
        prefix + GROUP_LABELS[gi] + " · " + AD_LABELS[(gi + ai) % AD_LABELS.length]
      ADS.push({
        ...compute(aRaw),
        portfolio: r.portfolio,
        platform: r.platform,
        adAccount: r.adAccount,
        match: r.match,
        campaign: r.name,
        group: gRaw.name,
      })
    })
  })
})

// ---- column definitions for the campaign table ----
// group: perf | money | derived (used by the "Стовпці" dropdown)
export const COLUMNS: Column[] = [
  {
    key: "leads",
    label: "Ліди",
    unit: "",
    group: "perf",
    hint: "Кількість лідів з рекламного кабінету",
  },
  {
    key: "costPerLead",
    label: "Ціна ліда",
    unit: "₴",
    group: "perf",
    hint: "Сума витрат / кількість лідів",
  },
  {
    key: "approves",
    label: "Апрув",
    unit: "",
    group: "perf",
    hint: "Підтверджені замовлення з певних статусів СРМ",
  },
  {
    key: "approveRate",
    label: "% апруву",
    unit: "%",
    group: "perf",
    hint: "Апрув / ліди × 100",
  },
  {
    key: "costPerApprove",
    label: "Ціна апруву",
    unit: "₴",
    group: "perf",
    hint: "Сума витрат / кількість апрувів",
  },
  {
    key: "spend",
    label: "Сума витрат",
    unit: "₴",
    group: "money",
    hint: "Загальна сума витрат на рекламу (ADS)",
  },
  {
    key: "breakEvenLeadPrice",
    label: "Ціна ліда в 0",
    unit: "₴",
    group: "derived",
    hint: "Ціна ліда для виходу в нуль",
  },
  {
    key: "cpm",
    label: "CPM",
    unit: "₴",
    group: "perf",
    hint: "Ціна за 1000 показів (ADS)",
  },
  {
    key: "cpc",
    label: "CPC",
    unit: "₴",
    group: "perf",
    hint: "Ціна за клік (ADS)",
  },
  {
    key: "ctr",
    label: "CTR",
    unit: "%",
    group: "perf",
    hint: "Клікабельність (ADS)",
  },
  {
    key: "buyoutRate",
    label: "% викупу",
    unit: "%",
    group: "money",
    hint: "Викуплені / апрувнуті × 100",
  },
  {
    key: "returns",
    label: "Повернення",
    unit: "₴",
    group: "money",
    hint: "Відмови × ціна повернення (ТТН)",
  },
  {
    key: "ccCost",
    label: "Витрати на КЦ",
    unit: "₴",
    group: "money",
    hint: "Обробка замовлень + % від маржі допродажу",
  },
  {
    key: "packaging",
    label: "Пакування",
    unit: "₴",
    group: "money",
    hint: "Витрати на склад / пакування посилок",
  },
  {
    key: "probableIncome",
    label: "Ймовірний дохід",
    unit: "₴",
    group: "derived",
    hint: "Маржа викупу − усі супутні витрати",
  },
  {
    key: "buyerIncome",
    label: "Дохід баєра",
    unit: "₴",
    group: "derived",
    hint: "Ймовірний дохід × % ЗП баєра",
  },
  {
    key: "ownerIncome",
    label: "Дохід овнера",
    unit: "₴",
    group: "derived",
    owner: true,
    hint: "Ймовірний дохід − дохід баєра",
  },
  {
    key: "roi",
    label: "ROI",
    unit: "%",
    group: "derived",
    emphasize: true,
    hint: "Рентабельність з урахуванням собівартості",
  },
  {
    key: "romi",
    label: "ROMI",
    unit: "%",
    group: "derived",
    emphasize: true,
    hint: "Рентабельність без собівартості товару",
  },
]

export const COL_GROUPS: { id: ColumnGroup; label: string }[] = [
  { id: "perf", label: "Результативність" },
  { id: "money", label: "Гроші та витрати" },
  { id: "derived", label: "Розрахунки" },
]

export const PRESETS: Record<string, ColumnGroup[] | null> = {
  "Усі стовпці": null,
  Результативність: ["perf"],
  Гроші: ["money"],
  Розрахунки: ["derived"],
}

export const DATE_PRESETS = [
  "Сьогодні",
  "Вчора",
  "Останні 7 днів",
  "Останні 30 днів",
  "Цей місяць",
  "Макс.",
]

// ---- totals for the campaign table footer ----
export function totals(rows: Row[]): Record<MetricKey, number> {
  const sum = (k: MetricKey) => rows.reduce((a, r) => a + (r[k] || 0), 0)
  const n = rows.length || 1
  const leads = sum("leads")
  const approves = sum("approves")
  const spend = sum("spend")
  return {
    leads,
    costPerLead: round(spend / leads, 1),
    approves,
    approveRate: round((approves / leads) * 100, 1),
    costPerApprove: round(spend / approves, 1),
    spend,
    breakEvenLeadPrice: round(sum("breakEvenLeadPrice") / n, 1),
    cpm: round(sum("cpm") / n, 1),
    cpc: round(sum("cpc") / n, 1),
    ctr: round(sum("ctr") / n, 2),
    buyoutRate: round(sum("buyoutRate") / n, 1),
    returns: sum("returns"),
    ccCost: sum("ccCost"),
    packaging: sum("packaging"),
    probableIncome: sum("probableIncome"),
    buyerIncome: sum("buyerIncome"),
    ownerIncome: sum("ownerIncome"),
    roi: round(sum("roi") / n, 1),
    romi: round(sum("romi") / n, 1),
  }
}

// ---- formatting helpers (narrow no-break space grouping, like the prototype) ----
const NB = " " // narrow no-break space

function groupNum(n: number) {
  const neg = n < 0
  n = Math.abs(Math.round(n))
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB)
  return (neg ? "−" : "") + s
}

export function fmt(val: number | null | undefined, unit: Column["unit"]) {
  if (val === null || val === undefined) return "-"
  if (unit === "₴") return groupNum(val) + NB + "₴"
  if (unit === "%")
    return val.toLocaleString("uk", { maximumFractionDigits: 2 }) + "%"
  if (!Number.isInteger(val))
    return val.toLocaleString("uk", { maximumFractionDigits: 2 })
  return groupNum(val)
}
