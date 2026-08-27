/* eslint-disable react-refresh/only-export-components */
import { cn } from "@/lib/utils"

// The left and right margins every chart on the page draws with.
const MARGIN_X = 4 + 12

/**
 * The props that keep a tooltip inside its card.
 *
 * Recharts pins the tooltip to the plot rect and flips it to the other side of
 * the cursor when it would run past the right edge - but only when the box is
 * narrower than the plot. A box that is wider has nowhere to flip to, so it
 * gets parked on the plot's left edge and hangs out the right side of the card
 * instead. Capping the wrapper at the plot's own width is what makes the flip
 * possible again, and the box then shrinks rather than escapes.
 *
 * @param axisWidth the width the chart gives its YAxis - the rest of what the
 * plot does not get
 */
export function tooltipBounds(axisWidth: number) {
  return {
    allowEscapeViewBox: { x: false, y: false },
    wrapperStyle: { maxWidth: `calc(100% - ${axisWidth + MARGIN_X}px)` },
  } as const
}

/**
 * The shell every tooltip on the page is drawn in; the width comes on top.
 *
 * grid-cols-1 is load-bearing: a grid with no column of its own sizes its
 * implicit one to max-content, which a fixed-width box does not clip - the
 * rows keep their full width and the text runs out the side while `truncate`
 * inside them never fires. `minmax(0, 1fr)`, which is what grid-cols-1 is,
 * holds the row to the box so the names can give way instead.
 */
export const TOOLTIP_BOX =
  "grid grid-cols-1 max-w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-xs shadow-xl"

/**
 * The title row: what the column is on the left, its headline figure on the
 * right. The name gives way and the figure never does - a period's sums run to
 * eight digits, and a figure that wraps or pushes the box wider is the other
 * way a tooltip ends up outside its card.
 */
export function TooltipHead({
  title,
  value,
  strong,
}: {
  title: string
  value?: React.ReactNode
  /** the figure is the point of the column, not a footnote to its name */
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2 border-b pb-1.5">
      <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
      {value != null && (
        <span
          className={cn(
            "shrink-0 whitespace-nowrap tabular-nums",
            strong ? "font-medium" : "text-muted-foreground"
          )}
        >
          {value}
        </span>
      )}
    </div>
  )
}
