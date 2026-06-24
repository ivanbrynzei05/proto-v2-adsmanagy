// Mock data for the AdsMetry dashboard prototype (UAH ₴).
// Adapted from the original prototype - numbers are illustrative.

export type KpiKey =
  | "leads"
  | "approves"
  | "approveRate"
  | "spend"
  | "income"
  | "roi"

export type Kpi = {
  key: KpiKey
  label: string
  value: string
  delta: number
}

export const KPIS: Kpi[] = [
  { key: "leads", label: "Ліди", value: "8 442", delta: 12 },
  { key: "approves", label: "Апрув", value: "3 871", delta: 8 },
  { key: "approveRate", label: "% апруву", value: "45.9%", delta: 3 },
  { key: "spend", label: "Витрати", value: "612 К₴", delta: 6 },
  { key: "income", label: "Ймов. дохід", value: "284 К₴", delta: 18 },
  { key: "roi", label: "ROI", value: "94%", delta: -4 },
]

export type LeadsDay = { day: string; approved: number; raw: number }

export const LEADS_BY_DAY: LeadsDay[] = [
  { day: "Пн", approved: 980, raw: 540 },
  { day: "Вт", approved: 1120, raw: 610 },
  { day: "Ср", approved: 1040, raw: 480 },
  { day: "Чт", approved: 1290, raw: 700 },
  { day: "Пт", approved: 1410, raw: 760 },
  { day: "Сб", approved: 870, raw: 420 },
  { day: "Нд", approved: 760, raw: 380 },
]

export type CallCenter = {
  name: string
  approves: number
  avgMargin: number
  upsell: number
}

export const CALL_CENTERS: CallCenter[] = [
  { name: "КЦ «Альфа»", approves: 2140, avgMargin: 540, upsell: 28.4 },
  { name: "КЦ «Вектор»", approves: 1870, avgMargin: 510, upsell: 24.1 },
  { name: "КЦ «Лідер»", approves: 1520, avgMargin: 470, upsell: 21.7 },
  { name: "КЦ «Контакт»", approves: 1180, avgMargin: 430, upsell: 18.2 },
]

export type Buyer = {
  name: string
  initials: string
  leads: number
  approves: number
  roi: number
}

export const BUYERS: Buyer[] = [
  {
    name: "Олег Кравець",
    initials: "ОК",
    leads: 4820,
    approves: 1980,
    roi: 142,
  },
  {
    name: "Ірина Соболь",
    initials: "ІС",
    leads: 4110,
    approves: 1720,
    roi: 128,
  },
  {
    name: "Дмитро Левченко",
    initials: "ДЛ",
    leads: 3640,
    approves: 1410,
    roi: 96,
  },
  {
    name: "Марина Гнатюк",
    initials: "МГ",
    leads: 2980,
    approves: 1190,
    roi: 88,
  },
  { name: "Андрій Бойко", initials: "АБ", leads: 2510, approves: 940, roi: 61 },
  {
    name: "Світлана Руденко",
    initials: "СР",
    leads: 2280,
    approves: 870,
    roi: 104,
  },
  {
    name: "Тарас Мельник",
    initials: "ТМ",
    leads: 1990,
    approves: 760,
    roi: 73,
  },
  {
    name: "Юлія Захарчук",
    initials: "ЮЗ",
    leads: 1740,
    approves: 690,
    roi: 55,
  },
]

export type Product = {
  name: string
  orders: number
  sales: number
  buyout: number
  income: number
  roi: number
}

export const PRODUCTS: Product[] = [
  {
    name: "Тример для бороди BarberPro",
    orders: 1010,
    sales: 638_000,
    buyout: 71,
    income: 142_000,
    roi: 118,
  },
  {
    name: "Масажер для шиї Neck Relax",
    orders: 712,
    sales: 606_000,
    buyout: 66,
    income: 121_000,
    roi: 104,
  },
  {
    name: "Набір ножів SharpEdge",
    orders: 470,
    sales: 367_000,
    buyout: 68,
    income: 88_000,
    roi: 96,
  },
  {
    name: "Органайзер для авто CarTidy",
    orders: 372,
    sales: 177_000,
    buyout: 69,
    income: 52_000,
    roi: 74,
  },
  {
    name: "Корсет PostureFix",
    orders: 402,
    sales: 187_000,
    buyout: 63,
    income: 41_000,
    roi: 58,
  },
  {
    name: "Робот-пилосос CleanMax X9",
    orders: 488,
    sales: 1_005_000,
    buyout: 59,
    income: -34_000,
    roi: -12,
  },
]

// ---- formatting helpers ----
const nf = new Intl.NumberFormat("uk-UA")

export const fmtNum = (n: number) => nf.format(n)

export function fmtMoney(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000) return `${nf.format(Math.round(n / 1000))} К₴`
  return `${nf.format(n)} ₴`
}

// stable avatar color (same palette + hash as the prototype)
const AVATAR_COLORS = [
  "#d97757",
  "#5b8def",
  "#46a17a",
  "#b06fd1",
  "#d9a13a",
  "#5fb0b3",
]

export function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
