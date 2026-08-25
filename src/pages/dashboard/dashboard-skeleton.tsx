import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// mirrors the shared card-header layout in dashboard.tsx
const headerClass = "!flex flex-row items-center justify-between border-b"

function CardHeadSkeleton({
  title,
  desc,
  className,
}: {
  title: number
  desc: number
  className?: string
}) {
  return (
    <CardHeader className={cn(headerClass, className)}>
      <Skeleton className="h-4" style={{ width: title }} />
      <Skeleton className="h-3" style={{ width: desc }} />
    </CardHeader>
  )
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="gap-0 [--card-spacing:16px]">
          <CardContent className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 shrink-0 rounded" />
              <Skeleton
                className="h-3"
                style={{ width: 48 + ((i * 17) % 28) }}
              />
            </div>
            {/* number, then the delta pill on the row below it, right-aligned */}
            <div className="mt-2 flex flex-col items-start gap-1.5">
              <Skeleton
                className="h-7"
                style={{ width: 62 + ((i * 23) % 30) }}
              />
              <Skeleton className="h-5 w-11 self-end rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// the four funnel lines of the real chart, as y-coordinates in a 0..100 viewBox
// (0 is the top): ліди run high, then апрув, викуп and повернення below them.
// A plausible week, not the real numbers.
const LINE_SHAPES = [
  [26, 18, 30, 14, 22, 34, 24],
  [54, 48, 58, 44, 50, 62, 52],
  [72, 68, 76, 63, 69, 79, 71],
  [92, 89, 93, 88, 90, 94, 91],
]

// legend labels are "Ліди · Апрув · Викуп · Повернення" - the last one is long
const LEGEND_WIDTHS = [28, 38, 38, 70]

// the real chart draws its lines with type="monotone", so the skeleton rounds
// its corners the same way: a Catmull-Rom spline through the points, written
// out as the cubic segments svg understands
function smoothPath(ys: number[]) {
  const step = 100 / (ys.length - 1)
  // the ends have no neighbour to lean on, so they lean on themselves
  const at = (i: number) => {
    const j = Math.min(Math.max(i, 0), ys.length - 1)
    return { x: j * step, y: ys[j] }
  }
  const r = (n: number) => Math.round(n * 100) / 100
  let d = `M 0,${ys[0]}`
  for (let i = 0; i < ys.length - 1; i++) {
    const [prev, from, to, next] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = {
      x: from.x + (to.x - prev.x) / 6,
      y: from.y + (to.y - prev.y) / 6,
    }
    const c2 = {
      x: to.x - (next.x - from.x) / 6,
      y: to.y - (next.y - from.y) / 6,
    }
    d += ` C ${r(c1.x)},${r(c1.y)} ${r(c2.x)},${r(c2.y)} ${r(to.x)},${r(to.y)}`
  }
  return d
}

export function LeadsChartSkeleton() {
  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeadSkeleton title={132} desc={148} className="pb-3.5" />
      <CardContent className="flex flex-1 flex-col justify-end pt-4">
        <div className="flex h-[252px] flex-col">
          <div className="flex min-h-0 flex-1 gap-3">
            {/* stubs for the value axis, as wide as the real one */}
            <div className="flex w-8 shrink-0 flex-col justify-between py-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-2.5 w-full" />
              ))}
            </div>
            {/* stretched to the plot area, so the stroke is kept unscaled */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-full flex-1 animate-pulse"
            >
              {LINE_SHAPES.map((ys, i) => (
                <path
                  key={i}
                  d={smoothPath(ys)}
                  className="stroke-muted"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
          <div className="mt-2.5 flex justify-between pl-11">
            {LINE_SHAPES[0].map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-6" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 pt-3">
          {LEGEND_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="size-2 shrink-0 rounded-[2px]" />
              <Skeleton className="h-2.5" style={{ width: w }} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TopBuyersSkeleton() {
  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeadSkeleton title={92} desc={104} className="pb-3.5" />
      <CardContent className="px-0">
        <ScrollArea className="h-[286px] px-(--card-spacing)">
          <div className="flex flex-col pt-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton
                    className="h-3.5"
                    style={{ width: 96 + ((i * 29) % 44) }}
                  />
                  <Skeleton className="h-2.5 w-32" />
                </div>
                <Skeleton className="h-5 w-12 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function TopCallCentersSkeleton() {
  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeadSkeleton title={116} desc={92} className="pb-3.5" />
      <CardContent className="flex flex-col gap-3.5 py-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton
                className="h-3.5"
                style={{ width: 88 + ((i * 19) % 34) }}
              />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <div className="w-24 shrink-0">
              <Skeleton className="ml-auto h-3.5 w-14" />
              <Skeleton className="mt-1 h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// метрики рядка: замовлення · сума продажу · % викупу · дохід (ROI - бейдж)
const PRODUCT_COLS = [38, 56, 34, 50]

export function TopProductsSkeleton() {
  return (
    <Card className="gap-0 py-0 [--card-spacing:18px]">
      <CardHeadSkeleton title={168} desc={112} className="py-3.5" />
      <CardContent className="px-0">
        <ScrollArea className="h-[280px] px-(--card-spacing)">
          <div className="flex flex-col pt-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <Skeleton className="size-6 shrink-0 rounded-md" />
                <Skeleton
                  className="h-3.5 shrink-0"
                  style={{ width: 120 + ((i * 37) % 72) }}
                />
                <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
                  {PRODUCT_COLS.map((w, j) => (
                    <Skeleton
                      key={j}
                      className="h-3.5"
                      style={{ width: w + ((i * 11 + j * 7) % 12) }}
                    />
                  ))}
                  <Skeleton className="h-5 w-11 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// the data widgets only - reused for the short pulse after a date-range change
export function DashboardWidgetsSkeleton() {
  return (
    <>
      <KpiCardsSkeleton />
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <LeadsChartSkeleton />
        <TopBuyersSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <TopCallCentersSkeleton />
        <TopProductsSkeleton />
      </div>
    </>
  )
}

// full-page skeleton for the first load - mirrors the dashboard layout.
// the onboarding / no-plan callout is deliberately left out: it is static
// chrome rather than loaded data, so it just appears once the data lands.
export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <DashboardWidgetsSkeleton />
    </div>
  )
}
