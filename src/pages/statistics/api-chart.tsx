/**
 * The chart, drawn from the response and from nothing else.
 *
 * One component for every breakdown. What is a line, what is a bar, what stacks
 * with what, what sits under a series in the legend, what a point is called —
 * all of it is read off `data.chart`. Adding a series to the backend adds it
 * here; there is no per-breakdown component to teach about it.
 *
 * The legend rail and the tooltip render the same `series` array. The rail
 * shows `series[].total`, the tooltip shows `points[i].values[key]` — which is
 * the one difference between them, and the reason a figure can never appear in
 * one and be missing from the other.
 */
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import {
  colorOf,
  formatValue,
  labelOf,
  type ApiChart,
  type ApiSeries,
  type Values,
} from "./api"
import { TOOLTIP_BOX, TooltipHead, tooltipBounds } from "./chart-tooltip"
import { DetailRows, Mark, SeriesRail, toggleSeries, type SeriesRow } from "./series-rail"

const AXIS_WIDTH = 64

/** The mark the rail draws beside a series — the shape the chart uses for it. */
function markOf(series: ApiSeries) {
  if (series.type === "column") return "bar" as const
  return series.type === "area" ? ("strong" as const) : ("line" as const)
}

function seriesColor(series: ApiSeries[], key: string) {
  const index = series.findIndex((s) => s.key === key)
  return colorOf(key, index < 0 ? 0 : index)
}

/**
 * Every drawn series, and under each the parts the response gave it.
 *
 * Values come from one map — the point's for a tooltip, the totals for the rail
 * — so both are walked the same way and neither can drift from the other.
 */
function rowsOf(chart: ApiChart, values: Values, hidden: string[]): SeriesRow[] {
  return chart.series
    .filter((s) => !hidden.includes(s.key))
    .map((s) => ({
      key: s.key,
      label: labelOf(s.key, s.label),
      color: seriesColor(chart.series, s.key),
      mark: markOf(s),
      value: formatValue(values[s.key], s.format),
      detail: s.items.map((item) => ({
        label: labelOf(item.key, item.label),
        value: formatValue(values[item.key], item.format),
      })),
    }))
}

function ApiTooltip({
  active,
  payload,
  chart,
  hidden,
}: {
  active?: boolean
  payload?: { payload?: { x: string; index: number } }[]
  chart: ApiChart
  hidden: string[]
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const values = chart.points[point.index]?.values ?? {}
  const rows = rowsOf(chart, values, hidden)

  return (
    <div className={cn(TOOLTIP_BOX, "w-[280px] gap-1.5")}>
      {/* the point's own name, exactly as the backend wrote it */}
      <TooltipHead title={point.x} />
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-1 gap-0.5">
          <div className="flex items-center gap-2">
            <Mark mark={row.mark} color={row.color} />
            <span className="min-w-0 flex-1 truncate font-medium">
              {row.label}
            </span>
            <span className="ml-auto shrink-0 whitespace-nowrap font-medium tabular-nums">
              {row.value}
            </span>
          </div>
          {row.detail && row.detail.length > 0 && (
            <DetailRows rows={row.detail} />
          )}
        </div>
      ))}
    </div>
  )
}

export function ApiChartCard({
  chart,
  hidden,
  onHidden,
  className,
}: {
  chart: ApiChart
  hidden: string[]
  onHidden: (next: string[]) => void
  className?: string
}) {
  // Recharts wants one flat object per point; the index rides along so the
  // tooltip can go back to the response rather than to a copy of it.
  const data = chart.points.map((point, index) => ({
    x: point.x,
    index,
    ...point.values,
  }))
  const dense = data.length > 24
  const shown = chart.series.filter((s) => !hidden.includes(s.key))

  const config = Object.fromEntries(
    chart.series.map((s, i) => [
      s.key,
      { label: labelOf(s.key, s.label), color: colorOf(s.key, i) },
    ])
  ) satisfies ChartConfig

  // The rail totals never move with the toggles: they are the period's, and a
  // legend that changed its figures as series were switched off would be
  // answering a different question from the one the tooltip answers.
  const totals: Values = Object.fromEntries([
    ...chart.series.map((s) => [s.key, s.total]),
    ...chart.series.flatMap((s) => s.items.map((i) => [i.key, i.total])),
  ])
  const railRows = rowsOf(chart, totals, [])

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:gap-4">
        {data.length > 0 ? (
          <>
            <div className="min-w-0 flex-1">
              <ChartContainer config={config} className="h-[300px] w-full">
                <ComposedChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="x"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={dense ? 32 : 12}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={AXIS_WIDTH}
                    tickFormatter={(value: number) =>
                      value.toLocaleString("uk", { maximumFractionDigits: 0 })
                    }
                    domain={[
                      (min: number) => Math.min(0, Math.floor(min * 1.1)),
                      (max: number) => Math.ceil(max * 1.08),
                    ]}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)" }}
                    {...tooltipBounds(AXIS_WIDTH)}
                    content={<ApiTooltip chart={chart} hidden={hidden} />}
                  />
                  {/* bars first so the lines are drawn over them */}
                  {shown
                    .filter((s) => s.type === "column")
                    .map((s) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        stackId={s.stack ?? s.key}
                        fill={seriesColor(chart.series, s.key)}
                        radius={2}
                        isAnimationActive={false}
                      />
                    ))}
                  {shown
                    .filter((s) => s.type === "area")
                    .map((s) => (
                      <Area
                        key={`${s.key}-fill`}
                        dataKey={s.key}
                        type="monotone"
                        stroke="none"
                        fill={seriesColor(chart.series, s.key)}
                        fillOpacity={0.16}
                        isAnimationActive={false}
                        activeDot={false}
                      />
                    ))}
                  {shown
                    .filter((s) => s.type !== "column")
                    .map((s) => {
                      const strong = s.type === "area"
                      return (
                        <Line
                          key={s.key}
                          dataKey={s.key}
                          type="monotone"
                          stroke={seriesColor(chart.series, s.key)}
                          strokeWidth={strong ? 3.5 : 1.75}
                          strokeOpacity={strong ? 1 : 0.9}
                          isAnimationActive={false}
                          dot={
                            dense
                              ? false
                              : {
                                  r: strong ? 3.5 : 2.5,
                                  strokeWidth: 2,
                                  stroke: "var(--card)",
                                }
                          }
                          activeDot={{
                            r: strong ? 5.5 : 4.5,
                            strokeWidth: 2,
                            stroke: "var(--card)",
                          }}
                        />
                      )
                    })}
                </ComposedChart>
              </ChartContainer>
            </div>
            <SeriesRail
              rows={railRows}
              hidden={hidden}
              onToggle={(key) => onHidden(toggleSeries(railRows, hidden, key))}
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

/** Which series open switched off — the response decides, not the page. */
export function initialHidden(chart: ApiChart | null) {
  return (chart?.series ?? []).filter((s) => !s.visible).map((s) => s.key)
}
