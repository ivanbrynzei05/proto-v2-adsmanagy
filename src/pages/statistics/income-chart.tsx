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
import { TOOLTIP_BOX, TooltipHead, tooltipBounds } from "./chart-tooltip"
import {
  COSTS,
  incomeTiles,
  MONEY_LINES,
  PROFIT_SHARES,
  type IncomeReport,
  type LineKey,
  type MoneyFigures,
  type MoneyPoint,
} from "./data"
import { TooltipTiles } from "./metric-tiles"
import {
  DetailRows,
  drawn,
  Mark,
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
 * What each line is made of, for one column or for the whole period.
 *
 * Маржинальність is not here: it is a tile under the chart, and so is every
 * rate the block below carries. Реклама is a column of that block's table, so
 * the rail leaves it out too - but a single bucket has no row down there, which
 * is why the tooltip still opens витрати up in full.
 */
function detailOf(
  figures: MoneyFigures,
  currency: DisplayCurrency,
  withAds: boolean
): Record<LineKey, { label: string; value: string }[]> {
  return {
    sales: [
      { label: "Викуплені замовлення", value: fmtNum(figures.orders) },
      { label: "Середній чек", value: money(figures.avgCheck, currency) },
    ],
    costs: COSTS.filter((c) => withAds || c.key !== "ads").map((c) => ({
      label: c.label,
      value: money(figures[c.key], currency),
    })),
    profit: PROFIT_SHARES.map((share) => ({
      label: share.label,
      value: money(figures[share.key], currency),
    })),
  }
}

// One block per drawn line, then the same tiles the block under the chart
// shows - read for this column alone rather than for the period.
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
  const detail = detailOf(point, currency, true)

  return (
    <div className={cn(TOOLTIP_BOX, "w-[268px] gap-2")}>
      <TooltipHead title={point.full} />
      {lines.map((l) => (
        <div key={l.key} className="grid grid-cols-1 gap-1">
          <div className="flex items-center gap-2">
            <Mark mark={l.strong ? "strong" : "line"} color={l.color} />
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                l.strong ? "font-medium" : "text-muted-foreground"
              )}
            >
              {l.label}
            </span>
            <span
              className={cn(
                "ml-auto shrink-0 whitespace-nowrap tabular-nums",
                l.strong ? "font-bold" : "font-medium"
              )}
            >
              {money(point[l.key], currency)}
            </span>
          </div>
          <DetailRows rows={detail[l.key]} />
        </div>
      ))}
      <TooltipTiles tiles={incomeTiles(point)} currency={currency} />
    </div>
  )
}

// The rail: the three lines and the switch that draws them. Дохід carries no
// figure of its own - the table under the chart totals it in its Разом row -
// while виручка and витрати have no home down there at all.
function railRows(
  totals: MoneyFigures,
  currency: DisplayCurrency
): SeriesRow[] {
  const detail = detailOf(totals, currency, false)
  return MONEY_LINES.map((l) => ({
    key: l.key,
    label: l.label,
    color: l.color,
    mark: l.strong ? "strong" : "line",
    value: l.key === "profit" ? undefined : money(totals[l.key], currency),
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
                  {lines.some((l) => l.key === "profit") && (
                    <Area
                      dataKey="profit"
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
