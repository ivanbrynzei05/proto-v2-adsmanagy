import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

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
  COSTS,
  MONEY_LINES,
  PROFIT_SHARES,
  type IncomeReport,
  type LineKey,
  type MoneyFigures,
  type MoneyPoint,
} from "./data"
import {
  drawn,
  SeriesRail,
  toggleSeries,
  type SeriesRow,
} from "./series-rail"

const AXIS_WIDTH = 56

const CHART_CONFIG = Object.fromEntries(
  MONEY_LINES.map((l) => [l.key, { label: l.label, color: l.color }])
) satisfies ChartConfig

const PROFIT = MONEY_LINES.find((l) => l.key === "profit")!

function money(value: number, currency: DisplayCurrency) {
  return fmt(value, "₴", currency)
}

/**
 * What each line is made of, over the whole period - the rail's own rows.
 *
 * Маржинальність is not here: it is a tile under the chart, and so is every
 * rate the block below carries. Реклама is a column of that block's table.
 */
function detailOf(
  figures: MoneyFigures,
  currency: DisplayCurrency
): Record<LineKey, { label: string; value: string }[]> {
  return {
    sales: [
      { label: "Викуплені замовлення", value: fmtNum(figures.orders) },
      { label: "Середній чек", value: money(figures.avgCheck, currency) },
    ],
    costs: COSTS.filter((c) => c.key !== "ads").map((c) => ({
      label: c.label,
      value: money(figures[c.key], currency),
    })),
    profit: PROFIT_SHARES.map((share) => ({
      label: share.label,
      value: money(figures[share.key], currency),
    })),
  }
}

/**
 * The drawn lines, then the same tiles the block under the chart shows - read
 * for this column alone rather than for the period.
 *
 * What each line is made of is the rail's job. Opened up here as well, the box
 * ran past the bottom of the plot and its rows lost their labels to the
 * ellipsis; the one figure the block below has no room for - what the bucket
 * spent on рекламу - leads the tiles instead.
 */
function IncomeTooltip({
  active,
  payload,
  lines,
  currency,
}: {
  active?: boolean
  payload?: { payload?: MoneyPoint }[]
  lines: typeof MONEY_LINES
  currency: DisplayCurrency
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  // The rail's own rows, read at this point: every drawn line with its figure,
  // and under each what it is made of. Реклама is one of those parts, so it
  // needs no tile of its own any more.
  const drawnKeys = lines.map((l) => l.key)
  const rows = railRows(point, currency, true).filter((row) =>
    drawnKeys.includes(row.key as LineKey)
  )

  return (
    <div className={cn(TOOLTIP_BOX, "w-[280px] gap-1.5")}>
      <TooltipHead title={point.full} />
      <TooltipSeries rows={rows} />
    </div>
  )
}

// The rail: the three lines and the switch that draws them. Дохід carries no
// figure of its own - the table under the chart totals it in its Разом row -
// while виручка and витрати have no home down there at all.
function railRows(
  totals: MoneyFigures,
  currency: DisplayCurrency,
  /** a tooltip has no table under it, so there every line carries its figure */
  everyFigure = false
): SeriesRow[] {
  const detail = detailOf(totals, currency)
  return MONEY_LINES.map((l) => ({
    key: l.key,
    label: l.label,
    color: l.color,
    mark: l.strong ? "strong" : "line",
    value:
      l.key === PROFIT.key && !everyFigure
        ? undefined
        : money(totals[l.key], currency),
    detail: detail[l.key],
  }))
}

export function IncomeReportCard({
  report,
  hidden,
  onHidden,
  className,
}: {
  report: IncomeReport
  hidden: string[]
  onHidden: (next: string[]) => void
  className?: string
}) {
  const { currency } = useCurrency()
  const dense = report.points.length > 24
  const rows = railRows(report.totals, currency)
  const lines = drawn(MONEY_LINES, hidden)

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:gap-4">
        {report.points.length > 0 ? (
          <>
            <div className="min-w-0 flex-1">
              <ChartContainer
                config={CHART_CONFIG}
                className="h-[300px] w-full"
              >
                <ComposedChart
                  data={report.points}
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
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={AXIS_WIDTH}
                    tickFormatter={(value: number) => fmtNum(value)}
                    domain={[
                      (min: number) => Math.min(0, Math.floor(min * 1.1)),
                      (max: number) => Math.ceil(max * 1.08),
                    ]}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)" }}
                    {...tooltipBounds(AXIS_WIDTH)}
                    content={
                      <IncomeTooltip lines={lines} currency={currency} />
                    }
                  />
                  {/* дохід is the line the page is about: it carries a fill
                      under it and a heavier stroke, while виручка and витрати
                      stay thin lines that frame it */}
                  {lines.some((l) => l.key === PROFIT.key) && (
                    <Area
                      dataKey={PROFIT.key}
                      type="monotone"
                      stroke="none"
                      fill={PROFIT.color}
                      fillOpacity={0.16}
                      isAnimationActive={false}
                      activeDot={false}
                    />
                  )}
                  {lines.map((l) => (
                    <Line
                      key={l.key}
                      dataKey={l.key}
                      type="monotone"
                      stroke={l.color}
                      strokeWidth={l.strong ? 3.5 : 1.75}
                      strokeOpacity={l.strong ? 1 : 0.9}
                      dot={
                        dense
                          ? false
                          : {
                              r: l.strong ? 3.5 : 2.5,
                              strokeWidth: 2,
                              stroke: "var(--card)",
                            }
                      }
                      activeDot={{
                        r: l.strong ? 5.5 : 4.5,
                        strokeWidth: 2,
                        stroke: "var(--card)",
                      }}
                    />
                  ))}
                </ComposedChart>
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
