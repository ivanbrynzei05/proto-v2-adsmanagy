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
import {
  TOOLTIP_BOX,
  TooltipHead,
  TooltipSeries,
  tooltipBounds,
} from "./chart-tooltip"
import {
  PRODUCT_METRICS,
  productMetrics,
  type ProductsPoint,
  type ProductsReport,
} from "./data"
import {
  drawn,
  SeriesRail,
  toggleSeries,
  type SeriesRow,
} from "./series-rail"

/** the room the value axis needs - every metric here is a sum in гривнях */
const AXIS_WIDTH = 56

type Metric = (typeof PRODUCT_METRICS)[number]

// Виручка and Дохід are tiles under the chart, so the rail names them without
// repeating the figure; собівартість and витрати have no home down there and
// carry theirs.
const RAIL_FIGURES: Metric["key"][] = ["cogs", "costs"]

function ProductsTooltip({
  active,
  payload,
  lines,
  currency,
}: {
  active?: boolean
  payload?: { payload?: ProductsPoint }[]
  lines: Metric[]
  currency: DisplayCurrency
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  // Every drawn line with its figure, and under Витрати what it is made of —
  // the same shape the rail beside the chart carries.
  const rows: SeriesRow[] = lines.map((m) => ({
    key: m.key,
    label: m.label,
    color: m.color,
    mark: "line",
    value: fmt(point[m.key], "₴", currency),
    detail:
      m.key === "costs"
        ? [
            { label: "Реклама", value: fmt(point.ads, "₴", currency) },
            { label: "Собівартість", value: fmt(point.cogs, "₴", currency) },
          ]
        : undefined,
  }))

  return (
    <div className={cn(TOOLTIP_BOX, "w-[280px] gap-1.5")}>
      <TooltipHead title={point.full} />
      <TooltipSeries rows={rows} />
    </div>
  )
}

/**
 * The chart card. Which metrics are drawn is the page's state, not the card's:
 * a new period swaps the whole report for its skeleton, and a selection that
 * did not survive that would be gone on every touch of the panel.
 */
export function ProductsReportCard({
  report,
  hidden,
  onHidden,
  className,
}: {
  report: ProductsReport
  hidden: string[]
  onHidden: (next: string[]) => void
  className?: string
}) {
  const { currency } = useCurrency()
  const { points } = report
  const dense = points.length > 24
  const totals = productMetrics(report.totals.money)

  // drawn in the rail's order, not the order they were picked in, so the plot
  // and the rail always read top-down the same way
  const lines = drawn(PRODUCT_METRICS, hidden)
  const config = Object.fromEntries(
    lines.map((m) => [m.key, { label: m.label, color: m.color }])
  ) satisfies ChartConfig

  // Any metric can join any other - they are all sums in гривнях against the
  // one axis, which is why all four can be on at once.
  const rows: SeriesRow[] = PRODUCT_METRICS.map((m) => ({
    key: m.key,
    label: m.label,
    color: m.color,
    mark: "line",
    value: RAIL_FIGURES.includes(m.key)
      ? fmt(totals[m.key], "₴", currency)
      : undefined,
  }))

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
                  {/* One axis, and every line read against it. A second scale
                      on the right would put ціна ліда - fifty гривень - at the
                      height of a couple hundred thousand on the left, and the
                      figure a line stands at is the whole point of a chart. */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={AXIS_WIDTH}
                    tickFormatter={(v: number) => fmtNum(v)}
                    domain={[
                      (min: number) => Math.min(0, Math.floor(min * 1.1)),
                      (max: number) => Math.ceil(max * 1.08),
                    ]}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)" }}
                    {...tooltipBounds(AXIS_WIDTH)}
                    content={
                      <ProductsTooltip lines={lines} currency={currency} />
                    }
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
              rows={rows}
              hidden={hidden}
              onToggle={(key) => onHidden(toggleSeries(rows, hidden, key))}
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
