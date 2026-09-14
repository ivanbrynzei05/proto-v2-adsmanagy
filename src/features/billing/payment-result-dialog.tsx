import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type PaymentResult = "success" | "error"

/**
 * What the payer sees on coming back from WayForPay. In the product it comes
 * from ?status= on the return URL: approved is a success, the rest an error.
 */
export function PaymentResultDialog({
  result,
  onClose,
  onRetry,
}: {
  result: PaymentResult | null
  onClose: () => void
  onRetry: () => void
}) {
  const success = result === "success"

  return (
    <Dialog
      open={result !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-sm">
        {result && (
          <div className="flex flex-col items-center gap-5 pt-4 text-center">
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-2xl",
                success
                  ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {success ? (
                <IconCircleCheckFilled className="size-9" />
              ) : (
                <IconCircleXFilled className="size-9" />
              )}
            </div>

            <div>
              <DialogTitle className="text-lg">
                {success ? "Оплата пройшла" : "Оплата не пройшла"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {success
                  ? "Кошти зараховано на баланс"
                  : "Кошти не списано. Спробуйте ще раз"}
              </DialogDescription>
            </div>

            {success ? (
              <Button
                className="h-11 w-full rounded-xl font-semibold"
                onClick={onClose}
              >
                Готово
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <Button
                  className="h-11 w-full rounded-xl font-semibold"
                  onClick={onRetry}
                >
                  Спробувати ще
                </Button>
                <Button variant="ghost" className="w-full" onClick={onClose}>
                  Закрити
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
