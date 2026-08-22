import {
  IconArrowsSplit2,
  IconCalendar,
  IconCrown,
  IconFilter,
  IconLock,
  IconRefresh,
  IconSpeakerphone,
} from "@tabler/icons-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useCurrency } from "@/components/currency-provider"
import { useDataSources } from "@/components/data-sources-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PricingDialog } from "@/features/billing/pricing-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { plural } from "@/pages/campaigns/data"
import { rangeLabel, startOfDay } from "@/pages/campaigns/date-utils"
import {
  activeFilterCount,
  buildReport,
  defaultParams,
  DIMENSIONS,
  isTimeDimension,
  normalizeParams,
  selectedMetrics,
  type Report,
  type ReportParams,
} from "./data"
import { ParamsPanel } from "./params-panel"
import {
  EmptyCanvas,
  MetricTiles,
  NoDataCard,
  ReportCharts,
  ReportTable,
} from "./report-view"

// Two parameter sets are in play at once: the draft the panel edits, and the
// one the report on the right was actually built from. This is the comparison
// that decides whether "Застосувати" still has anything to do.
function paramsKey(p: ReportParams) {
  return JSON.stringify({
    ...p,
    range: { from: p.range.from.getTime(), to: p.range.to.getTime() },
  })
}

function dimLabel(p: ReportParams) {
  return DIMENSIONS.find((d) => d.id === p.dim)?.label ?? p.dim
}

function draftSummary(p: ReportParams, today: Date) {
  const metrics = selectedMetrics(p.metrics)
  return [
    rangeLabel(p.range, today),
    dimLabel(p),
    metrics.length
      ? metrics.map((m) => m.column.label).join(" · ")
      : "без метрик",
  ].join("  ·  ")
}

function Chip({
  icon: ChipIcon,
  children,
}: {
  icon: typeof IconCalendar
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium shadow-xs">
      <ChipIcon className="size-3.5 text-muted-foreground" />
      {children}
    </span>
  )
}

// What the drawing below is actually made of - the applied parameters, not the
// draft ones, so the chips never describe a report that is not on screen.
function ReportSummary({ report, today }: { report: Report; today: Date }) {
  const p = report.params
  const filters = activeFilterCount(p)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip icon={IconCalendar}>
        {rangeLabel(p.range, today)}
        <span className="text-muted-foreground">
          · {report.days} {plural(report.days, "день", "дні", "днів")}
          {isTimeDimension(p.dim) && p.step === "week" && ", по тижнях"}
        </span>
      </Chip>
      <Chip icon={IconArrowsSplit2}>
        <span className="text-muted-foreground">Розріз:</span>
        {dimLabel(p)}
      </Chip>
      <Chip icon={IconSpeakerphone}>
        {report.campaigns}{" "}
        {plural(report.campaigns, "кампанія", "кампанії", "кампаній")}
      </Chip>
      {filters > 0 && (
        <Chip icon={IconFilter}>
          {filters} {plural(filters, "фільтр", "фільтри", "фільтрів")}
        </Chip>
      )}
      {report.folded > 0 && (
        <Chip icon={IconFilter}>
          <span className="text-muted-foreground">
            {report.folded} поз. згорнуто в «Інше»
          </span>
        </Chip>
      )}
    </div>
  )
}

// The draft moved on but the chart has not - the previous render stays put
// (nothing jumps) and this strip is the way back to a matching report.
function StaleStrip({ onApply }: { onApply: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.06] px-3.5 py-2.5">
      <IconRefresh className="size-4 text-primary" />
      <span className="text-[13px] font-medium">
        Параметри змінено - графік показує попередній звіт
      </span>
      <Button size="sm" className="ml-auto" onClick={onApply}>
        Оновити звіт
      </Button>
    </div>
  )
}

function NoPlanCard() {
  const [pricingOpen, setPricingOpen] = useState(false)
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-destructive/10">
          <IconLock className="size-5 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold">Немає активного тарифу</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Підключіть тариф, щоб будувати звіти по своїх кампаніях
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => setPricingOpen(true)}
        >
          <IconCrown className="size-4" />
          Обрати тариф
        </Button>
      </div>
      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </Card>
  )
}

export function StatisticsPage() {
  const { currency } = useCurrency()
  const { noPlan } = useDataSources()
  const isMobile = useIsMobile()
  const today = useMemo(() => startOfDay(new Date()), [])
  // on a phone the panel is as tall as the report, so it folds away once the
  // report is drawn and the header keeps a "Змінити" way back into it
  const [panelOpen, setPanelOpen] = useState(true)

  const [draft, setDraft] = useState<ReportParams>(defaultParams)
  // null until the first "Застосувати" - the page starts as an empty canvas
  const [applied, setApplied] = useState<ReportParams | null>(null)
  const [building, setBuilding] = useState(false)
  const buildRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (buildRef.current) window.clearTimeout(buildRef.current)
    },
    []
  )

  function patch(next: Partial<ReportParams>) {
    setDraft((p) => normalizeParams({ ...p, ...next }))
  }

  function apply() {
    setApplied(draft)
    if (isMobile) setPanelOpen(false)
    // hold the fresh render back for a beat so pressing the button visibly
    // does something, without a skeleton flash swapping the layout out
    setBuilding(true)
    if (buildRef.current) window.clearTimeout(buildRef.current)
    buildRef.current = window.setTimeout(() => setBuilding(false), 380)
  }

  function reset() {
    setDraft(defaultParams())
  }

  const report = useMemo(
    () => (applied ? buildReport(applied) : null),
    [applied]
  )
  const dirty = !applied || paramsKey(draft) !== paramsKey(applied)

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Статистика</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Конструктор звітів: оберіть період, розріз, метрики та фільтри - і
            побудуйте графік
          </p>
        </div>
        {report && !noPlan && <ReportSummary report={report} today={today} />}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-6 xl:max-h-[calc(100svh-3rem)] xl:overflow-y-auto">
          <ParamsPanel
            params={draft}
            patch={patch}
            dirty={dirty}
            onApply={apply}
            onReset={reset}
            collapsed={isMobile && !panelOpen}
            onToggleCollapsed={
              isMobile && report ? () => setPanelOpen((v) => !v) : undefined
            }
          />
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-col gap-4 transition-opacity duration-200",
            building && "opacity-50"
          )}
        >
          {noPlan ? (
            <NoPlanCard />
          ) : !report ? (
            <EmptyCanvas summary={draftSummary(draft, today)} />
          ) : report.campaigns === 0 ? (
            <>
              {dirty && <StaleStrip onApply={apply} />}
              <NoDataCard onReset={reset} />
            </>
          ) : (
            <>
              {dirty && <StaleStrip onApply={apply} />}
              <MetricTiles report={report} currency={currency} />
              <ReportCharts report={report} currency={currency} />
              <ReportTable report={report} currency={currency} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
