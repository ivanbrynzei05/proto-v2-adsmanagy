import { IconCreditCard, IconLoader2 } from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  formatAmount,
  validateTopupAmount,
  type TopupStatus,
} from "@/features/billing/payments"
import { cn } from "@/lib/utils"

const PRESETS: readonly number[] = [5, 10, 20, 50]
const DEFAULT_PRESET = 10

/** name a sum and go to WayForPay; the outcome is shown once the payer is back */
export function TopUpDialog({
  open,
  onOpenChange,
  initialAmount,
  onCheckout,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "Спробувати ще" reopens the dialog on the sum that failed */
  initialAmount?: number
  /**
   * POST /wallet/topups answered with checkout_url - send the browser there.
   * Prototype: the status WayForPay would return; Option/Alt-click declines.
   */
  onCheckout: (amount: number, status: TopupStatus) => void
}) {
  const [preset, setPreset] = useState<number | null>(DEFAULT_PRESET)
  const [custom, setCustom] = useState("")
  const [redirecting, setRedirecting] = useState(false)

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      const isPreset =
        initialAmount !== undefined && PRESETS.includes(initialAmount)
      setPreset(
        initialAmount === undefined
          ? DEFAULT_PRESET
          : isPreset
            ? initialAmount
            : null
      )
      setCustom(
        initialAmount !== undefined && !isPreset ? String(initialAmount) : ""
      )
      setRedirecting(false)
    }
  }

  const customError = validateTopupAmount(custom)
  const value = custom ? Number(custom.replace(",", ".")) : (preset ?? 0)
  const valid = custom ? customError === null : preset !== null

  const pay = (declined: boolean) => {
    setRedirecting(true)
    setTimeout(() => onCheckout(value, declined ? "declined" : "approved"), 800)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!redirecting) onOpenChange(next)
      }}
    >
      <DialogContent
        className="max-w-md"
        showCloseButton={!redirecting}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Поповнення балансу</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((amount) => {
            const active = !custom && preset === amount
            return (
              <button
                key={amount}
                type="button"
                disabled={redirecting}
                onClick={() => {
                  setPreset(amount)
                  setCustom("")
                }}
                className={cn(
                  "h-10 rounded-lg border text-sm font-semibold tabular-nums transition-colors disabled:opacity-50",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                ${amount}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              value={custom}
              inputMode="decimal"
              placeholder="Інша сума"
              disabled={redirecting}
              aria-invalid={custom ? customError !== null : undefined}
              onChange={(e) =>
                setCustom(e.target.value.replace(/[^\d.,]/g, ""))
              }
              className="h-10 pl-6"
            />
          </div>
          {custom && customError && (
            <p className="text-xs text-destructive">{customError}</p>
          )}
        </div>

        <Button
          size="lg"
          className="h-11 w-full gap-1.5 font-semibold"
          disabled={!valid || redirecting}
          onClick={(e) => pay(e.altKey)}
        >
          {redirecting ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              Перенаправлення на оплату…
            </>
          ) : (
            <>
              <IconCreditCard className="size-4" />
              Перейти до оплати{valid ? ` ${formatAmount(value)}` : ""}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
