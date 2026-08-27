import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { useCurrency } from "@/components/currency-provider"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DisplayCurrency } from "@/features/currency/types"
import { cn } from "@/lib/utils"
import { fmt } from "@/pages/campaigns/data"
import { fmtNum } from "@/pages/dashboard/data"
import { TOOLTIP_BOX, TooltipHead, tooltipBounds } from "./chart-tooltip"
import { ADS_METRICS, adsTiles, type AdsPoint, type AdsReport } from "./data"
import { TooltipTiles } from "./metric-tiles"
import {
  drawn,
  Mark,
  SeriesRail,
  toggleSeries,
  type SeriesRow,
} from "./series-rail"

/** the room the value axis needs - покази run to six figures */
const AXIS_WIDTH = 56

type Metric = (typeof ADS_METRICS)[number]

// The rail: the funnel, and the switch that draws it. No figure on any row -
// every one of these four is a column of the table under the chart, totalled in
// its Разом row.
const RAIL: SeriesRow[] = ADS_METRICS.map((m) => ({
  key: m.key,
  label: m.label,
  color: m.color,
  mark: "line",
}))

function AdsTooltip({
  active,
  payload,
  lines,
  currency,
}: {
  active?: boolean
  payload?: { payload?: AdsPoint }[]
  lines: Metric[]
  currency: DisplayCurrency
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  // the block under the chart, read for this column - minus витрати, which are
  // the figure in the head, and minus whatever is already standing as a line
  const tiles = adsTiles(point).filter(
    (t) => t.key !== "ads" && !lines.some((l) => l.key === t.key)
  )

  return (
    <div className={cn(TOOLTIP_BOX, "w-[268px] gap-1.5")}>
      <TooltipHead
        title={point.full}
        value={fmt(point.spend, "₴", currency)}
        strong
      />
      {lines.map((m) => (
        <div key={m.key} className="flex items-center gap-2">
          <Mark mark="line" color={m.color} />
          <span className="min-w-0 flex-1 truncate">{m.label}</span>
          <span className="shrink-0 font-medium tabular-nums">
            {fmtNum(point[m.key])}
          </span>
        </div>
      ))}
      <TooltipTiles tiles={tiles} currency={currency} />
    </div>
  )
}

/**
 * The chart card: what the cabinets bought, bucket by bucket.
 *
 * No per-campaign cut on the plot - an account runs thousands of them over a
 * long period, and four in colour would be four arbitrary lines rather than a
 * breakdown. Which campaign carried the period is the table under the chart,
 * sorted by whichever column is being asked about.
 */
export function AdsReportCard({
  report,
  hidden,
  onHidden,
  className,
}: {
  report: AdsReport
  hidden: string[]
  onHidden: (next: string[]) => void
  className?: string
}) {
  const { currency } = useCurrency()
  const { points } = report
  const dense = points.length > 24

  const lines = drawn(ADS_METRICS, hidden)
  const config = Object.fromEntries(
    lines.map((m) => [m.key, { label: m.label, color: m.color }])
  ) satisfies ChartConfig

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:gap-4">
        {points.length > 0 ? (
          <>
            <div className="min-w-0 flex-1">
              <ChartContainer config={config} className="h-[268px] w-full">
                <LineChart
                  data={points}
                  margin={{ left: 4, right: 12, top: 8 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={dense ? 24 : 8}
                    interval="preserveStartEnd"
                  />
                  {/* One axis, and every line read against it - the funnel is
                      one unit all the way down. It follows what is drawn, which
                      is what lets покази share the plot with апруви at all. */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={AXIS_WIDTH}
                    tickFormatter={(value: number) => fmtNum(value)}
                    domain={[0, (max: number) => Math.ceil(max * 1.1)]}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)" }}
                    {...tooltipBounds(AXIS_WIDTH)}
                    content={<AdsTooltip lines={lines} currency={currency} />}
                  />
                  {lines.map((m) => (
                    <Line
                      key={m.key}
                      dataKey={m.key}
                      type="monotone"
                      stroke={m.color}
                      strokeWidth={2}
                      dot={
                        dense
                          ? false
                          : { r: 3, strokeWidth: 2, stroke: "var(--card)" }
                      }
                      activeDot={{
                        r: 4.5,
                        strokeWidth: 2,
                        stroke: "var(--card)",
                      }}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </div>
            <SeriesRail
              rows={RAIL}
              hidden={hidden}
              onToggle={(key) => onHidden(toggleSeries(RAIL, hidden, key))}
            />
          </>
        ) : (
          <p className="w-full py-16 text-center text-sm text-muted-foreground">
            За цей період ще немає даних
          </p>
        )}
      </CardContent>
    </Card>
  )
}
