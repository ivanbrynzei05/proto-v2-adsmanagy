import { FacebookLogo, GoogleLogo, TiktokLogo } from "./logos"

export const AD_PLATFORMS = [
  { name: "Facebook Ads", icon: FacebookLogo },
  { name: "TikTok Ads", icon: TiktokLogo },
  { name: "Google Ads", icon: GoogleLogo },
] as const

export type AdPlatform = (typeof AD_PLATFORMS)[number]

export type AdAccount = {
  name: string
  manager: string
  accountId: string
  spend: string
}

export type ConnectedAdAccounts = Partial<
  Record<AdPlatform["name"], AdAccount[]>
>

export const MOCK_AD_ACCOUNTS: Record<AdPlatform["name"], AdAccount[]> = {
  "Facebook Ads": [
    {
      name: "Brand Awareness",
      manager: "Business Manager",
      accountId: "act_9910048227761803",
      spend: "₴ 31 000 / міс",
    },
    {
      name: "Retargeting",
      manager: "Business Manager",
      accountId: "act_9910048227761921",
      spend: "₴ 12 400 / міс",
    },
    {
      name: "Lookalike Audience",
      manager: "Business Manager",
      accountId: "act_9910048227762045",
      spend: "₴ 8 900 / міс",
    },
  ],
  "TikTok Ads": [
    {
      name: "Performance Max",
      manager: "TikTok Business Center",
      accountId: "act_5523109872341205",
      spend: "₴ 18 500 / міс",
    },
    {
      name: "Spark Ads",
      manager: "TikTok Business Center",
      accountId: "act_5523109872341378",
      spend: "₴ 9 200 / міс",
    },
  ],
  "Google Ads": [
    {
      name: "Search Campaign",
      manager: "Google Ads Manager",
      accountId: "act_7741098234561987",
      spend: "₴ 24 200 / міс",
    },
    {
      name: "Performance Max",
      manager: "Google Ads Manager",
      accountId: "act_7741098234562104",
      spend: "₴ 11 700 / міс",
    },
  ],
}

export function pluralizeKabinet(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "кабінет"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "кабінети"
  return "кабінетів"
}

export function pluralizeIntegration(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "інтеграція"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "інтеграції"
  return "інтеграцій"
}

export const CRM_TYPES = ["LP CRM", "Sales Drive"] as const
export type CrmType = (typeof CRM_TYPES)[number]

// A status exactly as the CRM API returns it: numeric id + human label.
export type CrmStatusOption = { id: string; name: string }

// The internal buckets our analytics understands. Every CRM status is mapped to
// exactly one of these (or "ignore"). Several CRM statuses can share a bucket —
// e.g. a client often has many different "rejection" statuses.
export type CrmStatusCategoryKey =
  | "new"
  | "approved"
  | "completed"
  | "rejected"
  | "returned"
  | "shipped"

export const CRM_STATUS_CATEGORIES: {
  key: CrmStatusCategoryKey
  label: string
  hint: string
  dot: string
  required?: boolean
}[] = [
  {
    key: "approved",
    label: "Підтвердженні замовлення",
    hint: "Підтверджені замовлення (апрув)",
    dot: "bg-emerald-500",
    required: true,
  },
  {
    key: "completed",
    label: "Завершені замовлення",
    hint: "Отримані та оплачені — це дохід",
    dot: "bg-lime-500",
    required: true,
  },
  {
    key: "rejected",
    label: "Відмови",
    hint: "Скасовані або непідтверджені",
    dot: "bg-rose-500",
  },
  {
    key: "new",
    label: "Замовлення в обробці",
    hint: "Щойно створені, ще в обробці",
    dot: "bg-violet-500",
  },
]

// Virtual bucket for statuses that shouldn't affect any analytics.
export const CRM_STATUS_IGNORE = "ignore" as const
export type CrmStatusBucket = CrmStatusCategoryKey | typeof CRM_STATUS_IGNORE

// crm status id -> bucket
export type CrmStatusMapping = Record<string, CrmStatusBucket>

export type ConnectedCrm = {
  type: CrmType
  label: string
  statuses?: CrmStatusOption[]
  statusMapping?: CrmStatusMapping
}

// Keyword heuristics behind the "auto-match" button. Order matters: the first
// rule whose pattern hits the status name wins, so the more specific buckets
// (returned) come before the looser ones (rejected).
const AUTO_MATCH_RULES: { key: CrmStatusCategoryKey; pattern: RegExp }[] = [
  { key: "returned", pattern: /поверн|return|refund/i },
  { key: "rejected", pattern: /відмов|скасов|відхил|cancel|reject|decline/i },
  { key: "approved", pattern: /прийн|підтвер|апрув|approve|confirm/i },
  {
    key: "completed",
    pattern: /заверш|викуп|выкуп|отрим|оплач|complete|done|paid|delivered/i,
  },
  { key: "shipped", pattern: /відправ|відвантаж|доставк|ship|sent/i },
  { key: "new", pattern: /нов|new|створ|оброб/i },
]

// Best-guess bucket for a CRM status name, or null when nothing is confident.
export function autoMatchStatus(name: string): CrmStatusCategoryKey | null {
  for (const rule of AUTO_MATCH_RULES) {
    if (rule.pattern.test(name)) return rule.key
  }
  return null
}

// Mock of the status list a CRM returns once credentials check out.
export const MOCK_CRM_STATUSES: CrmStatusOption[] = [
  { id: "3", name: "Новий" },
  { id: "11", name: "Прийнято" },
  { id: "14", name: "Відправлено" },
  { id: "18", name: "Завершено" },
  { id: "13", name: "Відмовлено" },
  { id: "32", name: "Обмін" },
  { id: "27", name: "Самовивіз" },
]

export const CRM_LOGO_COLORS: Record<CrmType, string> = {
  "LP CRM": "#6366F1",
  "Sales Drive": "#F97316",
}

export const CRM_LOGO_LETTERS: Record<CrmType, string> = {
  "LP CRM": "LP",
  "Sales Drive": "SD",
}

export function pluralizeCallCenter(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "колцентр"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "колцентри"
  return "колцентрів"
}

export const UPSELL_FEE_TYPES = [
  { value: "sum", label: "% від суми допродажу" },
  { value: "margin", label: "% від маржі допродажу" },
] as const

export type UpsellFeeType = (typeof UPSELL_FEE_TYPES)[number]["value"]

export type CallCenter = {
  name: string
  office: string
  confirmedOrderPrice: string
  upsellFeeType: UpsellFeeType
  upsellFeePercent: string
}
