/**
 * Payment history for the balance screen.
 *
 * The prototype has no billing back end, so the ledger is generated once from a
 * fixed seed: the rows are the same on every reload, which keeps the paging and
 * the running balance believable while there is nothing to fetch.
 */

export type PaymentStatus = "paid" | "pending" | "failed"

export type Payment = {
  id: string
  /** when the charge was made - newest first in the table */
  date: Date
  kind: string
  method: string
  amount: number
  status: PaymentStatus
}

export const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Оплачено",
    className:
      "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  pending: {
    label: "В обробці",
    className:
      "bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  failed: {
    label: "Відхилено",
    className: "bg-destructive/10 text-destructive",
  },
}

const KINDS = [
  "Поповнення балансу",
  "Підписка Pro",
  "Підписка Pro",
  "Додаткові кабінети",
  "Поповнення балансу",
  "Додаткові користувачі",
] as const

const METHODS = [
  "Visa •••• 4242",
  "Mastercard •••• 7781",
  "Visa •••• 4242",
  "Apple Pay",
] as const

const AMOUNTS = [29, 49, 100, 12, 200, 49, 15, 60] as const

/** the ledger starts here and walks backwards - fixed, so the demo never drifts */
const LEDGER_START = new Date(2026, 8, 2)

export const PAYMENTS: Payment[] = Array.from({ length: 43 }, (_, i) => {
  const date = new Date(LEDGER_START)
  date.setDate(date.getDate() - i * 8 - (i % 3))
  return {
    id: `INV-${2604 - i}`,
    date,
    kind: KINDS[i % KINDS.length],
    method: METHODS[i % METHODS.length],
    amount: AMOUNTS[i % AMOUNTS.length],
    // one failed and one still-clearing charge near the top, so every state is
    // on the first page; everything older settled
    status: i === 1 ? "pending" : i === 4 ? "failed" : "paid",
  }
})

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function formatPaymentDate(date: Date) {
  return dateFormat.format(date)
}

export function formatAmount(value: number) {
  return `$${value.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
