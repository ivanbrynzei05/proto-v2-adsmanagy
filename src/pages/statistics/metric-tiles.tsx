/* eslint-disable react-refresh/only-export-components */
import { useCurrency } from "@/components/currency-provider"
import type { DisplayCurrency } from "@/features/currency/types"
import { cn } from "@/lib/utils"
import { fmt } from "@/pages/campaigns/data"
import { fmtNum } from "@/pages/dashboard/data"
import type { TileFigure } from "./data"

/**
 * One figure, in the unit it is measured in. Counts and rates are grouped and
 * punctuated the way the rest of the page does it; штуки and хвилини carry
 * their unit after the figure rather than a symbol in front of it.
 */
export function tileText(t: TileFigure, currency?: DisplayCurrency) {
  if (t.unit === "шт") return `${fmtNum(t.value)} шт`
  if (t.unit === "хв") return `${fmt(t.value, "")} хв`
  return fmt(t.value, t.unit, currency)
}

/**
 * The tiles that open the block under a chart: what the period came to.
 *
 * This is the one place those figures are shown at rest - the rail beside the
 * chart carries only what has no tile here, so the same number is never read in
 * two places on the same screen.
 */
export function MetricTiles({ tiles }: { tiles: TileFigure[] }) {
  const { currency } = useCurrency()

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.key}
          className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5"
        >
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {t.dot && (
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: t.dot }}
              />
            )}
            {t.label}
          </span>
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              // nothing is painted for being good - a figure only gets a colour
              // when it is a loss, which is the one case the number alone is
              // easy to skim past
              t.signed && t.value < 0 && "text-destructive"
            )}
          >
            {tileText(t, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * The same tiles, for the column under the cursor - what a tooltip closes with.
 *
 * Both blocks are rendered from one list, so hovering a day answers the same
 * questions the period does, at the same definitions, without scrolling down.
 *
 * auto-fit rather than two fixed columns: a tooltip is barely wider than one
 * of "Сума допродажів  123 456 ₴", and split in two those rows lose their
 * labels to the ellipsis. The block takes a second column only where the box
 * is actually wide enough for one, and stacks otherwise.
 */
export function TooltipTiles({
  tiles,
  currency,
}: {
  tiles: TileFigure[]
  /** left off where the block carries no money at all */
  currency?: DisplayCurrency
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-3 gap-y-0.5 border-t pt-1.5 text-[11px]">
      {tiles.map((t) => (
        <div key={t.key} className="flex items-baseline gap-1.5">
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {t.label}
          </span>
          <span
            className={cn(
              "shrink-0 whitespace-nowrap tabular-nums",
              t.signed && t.value < 0 && "text-destructive"
            )}
          >
            {tileText(t, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}
