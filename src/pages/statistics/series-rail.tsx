/* eslint-disable react-refresh/only-export-components */
import { cn } from "@/lib/utils"

/** the mark the chart draws a series with - the rail carries the same one */
export type SeriesMark = "line" | "strong" | "bar"

export type SeriesRow = {
  key: string
  label: string
  color: string
  mark: SeriesMark
  /**
   * The period's own figure. Carried only where the block under the chart has
   * neither a tile nor a column for it - everything that block already says is
   * read there, never twice on the same screen.
   */
  value?: string
  /** what the series is made of */
  detail?: { label: string; value: string }[]
  /** the rest of that list, named rather than listed - "+12 статусів" */
  tail?: string
}

export function Mark({
  mark,
  color,
  off,
}: {
  mark: SeriesMark
  color: string
  off?: boolean
}) {
  return (
    <span
      className={cn(
        "shrink-0",
        mark === "bar" ? "size-2.5 rounded-[2px]" : "w-4 rounded-full",
        mark === "line" && "h-0.5",
        mark === "strong" && "h-1",
        off && "bg-muted-foreground/25"
      )}
      style={off ? undefined : { backgroundColor: color }}
    />
  )
}

/** the series the plot draws, in the rail's own order rather than click order */
export function drawn<T extends { key: string }>(rows: T[], hidden: string[]) {
  return rows.filter((r) => !hidden.includes(r.key))
}

/**
 * Flips one series. The last one stays: an empty plot is not a report, and a
 * card with nothing on it is not what a click on a legend row is asking for.
 */
export function toggleSeries(
  rows: { key: string }[],
  hidden: string[],
  key: string
) {
  const next = hidden.includes(key)
    ? hidden.filter((k) => k !== key)
    : [...hidden, key]
  return rows.some((r) => !next.includes(r.key)) ? next : hidden
}

/** what a series is made of, under its row - in the rail and in the tooltip */
export function DetailRows({
  rows,
}: {
  rows: { label: string; value: string }[]
}) {
  return (
    <div className="grid grid-cols-1 gap-0.5 pl-6 text-[11px]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {r.label}
          </span>
          <span className="shrink-0 whitespace-nowrap text-muted-foreground tabular-nums">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * The rail down the right of a chart card: every series the report knows, and
 * the switch that draws it.
 *
 * It is the legend and the picker at once - which is why the plot has no legend
 * strip of its own - and it is deliberately thin on figures. What the period
 * came to is read off the tiles and the table under the chart; the rail carries
 * a number only for a series that block has no room for, so nothing on the
 * screen is written down twice.
 */
export function SeriesRail({
  rows,
  hidden,
  onToggle,
}: {
  rows: SeriesRow[]
  hidden: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1 border-t pt-3 text-xs xl:max-h-[300px] xl:w-[236px] xl:overflow-y-auto xl:border-t-0 xl:border-l xl:pt-0 xl:pl-3">
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-1">
        {rows.map((row) => {
          const on = !hidden.includes(row.key)
          return (
            <div key={row.key} className="grid grid-cols-1 gap-1">
              <button
                type="button"
                onClick={() => onToggle(row.key)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors",
                  "hover:bg-muted/60",
                  on && "bg-muted/40"
                )}
              >
                <Mark mark={row.mark} color={row.color} off={!on} />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    on ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {row.label}
                </span>
                {row.value && (
                  <span
                    className={cn(
                      "shrink-0 whitespace-nowrap tabular-nums",
                      on ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {row.value}
                  </span>
                )}
              </button>
              {((row.detail && row.detail.length > 0) || row.tail) && (
                <div className="grid grid-cols-1 gap-0.5 pb-1">
                  {row.detail && row.detail.length > 0 && (
                    <DetailRows rows={row.detail} />
                  )}
                  {row.tail && (
                    <span className="pl-6 text-[11px] text-muted-foreground/70">
                      {row.tail}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
