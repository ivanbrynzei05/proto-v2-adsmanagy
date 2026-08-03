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
// exactly one of these (or "ignore"). Several CRM statuses can share a bucket -
// e.g. a client often has many different "rejection" statuses.
export type CrmStatusCategoryKey =
  | "new"
  | "approved"
  | "completed"
  | "rejected"
  | "returned"
  | "shipped"

// Three levels, and only three: an account's hundred-odd statuses all boil down
// to "confirmed", "paid for" or "lost". `dot` colours the bucket marker, `tint`
// paints the status itself once it lands here, and `hint` is the "which statuses
// go here?" help next to the label.
export const CRM_STATUS_CATEGORIES: {
  key: CrmStatusCategoryKey
  label: string
  hint: string
  dot: string
  tint: string
  required?: boolean
}[] = [
  {
    key: "approved",
    label: "Підтверджені замовлення",
    hint: "Статуси, у яких клієнт підтвердив замовлення і воно пішло в роботу - від апруву до пакування та відправки. З них рахується апрув.",
    dot: "bg-emerald-500",
    tint: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    required: true,
  },
  {
    key: "completed",
    label: "Завершені замовлення",
    hint: "Статуси, у яких клієнт забрав замовлення. Саме з них рахується дохід і ROI, тому не змішуйте їх з відправленими.",
    dot: "bg-lime-500",
    tint: "border-lime-500/30 bg-lime-500/15 text-lime-700 dark:text-lime-400",
    required: true,
  },
  {
    key: "rejected",
    label: "Відмови",
    hint: "Статуси, у яких замовлення відмінилося: клієнт не забрав посилку, оформив повернення, посилка в дорозі назад і тд",
    dot: "bg-rose-500",
    tint: "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-400",
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
  // Kept so the connection can be reopened for editing with its fields filled in.
  apiKey?: string
  statuses?: CrmStatusOption[]
  statusMapping?: CrmStatusMapping
}

// Keyword heuristics behind the "auto-match" button. Order matters: the first
// rule whose pattern hits the status name wins, so ambiguous names are claimed
// by the most specific rule. A `null` key means "we recognise this family but
// deliberately don't guess" - it keeps a later, looser rule from grabbing it.
const AUTO_MATCH_RULES: {
  key: CrmStatusCategoryKey | null
  pattern: RegExp
}[] = [
  // Returns and swaps have no bucket of their own yet, so the user decides.
  // Listed first so "Повернення (завершено)" isn't read as a completed order.
  { key: null, pattern: /поверн|возврат|утиліз|дорозі додому|обмін/i },
  // Paperwork steps say nothing about the order itself. Before the "approved"
  // rule so "Друк ТТН" doesn't get pulled in by its ТТН keyword.
  { key: null, pattern: /чек|друк|принт/i },
  // Lost leads. Before the call-attempt rules so "Тотальний недозвон" isn't
  // read as just another dial attempt.
  {
    key: "rejected",
    pattern:
      /відмов|скасов|відхил|отказ|нелид|нелід|дубл|тотальн|нет товара|немає товару|поганий рейтинг|cancel|reject|decline/i,
  },
  {
    key: "completed",
    pattern: /заверш|виплач|викуп|выкуп|отримано|оплач|complete|done|paid/i,
  },
  // Confirmed, plus everything already moving through fulfilment.
  {
    key: "approved",
    pattern:
      /апрув|прийня|підтвер|approve|confirm|упаковк|запаков|ттн|по[шч]т|відправлен|отправлен|передано|самовив/i,
  },
]

// Best-guess bucket for a CRM status name, or null when nothing is confident.
export function autoMatchStatus(name: string): CrmStatusCategoryKey | null {
  for (const rule of AUTO_MATCH_RULES) {
    if (rule.pattern.test(name)) return rule.key
  }
  return null
}

// Mock of the status list a CRM returns once credentials check out. Real
// accounts run to a hundred-odd statuses, so the mock is a full one - the
// mapping UI has to stay usable at that size.
export const MOCK_CRM_STATUSES: CrmStatusOption[] = [
  { id: "3", name: "Новий" },
  { id: "52", name: "Ночь/Вайбер" },
  { id: "53", name: "НЕДОЗВОН 1Д" },
  { id: "96", name: "НЕДОЗВОН 2Д" },
  { id: "92", name: "АПРУВ поганий звязок" },
  { id: "54", name: "Прозвон(Дожим)" },
  { id: "74", name: "Упаковка" },
  { id: "88", name: "Запаковано (На відправку)" },
  { id: "118", name: "СТВОРИТИ ТТН" },
  { id: "11", name: "Прийнято" },
  { id: "80", name: "Передано пошті" },
  { id: "98", name: "Відправити пізніше" },
  { id: "56", name: "Перезвон" },
  { id: "13", name: "Отказ" },
  { id: "57", name: "Перезвон(Сегодня)" },
  { id: "95", name: "Перезвон (по дате)" },
  { id: "60", name: "Тотальний недозвон" },
  { id: "59", name: "Нелид" },
  { id: "97", name: "Дубль" },
  { id: "93", name: "Поганий рейтинг" },
  { id: "76", name: "НЗВ ВАЙБЕР" },
  { id: "62", name: "Нет товара" },
  { id: "55", name: "Китай" },
  { id: "75", name: "Очікування товару" },
  { id: "83", name: "УП дзвонимо" },
  { id: "72", name: "УКР ПОЧТА" },
  { id: "81", name: "УП 4Д" },
  { id: "82", name: "УП 6Д" },
  { id: "14", name: "Отправлен" },
  { id: "73", name: "ПЕРЕАДРЕСОВАТЬ(КЦ)" },
  { id: "63", name: "1Д-ОТД" },
  { id: "64", name: "2Д-ОТД" },
  { id: "65", name: "3Д-ОТД" },
  { id: "66", name: "4Д-ОТД" },
  { id: "67", name: "5Д-ОТД" },
  { id: "68", name: "6Д-ОТД" },
  { id: "69", name: "7Д-ОТД" },
  { id: "91", name: "НП без вайберу" },
  { id: "71", name: "На возврат" },
  { id: "70", name: "УЖЕ ЗБР(СО СЛОВ КЛИЕНТА)" },
  { id: "20", name: "Повернення товару (в дорозі)" },
  { id: "31", name: "Повернення (завершено)" },
  { id: "18", name: "Завершено" },
  { id: "94", name: "Завершено (виплачено)" },
  { id: "50", name: "Утилізація" },
  { id: "27", name: "Самовивіз" },
  { id: "32", name: "Обмін" },
  { id: "51", name: "В дорозі додому (гроші)" },
  { id: "77", name: "ТурбоСМС" },
  { id: "61", name: "ТУРБО СМС-ПРОЗВОН" },
  { id: "78", name: "ТурбоСМС - НО" },
  { id: "79", name: "ТурбоСМС-уточнение" },
  { id: "90", name: "Турбо СМС-Предоплата" },
  { id: "84", name: "ВАЙБЕР НЕЛИД" },
  { id: "85", name: "ВАЙБЕР ОТКАЗ" },
  { id: "86", name: "Чеки" },
  { id: "89", name: "Не друкується" },
  { id: "87", name: "Друк ТТН" },
  { id: "99", name: "Дозвон 1" },
  { id: "100", name: "Дозвон 2" },
  { id: "101", name: "Дозвон 3" },
  { id: "102", name: "Дозвон 4" },
  { id: "103", name: "Дозвон 5" },
  { id: "104", name: "Дозвон 6" },
  { id: "105", name: "Дозвон 7" },
  { id: "106", name: "Дозвон 8" },
  { id: "107", name: "Дозвон 9" },
  { id: "108", name: "Дозвон 10" },
  { id: "109", name: "Дозвон 11" },
  { id: "110", name: "Предоплата" },
  { id: "111", name: "ПРОЗВОН ДОЖИМУ" },
  { id: "112", name: "ПРОЗВОН ДОЖИМУ 2" },
  { id: "113", name: "ПРОЗВОН ДОЖИМУ 3" },
  { id: "114", name: "СМС ВАЙБЕР+" },
  { id: "115", name: "ДЛЯ ОТП ВАЙБЕР" },
  { id: "116", name: "ОФОРМЛЕННЯ ВАЙБЕР" },
  { id: "117", name: "НЗВ х3 ВАЙБЕР" },
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
