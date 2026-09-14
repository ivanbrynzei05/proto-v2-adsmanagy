import { IconPlus, IconWallet } from "@tabler/icons-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentHistory } from "@/features/billing/payment-history"
import {
  PaymentResultDialog,
  type PaymentResult,
} from "@/features/billing/payment-result-dialog"
import {
  LEDGER,
  formatAmount,
  type LedgerEntry,
  type TopupStatus,
} from "@/features/billing/payments"
import { useSubscription } from "@/features/billing/subscription-context"
import { TopUpDialog } from "@/features/billing/top-up-dialog"

/** ?status= on the return URL decides the modal: approved is the only success */
function resultFromStatus(status: string | null): PaymentResult | null {
  if (status === "approved") return "success"
  if (status === "declined" || status === "expired" || status === "pending") {
    return "error"
  }
  return null
}

/**
 * Choose a sum, pay on WayForPay, come back to one modal that says whether it
 * worked - plus the ledger of everything the balance has been through.
 */
export function BalanceSection() {
  const { balance, topUp } = useSubscription()
  const [entries, setEntries] = useState<LedgerEntry[]>(LEDGER)
  const [dialog, setDialog] = useState<{ open: boolean; amount?: number }>({
    open: false,
  })
  const [searchParams, setSearchParams] = useSearchParams()
  const result = resultFromStatus(searchParams.get("status"))

  const setStatus = (status: TopupStatus | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (status) next.set("status", status)
        else next.delete("status")
        return next
      },
      { replace: true }
    )

  const openTopUp = (amount?: number) => setDialog({ open: true, amount })

  /** prototype only: the round trip to WayForPay, landing back on ?status= */
  const checkout = (amount: number, status: TopupStatus) => {
    setDialog({ open: false })
    if (status === "approved") {
      topUp(amount)
      setEntries((prev) => [
        {
          id: Date.now(),
          type: "topup",
          amount,
          balance_after: balance + amount,
          reference_type: "wallet_topup",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    }
    setStatus(status)
  }

  return (
    <div className="flex flex-col gap-4">
      <BalanceCard balance={balance} onTopUp={() => openTopUp()} />
      <PaymentHistory entries={entries} />

      <TopUpDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        initialAmount={dialog.amount}
        onCheckout={checkout}
      />
      <PaymentResultDialog
        result={result}
        onClose={() => setStatus(null)}
        onRetry={() => {
          setStatus(null)
          openTopUp()
        }}
      />
    </div>
  )
}

function BalanceCard({
  balance,
  onTopUp,
}: {
  balance: number
  onTopUp: () => void
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Баланс
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
            <IconWallet className="size-5 text-muted-foreground" />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight tabular-nums">
              {formatAmount(balance)}
            </span>
            <p className="text-xs text-muted-foreground">Доступно на балансі</p>
          </div>
        </div>
        <Button
          onClick={onTopUp}
          className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <IconPlus className="size-4" />
          Поповнити баланс
        </Button>
      </CardContent>
    </Card>
  )
}
