/**
 * The wallet ledger, shaped like GET /api/v1/wallet/transactions, and the
 * top-up statuses of GET /api/v1/wallet/topups/{uuid}. Demo data only.
 */

export type TransactionType =
  | "topup"
  | "subscription_charge"
  | "refund"
  | "adjustment"

export type ReferenceType =
  | "subscription"
  | "subscription_addon"
  | "wallet_topup"
  | null

export type LedgerEntry = {
  id: number
  type: TransactionType
  /** signed: plus into the balance, minus out of it */
  amount: number
  balance_after: number
  reference_type: ReferenceType
  created_at: string
}

/** what the backend puts in ?status= when the payer comes back from WayForPay */
export type TopupStatus = "approved" | "pending" | "declined" | "expired"

export const TOPUP_MIN = 1
export const TOPUP_MAX = 100_000

/** a row's label comes from type + reference_type - the backend sends nothing else */
export function entryTitle(entry: LedgerEntry): string {
  switch (entry.type) {
    case "topup":
      return "Поповнення балансу"
    case "subscription_charge":
      return entry.reference_type === "subscription_addon"
        ? "Додаткові ліміти"
        : "Оплата тарифу"
    case "refund":
      return "Повернення коштів"
    case "adjustment":
      return "Коригування балансу"
  }
}

type Step = Pick<LedgerEntry, "type" | "amount" | "reference_type">

function stepAt(i: number): Step {
  if (i === 6)
    return { type: "refund", amount: -50, reference_type: "wallet_topup" }
  if (i === 12) return { type: "adjustment", amount: 15, reference_type: null }
  switch (i % 5) {
    case 0:
    case 4:
      return {
        type: "subscription_charge",
        amount: -29,
        reference_type: "subscription",
      }
    case 1:
      return {
        type: "subscription_charge",
        amount: -4,
        reference_type: "subscription_addon",
      }
    case 2:
      return { type: "topup", amount: 50, reference_type: "wallet_topup" }
    default:
      return {
        type: "subscription_charge",
        amount: -9,
        reference_type: "subscription_addon",
      }
  }
}

/** newest first, walked back from the $85 the balance card opens on */
export const LEDGER: LedgerEntry[] = (() => {
  const count = 43
  const newest = new Date(2026, 8, 2, 10, 15)
  const rows: LedgerEntry[] = []
  let balance = 85
  for (let i = 0; i < count; i++) {
    // the oldest row is the first top-up, so the walk ends at an empty wallet
    const step: Step =
      i === count - 1
        ? { type: "topup", amount: balance, reference_type: "wallet_topup" }
        : stepAt(i)
    const at = new Date(newest)
    at.setDate(at.getDate() - i * 7 - (i % 3))
    at.setHours(9 + ((i * 5) % 10), (i * 17) % 60)
    rows.push({
      id: 5000 - i,
      ...step,
      balance_after: balance,
      created_at: at.toISOString(),
    })
    balance -= step.amount
  }
  return rows
})()

export function formatAmount(value: number) {
  return `$${value.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatSigned(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatAmount(Math.abs(value))}`
}

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})
const timeFormat = new Intl.DateTimeFormat("uk-UA", {
  hour: "2-digit",
  minute: "2-digit",
})

export function formatLedgerDate(iso: string) {
  const at = new Date(iso)
  return { date: dateFormat.format(at), time: timeFormat.format(at) }
}

/** the same limits POST /wallet/topups enforces; null when the sum is fine */
export function validateTopupAmount(raw: string): string | null {
  if (!raw) return null
  if (!/^\d+([.,]\d{0,2})?$/.test(raw))
    return "Не більше двох знаків після коми"
  const value = Number(raw.replace(",", "."))
  if (value < TOPUP_MIN) return `Мінімальна сума - ${formatAmount(TOPUP_MIN)}`
  if (value > TOPUP_MAX) return `Максимальна сума - ${formatAmount(TOPUP_MAX)}`
  return null
}
