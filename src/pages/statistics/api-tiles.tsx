/**
 * The tiles under the chart — one per entry of `data.kpis`, in the order the
 * response listed them.
 *
 * The page decides nothing here: not which tiles there are, not what unit they
 * are in, not how many. A breakdown that sends six tiles draws six.
 */
import { cn } from "@/lib/utils"
import { formatValue, labelOf, signed, type ApiKpi } from "./api"

export function ApiTiles({ kpis }: { kpis: ApiKpi[] }) {
  if (kpis.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5"
        >
          <span className="text-[11px] text-muted-foreground">
            {labelOf(kpi.key, kpi.label)}
          </span>
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              // nothing is painted for being good — a figure gets a colour only
              // when it is a loss, which is the one case easy to skim past
              signed(kpi.format) &&
                kpi.value !== null &&
                kpi.value < 0 &&
                "text-destructive"
            )}
          >
            {formatValue(kpi.value, kpi.format)}
          </span>
        </div>
      ))}
    </div>
  )
}
