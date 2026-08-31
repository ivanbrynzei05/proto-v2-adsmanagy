import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// A plausible column run, as percentages of the plot height - the real chart
// draws a stacked buyout per bucket, which never sits flat.
const BARS = [62, 78, 54, 88, 71, 46, 83, 67, 92, 58, 74, 51, 86, 69]
// the rail down the right: one switch per series, in the widths their names
// run to. Nothing under them - the figures are all in the block below.
const RAIL = [64, 88, 72, 56, 44]
// the eight tiles above the table, in the widths their figures run to
const TILES = [72, 88, 80, 56, 84, 64, 68, 76]
// the numeric columns of the metrics table, right-aligned like the real ones
const COLS = [44, 38, 42, 40, 40, 52, 48, 56, 60, 56, 40]

// The chart card: value axis, columns, the tick row under them, and the rail
// down the right - the same frame the real report fills.
function ChartCardSkeleton() {
  return (
    <Card className="gap-0 py-4 [--card-spacing:16px]">
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex h-[268px] flex-col">
            <div className="flex min-h-0 flex-1 gap-3">
              <div className="flex w-10 shrink-0 flex-col justify-between py-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-2.5 w-full" />
                ))}
              </div>
              <div className="flex min-w-0 flex-1 items-end gap-2">
                {BARS.map((h, i) => (
                  <Skeleton
                    key={i}
                    className="max-w-[26px] min-w-0 flex-1 rounded-[4px]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-2.5 flex justify-between pl-[52px]">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-2.5 w-7" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1 border-t pt-3 xl:w-[236px] xl:border-t-0 xl:border-l xl:pt-0 xl:pl-3">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {RAIL.map((w, i) => (
              <div key={i} className="flex items-center gap-2 px-1.5 py-1">
                <Skeleton className="size-2.5 shrink-0 rounded-[2px]" />
                <Skeleton className="h-2.5" style={{ width: w }} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// The metrics card: the tile row, then the table under it.
function MetricsSkeleton() {
  return (
    <Card className="gap-0 py-4 [--card-spacing:16px]">
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TILES.map((w, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5"
            >
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-4" style={{ width: w }} />
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b py-2">
            <Skeleton className="h-2.5 w-16" />
            <div className="ml-auto flex shrink-0 items-center gap-4">
              {COLS.map((w, i) => (
                <Skeleton key={i} className="h-2.5" style={{ width: w }} />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 border-b py-2.5">
              <Skeleton className="size-2.5 shrink-0 rounded-[2px]" />
              <Skeleton
                className="h-3"
                style={{ width: 110 + ((i * 41) % 86) }}
              />
              <div className="ml-auto flex shrink-0 items-center gap-4">
                {COLS.map((w, j) => (
                  <Skeleton
                    key={j}
                    className="h-3"
                    style={{ width: w - ((i * 7 + j * 5) % 10) }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * The report itself - both cards. This is what stands in while a new breakdown,
 * period or filter is being built, with the tabs and the panel left live so the
 * control that started it is still under the cursor.
 */
export function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <ChartCardSkeleton />
      <MetricsSkeleton />
    </div>
  )
}

// the five breakdowns, in the widths their labels run to
const TABS = [46, 88, 80, 66, 54]

function PanelSkeleton() {
  return (
    <Card className="gap-0 divide-y py-0">
      {/* the two banded headers the real panel is split by, and the period
          control under the first of them */}
      <div className="bg-muted/50 px-4 py-2.5">
        <Skeleton className="h-2.5 w-14" />
      </div>
      <section className="px-4 py-3.5">
        <Skeleton className="h-9 w-full rounded-md" />
      </section>
      <div className="bg-muted/50 px-4 py-2.5">
        <Skeleton className="h-2.5 w-16" />
      </div>
      <section className="flex flex-col divide-y px-4">
        {[64, 36].map((w, i) => (
          <div key={i} className="flex items-center gap-2 py-3">
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-3" style={{ width: w }} />
            <Skeleton className="ml-auto size-4 shrink-0 rounded" />
          </div>
        ))}
      </section>
    </Card>
  )
}

/** The whole page, for the first load - nothing on it is known yet. */
export function StatisticsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-28" />
        <div className="flex w-fit max-w-full gap-1 rounded-md bg-foreground/[0.07] p-1">
          {TABS.map((w, i) => (
            <div key={i} className="grid h-8 place-items-center px-3">
              <Skeleton className="h-2.5" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-2 min-w-0">
          <ReportSkeleton />
        </div>
        {/* a phone has no panel to wait for - only the period and the button
            that opens the filter sheet, which is what the bar stands in for */}
        <div className="order-1 flex items-center gap-2 md:hidden">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
          <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
        </div>
        <div className="order-1 max-md:hidden">
          <PanelSkeleton />
        </div>
      </div>
    </div>
  )
}
