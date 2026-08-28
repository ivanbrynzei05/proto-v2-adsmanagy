import { useEffect, useMemo, useRef, useState } from "react"

import { useIntegrations } from "@/components/integrations-provider"
import { useTeam } from "@/components/team-provider"
import { CRM_TYPES } from "@/features/integrations/types"
import {
  addDays,
  startOfDay,
  type DateRange,
} from "@/pages/campaigns/date-utils"
import {
  buildAdsReport,
  buildCentersReport,
  centerOptions,
  buildIncomeReport,
  buildOrdersReport,
  buildProductsReport,
  DEFAULT_ADS_HIDDEN,
  EMPTY_FILTERS,
  stepFor,
  type BreakdownId,
  type ReportFilters,
} from "./data"
import { BreakdownTabs } from "./breakdown-tabs"
import { FiltersPanel } from "./filters-panel"
import { ReportSkeleton, StatisticsSkeleton } from "./statistics-skeleton"
import { IncomeReportCard } from "./income-chart"
import { IncomeMetricsCard } from "./income-metrics"
import { AdsReportCard } from "./ads-chart"
import { AdsMetricsCard } from "./ads-metrics"
import { CentersReportCard } from "./centers-chart"
import { CentersMetricsCard } from "./centers-metrics"
import { OrdersReportCard } from "./orders-chart"
import { OrdersMetricsCard } from "./orders-metrics"
import { ProductsReportCard } from "./products-chart"
import { ProductsMetricsCard } from "./products-metrics"

export function StatisticsPage() {
  const { connectedCrms, callCenters } = useIntegrations()
  // the team is a scope on the report, not a source: a lead or the owner reads
  // the same breakdowns for one buyer instead of for the whole account
  const { members } = useTeam()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [range, setRange] = useState<DateRange>(() => ({
    from: addDays(today, -6),
    to: today,
  }))
  // the page opens on Дохід: it is the one cut that says something before any
  // choice is made, and an empty page said nothing at all
  const [breakdown, setBreakdown] = useState<BreakdownId>("income")
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS)
  // Which series each chart leaves out - every breakdown opens on all of them,
  // and a choice is kept per breakdown rather than shared, since the series of
  // one have nothing to do with the series of another. It lives here so a new
  // period or filter, which swaps the report for its skeleton, does not throw
  // the choice away.
  const [hidden, setHidden] = useState<Record<BreakdownId, string[]>>({
    income: [],
    orders: [],
    callcenters: [],
    ads: DEFAULT_ADS_HIDDEN,
    products: [],
  })

  function hide(next: string[]) {
    setHidden((prev) => ({ ...prev, [breakdown]: next }))
  }
  // the cut follows the period on its own - every step is capped at the same
  // thirty columns, so the finest one that fits is the only sensible answer
  const step = useMemo(() => stepFor(range), [range])

  // Loading skeletons: the whole page on first load, and the report on its own
  // whenever the breakdown, the period or a filter changes - the tabs and the
  // panel stay live, so the control that started it is still under the cursor.
  const [firstLoad, setFirstLoad] = useState(true)
  const [reloading, setReloading] = useState(false)
  const pulseRef = useRef<number | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setFirstLoad(false), 750)
    return () => {
      window.clearTimeout(t)
      if (pulseRef.current) window.clearTimeout(pulseRef.current)
    }
  }, [])

  function pulse(ms = 500) {
    setReloading(true)
    if (pulseRef.current) window.clearTimeout(pulseRef.current)
    pulseRef.current = window.setTimeout(() => setReloading(false), ms)
  }

  function pickRange(next: DateRange) {
    setRange(next)
    pulse()
  }

  function pickBreakdown(next: BreakdownId) {
    setBreakdown(next)
    pulse()
  }

  function pickFilters(next: ReportFilters) {
    setFilters(next)
    pulse()
  }

  const incomeReport = useMemo(
    () =>
      breakdown === "income"
        ? buildIncomeReport(range, step, filters, members)
        : null,
    [breakdown, range, step, filters, members]
  )

  // The CRMs the account has connected are what the columns are cut by; without
  // a connection the picker offers the two we support and the report falls back
  // to the demo status list.
  const crmOptions = useMemo(
    () =>
      connectedCrms.length
        ? connectedCrms.map((c) => ({ id: c.label, name: c.label }))
        : CRM_TYPES.map((t) => ({ id: t, name: t })),
    [connectedCrms]
  )
  // the centres the report will actually be built from - connected, or the demo
  // set when the account has none. The panel offers exactly this list.
  const centerPicks = useMemo(
    () => centerOptions(callCenters).map((c) => ({ id: c.name, name: c.name })),
    [callCenters]
  )
  const pickedCrms = useMemo(
    () =>
      filters.crms.length
        ? connectedCrms.filter((c) => filters.crms.includes(c.label))
        : connectedCrms,
    [connectedCrms, filters.crms]
  )
  const ordersReport = useMemo(
    () =>
      breakdown === "orders"
        ? buildOrdersReport(range, step, filters, pickedCrms, members)
        : null,
    [breakdown, range, step, filters, pickedCrms, members]
  )

  const centersReport = useMemo(
    () =>
      breakdown === "callcenters"
        ? buildCentersReport(range, step, filters, callCenters, members)
        : null,
    [breakdown, range, step, filters, callCenters, members]
  )

  const productsReport = useMemo(
    () =>
      breakdown === "products"
        ? buildProductsReport(range, step, filters, members)
        : null,
    [breakdown, range, step, filters, members]
  )

  const adsReport = useMemo(
    () =>
      breakdown === "ads"
        ? buildAdsReport(range, step, filters, members)
        : null,
    [breakdown, range, step, filters, members]
  )

  if (firstLoad) return <StatisticsSkeleton />

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-bold tracking-tight">Статистика</h1>
        {/* what the report is cut by comes first, above everything it rules */}
        <BreakdownTabs value={breakdown} onChange={pickBreakdown} />
      </div>

      {/* the panel rides on the right of the chart; stacked, it goes on top -
          the period comes before the thing it draws */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="order-2 min-w-0 lg:order-1">
          {reloading ? (
            <ReportSkeleton />
          ) : incomeReport ? (
            <div className="flex flex-col gap-4">
              <IncomeReportCard
                report={incomeReport}
                hidden={hidden.income}
                onHidden={hide}
              />
              <IncomeMetricsCard report={incomeReport} />
            </div>
          ) : ordersReport ? (
            <div className="flex flex-col gap-4">
              <OrdersReportCard
                report={ordersReport}
                hidden={hidden.orders}
                onHidden={hide}
              />
              <OrdersMetricsCard report={ordersReport} />
            </div>
          ) : centersReport ? (
            <div className="flex flex-col gap-4">
              <CentersReportCard
                report={centersReport}
                hidden={hidden.callcenters}
                onHidden={hide}
              />
              <CentersMetricsCard report={centersReport} />
            </div>
          ) : productsReport ? (
            <div className="flex flex-col gap-4">
              <ProductsReportCard
                report={productsReport}
                hidden={hidden.products}
                onHidden={hide}
              />
              <ProductsMetricsCard report={productsReport} />
            </div>
          ) : adsReport ? (
            <div className="flex flex-col gap-4">
              <AdsReportCard
                report={adsReport}
                hidden={hidden.ads}
                onHidden={hide}
              />
              <AdsMetricsCard report={adsReport} />
            </div>
          ) : (
            <ReportSkeleton />
          )}
        </div>

        {/* the header is sticky and 3.5rem tall, so the panel parks below it
            rather than sliding under it; with every group open it can outgrow
            the viewport, and then it scrolls inside itself */}
        <div className="order-1 lg:sticky lg:top-20 lg:order-2 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <FiltersPanel
            range={range}
            onRange={pickRange}
            filters={filters}
            onFilters={pickFilters}
            crmOptions={crmOptions}
            centerOptions={centerPicks}
            members={members}
          />
        </div>
      </div>
    </div>
  )
}
