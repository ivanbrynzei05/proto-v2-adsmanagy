import { useMemo } from "react"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import { useCurrency } from "@/components/currency-provider"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DisplayCurrency } from "@/features/currency/types"
import { cn } from "@/lib/utils"
import { fmtNum } from "@/pages/dashboard/data"
import { TOOLTIP_BOX, TooltipHead, tooltipBounds } from "./chart-tooltip"
import {
  centerTiles,
  type CentersPoint,
  type CentersReport,
  type CenterStat,
} from "./data"
import { TooltipTiles } from "./metric-tiles"
import {
  drawn,
  Mark,
  SeriesRail,
  toggleSeries,
  type SeriesRow,
} from "./series-rail"

const AXIS_WIDTH = 46
const LEADS = { key: "leads", label: "Ліди", color: "var(--muted-foreground)" }

function pct(value: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

function CentersTooltip({
  active,
  payload,
  bars,
  line,
  currency,
}: {
  active?: boolean
  payload?: { payload?: CentersPoint }[]
  bars: CenterStat[]
  line: boolean
  currency: DisplayCurrency
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className={cn(TOOLTIP_BOX, "w-[268px] gap-1.5")}>
      <TooltipHead title={point.full} />
      {line && (
        <div className="flex items-center gap-2">
          <Mark mark="line" color={LEADS.color} />
          <span className="text-muted-foreground">{LEADS.label}</span>
          <span className="ml-auto shrink-0 font-medium tabular-nums">
            {fmtNum(point.leads)}
          </span>
        </div>
      )}
      {bars.map((c) => {
        const value = point.byCenter[c.id] ?? 0
        return (
          <div key={c.id} className="flex items-center gap-2">
            <Mark mark="bar" color={c.color} />
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            <span className="ml-auto shrink-0 font-medium tabular-nums">
              {fmtNum(value)}
            </span>
            <span className="w-9 shrink-0 text-right text-muted-foreground tabular-nums">
              {pct(value, point.leads)}
            </span>
          </div>
        )
      })}
      {/* what the whole bucket came to, at the definitions the tiles under the
          chart use - the period's block, read for one column */}
      <TooltipTiles tiles={centerTiles(point.sum)} currency={currency} />
    </div>
  )
}

export function CentersReportCard({
  report,
  hidden,
  onHidden,
  className,
}: {
  report: CentersReport
  hidden: string[]
  onHidden: (next: string[]) => void
  className?: string
}) {
  const { currency } = useCurrency()
  const { points, centers } = report
  const dense = points.length > 24

  const config = useMemo(
    () =>
      Object.fromEntries(
        centers.map((c) => [c.id, { label: c.name, color: c.color }])
      ) satisfies ChartConfig,
    [centers]
  )

  // A centre is keyed by its own name, so its column is read out of the point's
  // own map rather than off a flat field - a centre called "leads" would
  // otherwise draw the ліди line. The readers are memoised because a new one
  // every render restarts the bars' animation.
  const readers = useMemo(
    () =>
      new Map(
        centers.map((c) => [c.id, (p: CentersPoint) => p.byCenter[c.id] ?? 0])
      ),
    [centers]
  )

  // Ліди first, then the centres top-down in the order the column stacks them.
  const rows = useMemo(
    (): SeriesRow[] => [
      { key: LEADS.key, label: LEADS.label, color: LEADS.color, mark: "line" },
      ...[...centers].reverse().map(
        (c): SeriesRow => ({
          key: c.id,
          label: c.name,
          color: c.color,
          mark: "bar",
        })
      ),
    ],
    [centers]
  )

  const bars = drawn(
    centers.map((c) => ({ ...c, key: c.id })),
    hidden
  )
  const line = !hidden.includes(LEADS.key)

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:gap-4">
        {points.length > 0 ? (
          <>
            <div className="min-w-0 flex-1">
              <ChartContainer config={config} className="h-[268px] w-full">
                <ComposedChart
                  data={points}
                  margin={{ left: 4, right: 12, top: 8 }}
                  barCategoryGap="22%"
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
                    domain={[0, (max: number) => Math.ceil(max * 1.1)]}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                    {...tooltipBounds(AXIS_WIDTH)}
                    content={
                      <CentersTooltip
                        bars={[...bars].reverse()}
                        line={line}
                        currency={currency}
                      />
                    }
                  />
                  {/* one segment per centre - the column is the day's апрув,
                      cut by who confirmed it. Each is rounded on all four
                      corners, so the column reads as the centres it is made of
                      rather than as one bar with a cap. */}
                  {bars.map((c) => (
                    <Bar
                      key={c.id}
                      dataKey={readers.get(c.id)}
                      name={c.name}
                      stackId="centers"
                      fill={c.color}
                      stroke="var(--card)"
                      strokeWidth={2}
                      maxBarSize={26}
                      radius={4}
                    />
                  ))}
                  {line && (
                    <Line
                      dataKey="leads"
                      type="monotone"
                      stroke={LEADS.color}
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
                  )}
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
