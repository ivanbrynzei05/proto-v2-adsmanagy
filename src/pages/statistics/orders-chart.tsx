import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { plural } from "@/pages/campaigns/data"
import { fmtNum } from "@/pages/dashboard/data"
import {
  TOOLTIP_BOX,
  TooltipHead,
  TooltipSeries,
  tooltipBounds,
} from "./chart-tooltip"
import {
  CATEGORIES,
  type CategoryKey,
  type OrdersPoint,
  type OrdersReport,
} from "./data"
import {
  drawn,
  SeriesRail,
  toggleSeries,
  type SeriesRow,
} from "./series-rail"

const AXIS_WIDTH = 46
const LEADS = { key: "leads", label: "Ліди", color: "var(--viz-1)" }

// The line is the only metric on the chart, so it takes the first series slot;
// the columns underneath it are painted from the status set, which is a
// different job for colour entirely (state, not identity).
const CHART_CONFIG = {
  leads: { label: LEADS.label, color: LEADS.color },
  completed: { label: "Завершені", color: "var(--st-completed)" },
  approved: { label: "Підтверджені", color: "var(--st-approved)" },
  rejected: { label: "Відмови", color: "var(--st-rejected)" },
} satisfies ChartConfig

/**
 * The rail, top-down in the order the column is stacked, with the CRM statuses
 * each category is made of under it - a column is a roll-up of статуси, and
 * this is the one place on the screen they are read against their colour.
 *
 * Every status the period carried, not a top few: a name behind a "+12
 * статусів" is a name nobody can look up, and the rail scrolls inside itself
 * rather than growing the card. The counts of the categories themselves are
 * tiles under the chart, so no row here carries a figure of its own.
 */
function railRows(report: OrdersReport): SeriesRow[] {
  return [
    { key: LEADS.key, label: LEADS.label, color: LEADS.color, mark: "line" },
    ...[...CATEGORIES].reverse().map(
      (c): SeriesRow => ({
        key: c.key,
        label: c.label,
        color: c.color,
        mark: "bar",
        detail: report.statusTotals[c.key].map((s) => ({
          label: s.name,
          value: fmtNum(s.value),
        })),
      })
    ),
  ]
}

function pct(value: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

/** The rail's rows, read at one column: the counts and the statuses behind them. */
function tooltipRows(
  point: OrdersPoint,
  bars: { key: CategoryKey; label: string; color: string }[]
): SeriesRow[] {
  return [
    {
      key: LEADS.key,
      label: LEADS.label,
      color: LEADS.color,
      mark: "line",
      value: fmtNum(point.leads),
    },
    ...bars.map(
      (c): SeriesRow => ({
        key: c.key,
        label: c.label,
        color: c.color,
        mark: "bar",
        value: `${fmtNum(point[c.key])}  ${pct(point[c.key], point.leads)}`,
        // what the category is made of at this column, not over the period
        detail: point.statuses[c.key].map((s) => ({
          label: s.name,
          value: fmtNum(s.value),
        })),
      })
    ),
  ]
}

function OrdersTooltip({
  active,
  payload,
  bars,
}: {
  active?: boolean
  payload?: { payload?: OrdersPoint }[]
  bars: { key: CategoryKey; label: string; color: string }[]
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className={cn(TOOLTIP_BOX, "w-[280px] gap-1.5")}>
      <TooltipHead
        title={point.full}
        value={`${fmtNum(point.leads)} ${plural(point.leads, "лід", "ліди", "лідів")}`}
      />
      <TooltipSeries rows={tooltipRows(point, bars)} />
    </div>
  )
}

function Plot({
  report,
  bars,
  line,
}: {
  report: OrdersReport
  bars: { key: CategoryKey; label: string; color: string }[]
  line: boolean
}) {
  const { points } = report
  const dense = points.length > 24

  return (
    <ChartContainer config={CHART_CONFIG} className="h-[268px] w-full">
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
          content={<OrdersTooltip bars={bars} />}
        />
        {/* stacked bottom-up: the money on the baseline, the losses capping the
            column. Every segment is rounded on all four corners, not just the
            one on top - together with the card-coloured stroke that puts a 2px
            gap between two touching ones, the column reads as the few pieces it
            is made of rather than as one bar with a cap. Recharts holds the
            radius to half the segment, so a thin slice stays a thin slice. */}
        {CATEGORIES.filter((c) => bars.some((b) => b.key === c.key)).map(
          (c) => (
            <Bar
              key={c.key}
              dataKey={c.key}
              stackId="status"
              fill={c.color}
              stroke="var(--card)"
              strokeWidth={2}
              maxBarSize={26}
              radius={4}
            />
          )
        )}
        {line && (
          <Line
            dataKey="leads"
            type="monotone"
            stroke="var(--color-leads)"
            strokeWidth={2}
            dot={
              dense ? false : { r: 3, strokeWidth: 2, stroke: "var(--card)" }
            }
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--card)" }}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  )
}

export function OrdersReportCard({
  report,
  hidden,
  onHidden,
  className,
}: {
  report: OrdersReport
  hidden: string[]
  onHidden: (next: string[]) => void
  className?: string
}) {
  const bars = drawn(CATEGORIES, hidden)
  const rows = railRows(report)

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:gap-4">
        {report.points.length > 0 ? (
          <>
            <div className="min-w-0 flex-1">
              <Plot
                report={report}
                bars={[...bars].reverse()}
                line={!hidden.includes(LEADS.key)}
              />
            </div>
            <SeriesRail
              rows={rows}
              hidden={hidden}
              onToggle={(key) => onHidden(toggleSeries(rows, hidden, key))}
            />
          </>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            За цей період ще немає даних
          </p>
        )}
      </CardContent>
    </Card>
  )
}
