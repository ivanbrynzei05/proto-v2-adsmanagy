import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconChartHistogram,
  IconFilterOff,
} from "@tabler/icons-react"
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DisplayCurrency } from "@/features/currency/types"
import { cn } from "@/lib/utils"
import { fmt, plural, type Column } from "@/pages/campaigns/data"
import {
  delta,
  deltaIsGood,
  fmtCompact,
  isTimeDimension,
  seriesColor,
  type Report,
  type ReportPoint,
  type SelectedMetric,
} from "./data"

// ---- shared formatting ----

function tileValue(value: number, column: Column, currency: DisplayCurrency) {
  const body = fmtCompact(value, column.unit, currency.rate)
  return column.unit === "₴" ? `${body} ${currency.symbol}` : body
}

const headerClass = "!flex flex-row items-center justify-between gap-3 border-b"
const titleClass = "text-[15px] font-bold tracking-tight"

// ---- stat tiles ----

// Hand-drawn sparkline: 40-odd daily points, no axes, no interaction - it is
// the shape of the period behind the number, and the chart below carries the
// readable version.
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const w = 96
  const h = 26
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = w / (values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / span) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetricTile({
  metric,
  report,
  currency,
}: {
  metric: SelectedMetric
  report: Report
  currency: DisplayCurrency
}) {
  const value = report.totals[metric.key]
  const change = report.prev ? delta(value, report.prev[metric.key]) : null
  const good = change !== null && deltaIsGood(metric.key, change)
  const color = seriesColor(metric.slot)

  return (
    <Card className="gap-0 [--card-spacing:16px]">
      <div className="flex flex-col px-(--card-spacing)">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
          <span className="truncate">{metric.column.label}</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-2xl font-extrabold tracking-tight">
              {tileValue(value, metric.column, currency)}
            </div>
            {change !== null && (
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-0.5 text-xs font-semibold",
                  good
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {change >= 0 ? (
                  <IconArrowUpRight className="size-3.5" />
                ) : (
                  <IconArrowDownRight className="size-3.5" />
                )}
                {Math.abs(change)}%
                <span className="font-medium text-muted-foreground">
                  до минулого періоду
                </span>
              </span>
            )}
          </div>
          <Sparkline
            values={report.spark.map((p) => p[metric.key])}
            color={color}
          />
        </div>
      </div>
    </Card>
  )
}

export function MetricTiles({
  report,
  currency,
}: {
  report: Report
  currency: DisplayCurrency
}) {
  return (
    <div
      className={cn(
        "grid gap-3.5",
        report.metrics.length === 1
          ? "grid-cols-1"
          : report.metrics.length === 2
            ? "sm:grid-cols-2"
            : report.metrics.length === 3
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2 xl:grid-cols-4"
      )}
    >
      {report.metrics.map((m) => (
        <MetricTile
          key={m.key}
          metric={m}
          report={report}
          currency={currency}
        />
      ))}
    </div>
  )
}

// ---- tooltip ----

type TooltipPayload = {
  dataKey?: string | number
  value?: number
  payload?: ReportPoint
}

function ReportTooltip({
  metrics,
  currency,
  active,
  payload,
  label,
}: {
  metrics: SelectedMetric[]
  currency: DisplayCurrency
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  const shown = metrics.filter((m) => payload.some((p) => p.dataKey === m.key))

  return (
    <div className="grid min-w-48 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl">
      <div className="font-medium">{point?.label ?? label}</div>
      {point?.sub && (
        <div className="-mt-1 text-muted-foreground">{point.sub}</div>
      )}
      {shown.map((m) => (
        <div key={m.key} className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: seriesColor(m.slot) }}
          />
          <span className="text-muted-foreground">{m.column.label}</span>
          <span className="ml-auto font-medium tabular-nums">
            {fmt(point?.[m.key], m.column.unit, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

type Slice = { key: string; label: string; value: number; color: string }

// The donut's payload is a slice, not a report point, so it gets its own
// tooltip: the category, the value and its share of the ring.
function SliceTooltip({
  column,
  currency,
  total,
  active,
  payload,
}: {
  column: Column
  currency: DisplayCurrency
  total: number
  active?: boolean
  payload?: { payload?: Slice }[]
}) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null
  return (
    <div className="grid min-w-40 gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2 font-medium">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: slice.color }}
        />
        {slice.label}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{column.label}</span>
        <span className="ml-auto font-medium tabular-nums">
          {fmt(slice.value, column.unit, currency)}
        </span>
        <span className="w-9 text-right text-muted-foreground tabular-nums">
          {Math.round((slice.value / (total || 1)) * 100)}%
        </span>
      </div>
    </div>
  )
}

function Legend({ metrics }: { metrics: SelectedMetric[] }) {
  if (metrics.length < 2) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 text-xs text-muted-foreground">
      {metrics.map((m) => (
        <span key={m.key} className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: seriesColor(m.slot) }}
          />
          {m.column.label}
          {m.column.unit && (
            <span className="text-muted-foreground/70">, {m.column.unit}</span>
          )}
        </span>
      ))}
    </div>
  )
}

// ---- the chart itself ----

const AXIS_TICK = { fontSize: 11 }

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

// Direct labels only pay off while they are sparse - past a couple of series or
// a dozen columns they turn into noise, so they quietly switch off.
function labelsFit(report: Report, metrics: SelectedMetric[]) {
  return (
    report.params.labels && metrics.length <= 2 && report.points.length <= 12
  )
}

// Labels are drawn by hand rather than through LabelList's own text: recharts
// hands its label the mark's width, and a 24px-wide column then wraps "1,2 К"
// onto two lines and pushes the first one out of the plot.
type MarkLabel = {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  value?: unknown
  index?: number
}

const LABEL_CLASS = "fill-foreground text-[11px] font-semibold"
// recharts wants a renderable back, so "no label here" is an empty group
const NO_LABEL = <g />

const px = (v: string | number | undefined) => Number(v ?? 0)

// Axis ends land on round numbers (600, not 543) with a little headroom over
// the tallest mark, so a cap label never sits on the card's edge.
function niceBound(value: number, headroom: number) {
  if (value === 0) return 0
  const target = Math.abs(value) * headroom
  const step = Math.pow(10, Math.floor(Math.log10(target))) / 2
  const rounded = Math.ceil(target / step) * step
  return value < 0 ? -rounded : rounded
}

// value on the cap of a column
function capLabel(format: (v: number) => string) {
  return function CapLabel({ x, y, width, value }: MarkLabel) {
    return (
      <text
        x={px(x) + px(width) / 2}
        y={px(y) - 7}
        textAnchor="middle"
        className={LABEL_CLASS}
      >
        {format(Number(value))}
      </text>
    )
  }
}

// value at the tip of a horizontal bar
function tipLabel(format: (v: number) => string) {
  return function TipLabel({ x, y, width, height, value }: MarkLabel) {
    return (
      <text
        x={px(x) + px(width) + 8}
        y={px(y) + px(height) / 2}
        dominantBaseline="central"
        className={LABEL_CLASS}
      >
        {format(Number(value))}
      </text>
    )
  }
}

// a line gets one label, at its end - a number on every point is noise
function endLabel(format: (v: number) => string, last: number) {
  return function EndLabel({ x, y, value, index }: MarkLabel) {
    if (index !== last) return NO_LABEL
    return (
      <text x={px(x)} y={px(y) - 10} textAnchor="end" className={LABEL_CLASS}>
        {format(Number(value))}
      </text>
    )
  }
}

function chartConfigOf(metrics: SelectedMetric[]): ChartConfig {
  return Object.fromEntries(
    metrics.map((m) => [
      m.key,
      { label: m.column.label, color: seriesColor(m.slot) },
    ])
  )
}

// One facet = one y axis = metrics that share a unit. Two units never share a
// plot: a second scale would invent a relationship that is not in the data.
function Facet({
  report,
  metrics,
  currency,
  compact,
}: {
  report: Report
  metrics: SelectedMetric[]
  currency: DisplayCurrency
  compact: boolean
}) {
  const { params, points } = report
  const kind = params.chart
  const unit = metrics[0].column.unit
  const config = chartConfigOf(metrics)
  const showLabels = labelsFit(report, metrics)
  // a trend line labels only its endpoint, so it does not need the column cap's
  // budget of a dozen points - just few enough series that the ends don't collide
  const lineLabels = params.labels && metrics.length <= 2
  const axisFmt = (v: number) => fmtCompact(v, unit, currency.rate)
  const hasNegative = points.some((p) => metrics.some((m) => p[m.key] < 0))

  if (kind === "donut") {
    return (
      <DonutFacet
        report={report}
        metric={metrics[0]}
        currency={currency}
        compact={compact}
      />
    )
  }

  if (kind === "hbar") {
    const rowHeight = 28 + metrics.length * 14
    const height = Math.max(200, points.length * rowHeight + 36)
    return (
      <>
        <ChartContainer
          config={config}
          className="w-full"
          style={{ height, aspectRatio: "auto" }}
        >
          <ComposedChart
            layout="vertical"
            data={points}
            margin={{ left: 4, right: showLabels ? 48 : 12, top: 4 }}
            barCategoryGap="22%"
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={axisFmt}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={compact ? 96 : 150}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={(v: string) => truncate(v, compact ? 12 : 20)}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={<ReportTooltip metrics={metrics} currency={currency} />}
            />
            {metrics.map((m) => (
              <Bar
                key={m.key}
                dataKey={m.key}
                fill={seriesColor(m.slot)}
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {showLabels && (
                  <LabelList
                    dataKey={m.key}
                    content={tipLabel((v) =>
                      fmtCompact(v, m.column.unit, currency.rate)
                    )}
                  />
                )}
              </Bar>
            ))}
          </ComposedChart>
        </ChartContainer>
        <Legend metrics={metrics} />
      </>
    )
  }

  const timeCut = isTimeDimension(params.dim)

  return (
    <>
      <ChartContainer
        config={config}
        className={cn("w-full", compact ? "h-[220px]" : "h-[300px]")}
      >
        <ComposedChart
          data={points}
          margin={{ left: 4, right: 12, top: showLabels ? 20 : 8 }}
          barCategoryGap="24%"
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={AXIS_TICK}
            minTickGap={timeCut ? 16 : 4}
            interval={timeCut ? "preserveStartEnd" : 0}
            tickFormatter={(v: string) =>
              truncate(v, timeCut ? 12 : compact ? 7 : 11)
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={AXIS_TICK}
            tickFormatter={axisFmt}
            domain={[
              (min: number) => (min < 0 ? niceBound(min, 1.05) : 0),
              (max: number) => niceBound(max, showLabels ? 1.12 : 1.02),
            ]}
          />
          {hasNegative && <ReferenceLine y={0} stroke="var(--border)" />}
          <ChartTooltip
            cursor={
              kind === "bar"
                ? { fill: "var(--muted)", opacity: 0.5 }
                : { stroke: "var(--border)" }
            }
            content={<ReportTooltip metrics={metrics} currency={currency} />}
          />
          {metrics.map((m) => {
            const color = seriesColor(m.slot)
            const format = (v: number) =>
              fmtCompact(v, m.column.unit, currency.rate)
            // columns carry a value per cap; a line only labels its last point
            const capLabels = showLabels && (
              <LabelList dataKey={m.key} content={capLabel(format)} />
            )
            const endLabels = lineLabels && (
              <LabelList
                dataKey={m.key}
                content={endLabel(format, points.length - 1)}
              />
            )
            if (kind === "bar")
              return (
                <Bar
                  key={m.key}
                  dataKey={m.key}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {capLabels}
                </Bar>
              )
            if (kind === "area")
              return (
                <Area
                  key={m.key}
                  dataKey={m.key}
                  type="monotone"
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.1}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                >
                  {endLabels}
                </Area>
              )
            return (
              <Line
                key={m.key}
                dataKey={m.key}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              >
                {endLabels}
              </Line>
            )
          })}
        </ComposedChart>
      </ChartContainer>
      <Legend metrics={metrics} />
    </>
  )
}

// Part-to-whole, so only the first four categories keep a colour of their own -
// the tail is one grey "Інше" slice and the exact numbers live in the list
// beside the ring and in the data table.
const REST_COLOR =
  "color-mix(in oklab, var(--muted-foreground) 40%, var(--card))"

function DonutFacet({
  report,
  metric,
  currency,
  compact,
}: {
  report: Report
  metric: SelectedMetric
  currency: DisplayCurrency
  compact: boolean
}) {
  const positive = report.points.filter((p) => p[metric.key] > 0)
  const sorted = [...positive].sort((a, b) => b[metric.key] - a[metric.key])
  const head = sorted.slice(0, 4)
  const tail = sorted.slice(4)
  const slices: Slice[] = [
    ...head.map((p, i) => ({
      key: p.key,
      label: p.label,
      value: p[metric.key],
      color: seriesColor(i),
    })),
    ...(tail.length
      ? [
          {
            key: "__rest__",
            label: `Інше · ${tail.length}`,
            value: tail.reduce((s, p) => s + p[metric.key], 0),
            color: REST_COLOR,
          },
        ]
      : []),
  ]
  const total = slices.reduce((s, x) => s + x.value, 0)

  if (slices.length === 0) {
    return (
      <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
        Немає додатних значень для часток
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4",
        compact ? "flex-col" : "flex-col sm:flex-row"
      )}
    >
      <ChartContainer
        config={{}}
        className={cn(
          "shrink-0",
          compact ? "h-[190px] w-[190px]" : "h-[240px] w-[240px]"
        )}
      >
        <PieChart>
          <ChartTooltip
            content={
              <SliceTooltip
                column={metric.column}
                currency={currency}
                total={total}
              />
            }
          />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {slices.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* the legend is also the direct label: name, value, share */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="font-medium tabular-nums">
              {fmt(s.value, metric.column.unit, currency)}
            </span>
            <span className="w-10 text-right text-muted-foreground tabular-nums">
              {Math.round((s.value / (total || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Metrics are grouped by unit; each group is a facet with its own axis. Donuts
// are one metric each by definition.
function facetsOf(report: Report): SelectedMetric[][] {
  if (report.params.chart === "donut") return report.metrics.map((m) => [m])
  const byUnit = new Map<string, SelectedMetric[]>()
  for (const m of report.metrics) {
    const list = byUnit.get(m.column.unit) ?? []
    list.push(m)
    byUnit.set(m.column.unit, list)
  }
  return [...byUnit.values()]
}

const UNIT_TITLE: Record<string, string> = {
  "": "Кількість",
  "₴": "Гроші",
  "%": "Відсотки",
}

export function ReportCharts({
  report,
  currency,
}: {
  report: Report
  currency: DisplayCurrency
}) {
  const facets = facetsOf(report)
  const split = facets.length > 1

  return (
    <div className={cn("grid gap-4", split && "xl:grid-cols-2")}>
      {facets.map((metrics) => {
        // the card is named after what it plots; the unit family sits on the
        // right, where a single metric shows its own explanation instead
        const title = metrics.map((m) => m.column.label).join(" · ")
        const note =
          metrics.length > 1
            ? (UNIT_TITLE[metrics[0].column.unit] ?? "")
            : metrics[0].column.hint
        return (
          <Card
            key={metrics.map((m) => m.key).join("+")}
            className="gap-0 py-3.5 [--card-spacing:18px]"
          >
            <CardHeader className={cn(headerClass, "pb-3.5")}>
              <CardTitle className={cn(titleClass, "truncate")}>
                {title}
              </CardTitle>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {note}
              </span>
            </CardHeader>
            <div className="px-(--card-spacing) pt-4">
              <Facet
                report={report}
                metrics={metrics}
                currency={currency}
                compact={split}
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ---- data table (the readable twin of every chart) ----

export function ReportTable({
  report,
  currency,
}: {
  report: Report
  currency: DisplayCurrency
}) {
  const { points, metrics, totals } = report

  return (
    <Card className="gap-0 py-0 [--card-spacing:18px]">
      <CardHeader className={cn(headerClass, "py-3.5")}>
        <CardTitle className={titleClass}>Дані звіту</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          {points.length} {plural(points.length, "рядок", "рядки", "рядків")}
        </span>
      </CardHeader>
      <div className="px-0">
        <ScrollArea className={cn(points.length > 12 && "h-[420px]")}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="pl-[18px]">
                  {report.params.dim === "date" ? "Період" : "Назва"}
                </TableHead>
                {metrics.map((m) => (
                  <TableHead key={m.key} className="text-right last:pr-[18px]">
                    {m.column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((p) => (
                <TableRow key={p.key}>
                  <TableCell className="pl-[18px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.label}</span>
                      {p.sub && (
                        <span className="text-xs text-muted-foreground">
                          {p.sub}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {metrics.map((m) => (
                    <TableCell
                      key={m.key}
                      className="text-right tabular-nums last:pr-[18px]"
                    >
                      {fmt(p[m.key], m.column.unit, currency)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-[18px] font-semibold">Разом</TableCell>
                {metrics.map((m) => (
                  <TableCell
                    key={m.key}
                    className="text-right font-semibold tabular-nums last:pr-[18px]"
                  >
                    {fmt(totals[m.key], m.column.unit, currency)}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  )
}

// ---- states ----

export function NoDataCard({ onReset }: { onReset: () => void }) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-muted">
          <IconFilterOff className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            Немає даних за цими параметрами
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Жодна кампанія не пройшла фільтри та пороги - послабте умови зліва
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Скинути параметри
        </button>
      </div>
    </Card>
  )
}

// Before the first "Застосувати" the canvas is deliberately empty - the page is
// a report builder, so the chart only exists once it has been asked for.
export function EmptyCanvas({ summary }: { summary: string }) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <svg
          width="132"
          height="56"
          viewBox="0 0 132 56"
          fill="none"
          className="text-muted-foreground/35"
        >
          <path
            d="M4 44 L30 24 L56 34 L82 12 L108 26 L128 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
          <circle cx="30" cy="24" r="3" fill="currentColor" />
          <circle cx="82" cy="12" r="3" fill="currentColor" />
          <circle cx="128" cy="8" r="3" fill="currentColor" />
        </svg>
        <div className="max-w-sm">
          <div className="flex items-center justify-center gap-1.5">
            <IconChartHistogram className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Звіт ще не побудовано</p>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Оберіть параметри в панелі та натисніть «Застосувати» - графік
            з’явиться тут
          </p>
        </div>
        <p className="rounded-lg bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
          {summary}
        </p>
      </div>
    </Card>
  )
}
