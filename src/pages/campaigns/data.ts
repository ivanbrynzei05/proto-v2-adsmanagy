// Mock data + metric formulas for the campaigns table (UAH ₴).
// Ported from the original prototype's data.js — numbers are internally
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

// numeric metrics — everything the table can sort / total on
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
  portfolio: string
  platform: PlatformId
  campaign?: string
  group?: string
}

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

// raw inputs per campaign (the rest is computed)
const RAW: RawCampaign[] = [
  {
    name: "Масажер для шиї Neck Relax",
    active: true,
    leads: 1840,
    spend: 73600,
    approves: 712,
    impressions: 412000,
    clicks: 9100,
    avgCheck: 1290,
    margin: 520,
    cogs: 410,
    buyout: 0.66,
    buyerPct: 0.3,
  },
  {
    name: "Робот-пилосос CleanMax X9",
    active: true,
    leads: 1320,
    spend: 92400,
    approves: 488,
    impressions: 366000,
    clicks: 6700,
    avgCheck: 3490,
    margin: 1180,
    cogs: 1620,
    buyout: 0.59,
    buyerPct: 0.25,
  },
  {
    name: "Тример для бороди BarberPro",
    active: true,
    leads: 2410,
    spend: 67480,
    approves: 1010,
    impressions: 540000,
    clicks: 13200,
    avgCheck: 890,
    margin: 360,
    cogs: 240,
    buyout: 0.71,
    buyerPct: 0.3,
  },
  {
    name: "Корсет для постави PostureFix",
    active: true,
    leads: 980,
    spend: 31360,
    approves: 402,
    impressions: 248000,
    clicks: 5400,
    avgCheck: 740,
    margin: 310,
    cogs: 150,
    buyout: 0.63,
    buyerPct: 0.35,
  },
  {
    name: "Смарт-годинник FitWatch 7",
    active: true,
    leads: 1660,
    spend: 116200,
    approves: 560,
    impressions: 470000,
    clicks: 8900,
    avgCheck: 1990,
    margin: 690,
    cogs: 920,
    buyout: 0.55,
    buyerPct: 0.25,
  },
  {
    name: "Зволожувач повітря AromaMist",
    active: false,
    leads: 540,
    spend: 16740,
    approves: 196,
    impressions: 142000,
    clicks: 3100,
    avgCheck: 990,
    margin: 380,
    cogs: 300,
    buyout: 0.6,
    buyerPct: 0.3,
  },
  {
    name: "Набір кухонних ножів SharpEdge",
    active: true,
    leads: 1120,
    spend: 39200,
    approves: 470,
    impressions: 286000,
    clicks: 6100,
    avgCheck: 1150,
    margin: 470,
    cogs: 360,
    buyout: 0.68,
    buyerPct: 0.3,
  },
  {
    name: "Лампа-нічник MoonLight",
    active: true,
    leads: 760,
    spend: 19000,
    approves: 318,
    impressions: 198000,
    clicks: 4600,
    avgCheck: 640,
    margin: 280,
    cogs: 120,
    buyout: 0.64,
    buyerPct: 0.35,
  },
  {
    name: "Електросушарка для взуття DryStep",
    active: false,
    leads: 410,
    spend: 11070,
    approves: 158,
    impressions: 108000,
    clicks: 2400,
    avgCheck: 590,
    margin: 250,
    cogs: 110,
    buyout: 0.57,
    buyerPct: 0.3,
  },
  {
    name: "Масажний пістолет PulseGun",
    active: true,
    leads: 1290,
    spend: 90300,
    approves: 442,
    impressions: 352000,
    clicks: 7200,
    avgCheck: 2290,
    margin: 820,
    cogs: 1080,
    buyout: 0.58,
    buyerPct: 0.25,
  },
  {
    name: "Органайзер для авто CarTidy",
    active: true,
    leads: 880,
    spend: 22000,
    approves: 372,
    impressions: 210000,
    clicks: 5000,
    avgCheck: 690,
    margin: 300,
    cogs: 130,
    buyout: 0.69,
    buyerPct: 0.35,
  },
  {
    name: "Грілка USB WarmHands",
    active: false,
    leads: 330,
    spend: 8910,
    approves: 124,
    impressions: 96000,
    clicks: 2100,
    avgCheck: 540,
    margin: 230,
    cogs: 90,
    buyout: 0.61,
    buyerPct: 0.3,
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
  { id: "p1", name: "Бізнес-портфоліо «Основне»", primary: true },
  { id: "p2", name: "Бізнес-портфоліо «Тест-2»" },
  { id: "p3", name: "Бізнес-портфоліо «Преміум»" },
]
// which portfolio each RAW campaign belongs to
const PORTFOLIO_OF = [
  "p1",
  "p1",
  "p1",
  "p2",
  "p1",
  "p3",
  "p2",
  "p1",
  "p3",
  "p1",
  "p2",
  "p3",
]

// ---- ad accounts / platforms (data source) ----
export const PLATFORMS: Platform[] = [
  { id: "facebook", label: "Facebook", short: "f", color: "#1877F2" },
  { id: "google", label: "Google", short: "G", color: "#34A853" },
  { id: "tiktok", label: "TikTok", short: "T", color: "#EE1D52" },
]
const PLATFORM_OF: PlatformId[] = [
  "facebook",
  "google",
  "facebook",
  "tiktok",
  "facebook",
  "tiktok",
  "google",
  "facebook",
  "google",
  "facebook",
  "tiktok",
  "google",
]

export const CAMPAIGNS: Row[] = RAW.map((r, i) => ({
  ...compute(r),
  portfolio: PORTFOLIO_OF[i],
  platform: PLATFORM_OF[i],
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
  const short = r.name.split(" ").slice(0, 2).join(" ")
  const nGroups = 2 + (ci % 2) // 2 or 3 groups
  const gFracs = nGroups === 3 ? [0.45, 0.33, 0.22] : [0.6, 0.4]
  gFracs.forEach((gf, gi) => {
    const gRaw = scaleRaw(r, gf, {
      buyout: Math.min(0.86, Math.max(0.42, r.buyout + (gi - 1) * 0.03)),
    })
    gRaw.name = short + " · " + GROUP_LABELS[gi]
    AD_GROUPS.push({
      ...compute(gRaw),
      portfolio: PORTFOLIO_OF[ci],
      platform: PLATFORM_OF[ci],
      campaign: r.name,
    })
    const aFracs = [0.6, 0.4]
    aFracs.forEach((af, ai) => {
      const aRaw = scaleRaw(gRaw, af)
      aRaw.name =
        GROUP_LABELS[gi] + " · " + AD_LABELS[(gi + ai) % AD_LABELS.length]
      ADS.push({
        ...compute(aRaw),
        portfolio: PORTFOLIO_OF[ci],
        platform: PLATFORM_OF[ci],
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
