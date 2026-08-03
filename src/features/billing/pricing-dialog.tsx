import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PricingGrid } from "@/features/billing/plans"

// Plan picker shown from anywhere the account is blocked by "no active plan"
// (dashboard widgets, campaigns table).
export function PricingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Оберіть тариф</DialogTitle>
          <DialogDescription>
            Більше акаунтів, учасників команди та інтеграцій на платних тарифах
          </DialogDescription>
        </DialogHeader>
        <PricingGrid
          size="sm"
          onSelect={(planId) => {
            // Close the dialog so the checkout panel opens cleanly on top.
            if (planId !== "free") onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
