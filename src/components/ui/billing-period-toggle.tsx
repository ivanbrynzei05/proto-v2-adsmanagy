/* eslint-disable react-refresh/only-export-components */

import { cn } from "@/lib/utils"

export function BillingPeriodToggle({
  value,
  onChange,
}: {
  value: "monthly" | "yearly"
  onChange: (v: "monthly" | "yearly") => void
}) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-xl bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange("yearly")}
        aria-pressed={value === "yearly"}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
          value === "yearly"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        На рік
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          2 місяці безкоштовно
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("monthly")}
        aria-pressed={value === "monthly"}
        className={cn(
          "flex items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
          value === "monthly"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        На місяць
      </button>
    </div>
  )
}

export default BillingPeriodToggle
