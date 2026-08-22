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

// bar heights (% of the plot area) - a plausible week, not the real numbers
const BAR_HEIGHTS = [56, 64, 56, 73, 80, 48, 42]

export function LeadsChartSkeleton() {
  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeadSkeleton title={132} desc={148} className="pb-3.5" />
      <CardContent className="flex flex-1 flex-col justify-end pt-4">
        <div className="flex h-[280px] items-end gap-2 px-1 sm:px-3">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex h-full flex-1 flex-col items-center gap-2.5"
            >
              <div className="flex w-full flex-1 items-end justify-center">
                <Skeleton
                  className="w-full max-w-12 rounded-t-lg"
                  style={{ height: `${h}%` }}
                />
              </div>
              <Skeleton className="h-3 w-6 shrink-0" />
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
