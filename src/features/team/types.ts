import {
  IconCrown,
  IconTargetArrow,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react"

// Who someone is inside the account. The owner is the account holder, a team
// lead runs a group of buyers, a buyer only ever sees their own traffic.
export type TeamRole = "owner" | "teamlead" | "buyer"

export type RoleInfo = {
  value: TeamRole
  label: string
  /** "Додати <баєра>" */
  accusative: string
  /** "Додає <баєрів>" */
  pluralGenitive: string
  icon: Icon
  /** what the role can do - shown as a bullet list under "Що значить {роль}:" */
  capabilities: string[]
  /** roles this one is allowed to add */
  canInvite: TeamRole[]
}

export const TEAM_ROLES: RoleInfo[] = [
  {
    value: "owner",
    label: "Овнер",
    accusative: "овнера",
    pluralGenitive: "овнерів",
    icon: IconCrown,
    capabilities: [
      "Весь акаунт: команда, інтеграції, тариф",
      "Усі кампанії команди",
      "Додає тімлідів і баєрів",
    ],
    canInvite: ["teamlead", "buyer"],
  },
  {
    value: "teamlead",
    label: "Тімлід",
    accusative: "тімліда",
    pluralGenitive: "тімлідів",
    icon: IconUsersGroup,
    capabilities: [
      "Кампанії, ліди та дохід своєї команди",
      "Додає баєрів",
      "Без доступу до тарифу й інтеграцій",
    ],
    canInvite: ["buyer"],
  },
  {
    value: "buyer",
    label: "Баєр",
    accusative: "баєра",
    pluralGenitive: "баєрів",
    icon: IconTargetArrow,
    capabilities: [
      "Додавати рекламні акаунти",
      "Переглядати свої кампанії та свій дохід за відсотком",
      "Без доступу до чужої статистики й налаштувань",
    ],
    canInvite: [],
  },
]

export function roleInfo(role: TeamRole): RoleInfo {
  return TEAM_ROLES.find((r) => r.value === role) ?? TEAM_ROLES[0]
}

// The account owner is not one of the rows - this is the list of people they
// gave access to.
export type TeamMember = {
  id: string
  name: string
  email: string
  role: TeamRole
  /** office numbers, same idea as on a call centre - a member can sit in more than one */
  offices: string[]
  /** share of the profit the member earns, in percent */
  salaryPercent: string
  /** buyers only - ad accounts they run, assigned in Інтеграції */
  adAccounts: string
}

export const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: "lead-1",
    name: "Ірина Соболь",
    email: "iryna.sobol@adsmetry.io",
    role: "teamlead",
    offices: ["1", "2"],
    salaryPercent: "10",
    adAccounts: "",
  },
  {
    id: "buyer-1",
    name: "Олег Кравець",
    email: "oleh.kravets@adsmetry.io",
    role: "buyer",
    offices: ["1"],
    salaryPercent: "30",
    adAccounts: "6",
  },
  {
    id: "buyer-2",
    name: "Дмитро Левченко",
    email: "dmytro.levchenko@adsmetry.io",
    role: "buyer",
    offices: ["2"],
    salaryPercent: "25",
    adAccounts: "4",
  },
]

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export const MIN_PASSWORD_LENGTH = 8

// Readable password to hand over - the member changes it on first login.
export function generatePassword(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}
