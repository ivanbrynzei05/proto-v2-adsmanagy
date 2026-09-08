import {
  IconCheck,
  IconCircleCheckFilled,
  IconCreditCard,
  IconLoader2,
  IconWallet,
} from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { formatAmount } from "@/features/billing/payments"
import { cn } from "@/lib/utils"

const PRESETS = [50, 100, 250, 500] as const

/** what the ledger calls a charge made on the provider's page */
export const TOP_UP_METHOD = "Онлайн-оплата"

type Phase = "form" | "paying" | "done"

/**
 * Name a sum, then go and pay it.
 *
 * The card is chosen on the payment provider's own page, so this dialog only
 * settles the amount and hands off; the demo comes straight back with the
 * receipt, which takes over the same dialog rather than opening a second one -
 * the payment and its receipt are one act, and swapping the body keeps the new
 * balance in the place the reader was already looking.
 */
export function TopUpDialog({
  open,
  onOpenChange,
  balance,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance: number
  /** the demo charge went through - credit the balance and log the payment */
  onPaid: (amount: number) => void
}) {
  const [amount, setAmount] = useState<number>(PRESETS[1])
  const [custom, setCustom] = useState("")
  const [phase, setPhase] = useState<Phase>("form")

  // a dialog opened again is a new payment, not the last one's receipt - reset
  // during the render that opens it, so the form never flashes the old receipt
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setPhase("form")
      setAmount(PRESETS[1])
      setCustom("")
    }
  }

  const value = custom ? Number(custom) : amount
  const valid = Number.isFinite(value) && value >= 5

  const pay = () => {
    setPhase("paying")
    // in the real thing this is the redirect to the provider and the return
    // from it; the wait stands in for both
    setTimeout(() => {
      onPaid(value)
      setPhase("done")
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={phase !== "paying"}>
        {phase === "done" ? (
          <SuccessBody
            amount={value}
            balance={balance}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Поповнення балансу</DialogTitle>
              <DialogDescription>
                Поточний баланс {formatAmount(balance)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const active = !custom && preset === amount
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset)
                      setCustom("")
                    }}
                    className={cn(
                      "h-10 rounded-lg border text-sm font-semibold tabular-nums transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    ${preset}
                  </button>
                )
              })}
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                value={custom}
                inputMode="decimal"
                placeholder="Інша сума"
                onChange={(e) =>
                  setCustom(e.target.value.replace(/[^\d.]/g, ""))
                }
                className="h-10 pl-6"
              />
            </div>

            <Button
              size="lg"
              className="h-11 w-full gap-1.5 font-semibold"
              disabled={!valid || phase === "paying"}
              onClick={pay}
            >
              {phase === "paying" ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Перенаправлення…
                </>
              ) : (
                <>
                  <IconCreditCard className="size-4" />
                  Перейти до оплати{valid ? ` ${formatAmount(value)}` : ""}
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SuccessBody({
  amount,
  balance,
  onDone,
}: {
  amount: number
  balance: number
  onDone: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-5 pt-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
        <IconCircleCheckFilled className="size-9" />
      </div>
      <div>
        <DialogTitle className="text-lg">Оплата пройшла</DialogTitle>
        <DialogDescription className="mt-1">
          {formatAmount(amount)} зараховано на баланс
        </DialogDescription>
      </div>

      <div className="w-full rounded-xl border bg-muted/30 p-3 text-left">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <IconCreditCard className="size-4" />
            Оплата
          </span>
          <span className="font-medium tabular-nums">
            {formatAmount(amount)}
          </span>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <IconWallet className="size-4" />
            Баланс
          </span>
          <span className="font-semibold tabular-nums">
            {formatAmount(balance)}
          </span>
        </div>
      </div>

      <Button
        className="h-11 w-full gap-1.5 rounded-xl font-semibold"
        onClick={onDone}
      >
        Готово
        <IconCheck className="size-4" />
      </Button>
    </div>
  )
}
