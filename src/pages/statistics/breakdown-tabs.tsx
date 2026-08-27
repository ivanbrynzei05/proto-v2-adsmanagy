import { cn } from "@/lib/utils"
import { BREAKDOWNS, type BreakdownId } from "./data"

/**
 * The breakdown is what the page is about, not one more filter - so it sits
 * right under the title, ahead of everything it governs, instead of in the
 * panel beside the chart where a report has to be hunted for.
 *
 * A tight segment: the row is one bordered field, and the picked cut is the
 * tile lifted out of it.
 */
export function BreakdownTabs({
  value,
  onChange,
}: {
  value: BreakdownId
  onChange: (id: BreakdownId) => void
}) {
  return (
    <div className="flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border bg-muted/60 p-0.5">
      {BREAKDOWNS.map((b) => {
        const active = b.id === value
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            disabled={b.soon}
            onClick={() => onChange(b.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-border bg-background text-foreground shadow-xs"
                : "border-transparent text-muted-foreground hover:text-foreground",
              b.soon && "opacity-50 hover:text-muted-foreground"
            )}
          >
            {b.label}
            {b.soon && (
              <span className="rounded-full bg-muted px-1.5 py-px text-[10px] leading-none font-medium text-muted-foreground">
                скоро
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
