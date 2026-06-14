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

export type ConnectedAdAccounts = Partial<Record<AdPlatform["name"], AdAccount[]>>

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

export type ConnectedCrm = {
  type: CrmType
  label: string
  acceptedOrderStatus?: string
  completedOrderStatus?: string
}

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
