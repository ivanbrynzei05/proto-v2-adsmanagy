import { cn } from "@/lib/utils"
import { BREAKDOWNS, type BreakdownId } from "./data"

/**
 * The breakdown is what the page is about, not one more filter - so it sits
 * right under the title, ahead of everything it governs, instead of in the
 * panel beside the chart where a report has to be hunted for.
 *
 * A segmented control: a tray that sits into the page, and the picked cut
 * raised out of it on the card colour. That is the one shape everybody already
 * reads as "one of these, always" - the same pairing the billing period toggle
 * uses - and the lift is what carries the selection, so the label needs nothing
 * louder than a weight to say which one is on.
 *
 * The tray is foreground at 7% rather than bg-muted: the page is bg-muted in
 * the light theme, and a muted tray on a muted page is a control drawn in the
 * colour of the thing behind it. A wash of the text colour darkens whatever it
 * is laid on, so the tray reads as recessed on both themes.
 *
 * Dark is where the raised tile needs help: bg-card there is barely a step off
 * that wash and the shadow all but vanishes on a dark ground, so the tile takes
 * the next surface up instead. Light keeps the white tile the shadow seats.
 *
 * The radii nest: 12px tray, 4px padding, 8px tile - the tile's corners run
 * parallel to the tray's instead of cutting across them.
 */
export function BreakdownTabs({
  value,
  onChange,
}: {
  value: BreakdownId
  onChange: (id: BreakdownId) => void
}) {
  return (
    <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-md bg-foreground/[0.07] p-1">
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
              "flex h-8 shrink-0 items-center gap-2 rounded-sm px-3 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-card font-medium text-foreground shadow-sm dark:bg-muted"
                : "text-muted-foreground hover:text-foreground",
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
