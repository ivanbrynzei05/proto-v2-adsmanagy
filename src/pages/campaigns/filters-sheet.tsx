import {
  IconCalendar,
  IconChevronDown,
  IconColumns,
  IconRestore,
  IconX,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { matchingAccounts, type ReportFilters } from "@/pages/statistics/data"
import { useDraftFilters } from "@/pages/statistics/draft-filters"
import { adsTree, TreePicker } from "@/pages/statistics/filter-tree"
import { COL_GROUPS, COLUMNS, PRESETS, type ColumnGroup } from "./data"
import { RangePanel } from "./date-range"
import {
  datePresets,
  rangeLabel,
  startOfDay,
  type DateRange,
} from "./date-utils"
import { ChipRow, ToggleChip } from "./toggle-chip"

// stands for "any range that isn't one of the named presets"
const CUSTOM_PERIOD = "__custom__"

// ---- shared bits ----

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {hint && (
          <span className="text-[11px] text-muted-foreground/80">{hint}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ---- the sheet ----

export type FiltersSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void

  dateRange: DateRange
  onDateRange: (r: DateRange) => void

  breakdown: string
  breakdowns: string[]
  onBreakdown: (b: string) => void

  /** the one Реклама filter - платформа › бізнес-акаунт › кабінет */
  ads: ReportFilters
  onAds: (f: ReportFilters) => void

  visible: Record<string, boolean>
  onToggleColumn: (key: string) => void
  onColumnPreset: (groups: ColumnGroup[] | null) => void

  onReset: () => void
}

// Bottom sheet that carries every filter the desktop toolbar spreads across
// three rows. The period, the breakdown and the columns apply live to the table
// underneath; the Реклама ticks are a draft the footer button hands over, the
// same way the toolbar's own Застосувати does.
export function CampaignFiltersSheet(props: FiltersSheetProps) {
  const {
    open,
    onOpenChange,
    dateRange,
    onDateRange,
    breakdown,
    breakdowns,
    onBreakdown,
    ads,
    onAds,
    visible,
    onToggleColumn,
    onColumnPreset,
    onReset,
  } = props

  const today = useMemo(() => startOfDay(new Date()), [])
  // the calendar is heavy on a phone screen, so it stays folded until asked for
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)

  // the period select lists the named ranges plus one entry for everything
  // else, which doubles as the label for an already-picked custom range
  const presets = useMemo(() => datePresets(today), [today])
  const periodLabel = rangeLabel(dateRange, today)
  const isPresetPeriod = presets.some((p) => p.label === periodLabel)
  const periodValue = isPresetPeriod ? periodLabel : CUSTOM_PERIOD

  const visibleCount = COLUMNS.filter((c) => visible[c.key]).length

  const { draft, setDraft, dirty, apply, revert } = useDraftFilters(ads, onAds)
  // a cabinet the ticked platforms rule out is still shown, but greyed
  const adNodes = useMemo(
    () =>
      adsTree(matchingAccounts({ ...draft, accounts: [] }).map((a) => a.id)),
    [draft]
  )

  // every way out of the sheet but the footer button leaves the table as it
  // was, so the ad-source draft goes back with it
  function dismiss(next: boolean) {
    if (!next) revert()
    onOpenChange(next)
  }

  function close() {
    dismiss(false)
  }

  return (
    <Sheet open={open} onOpenChange={dismiss}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[88svh] gap-0 rounded-t-2xl p-0"
      >
        {/* grab handle + title */}
        <div className="shrink-0 border-b">
          <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" />
          <div className="flex items-center gap-2 px-4 py-2.5">
            <SheetTitle className="text-[15px] font-semibold">
              Фільтри
            </SheetTitle>
            <SheetDescription className="sr-only">
              Період, розбивка, джерела даних та стовпці таблиці
            </SheetDescription>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground"
              onClick={onReset}
            >
              <IconRestore className="size-4" />
              Скинути
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={close}
              aria-label="Закрити"
            >
              <IconX />
            </Button>
          </div>
        </div>

        {/* scrolling body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-4">
          {/* period - named ranges in the select, the calendar for anything
              else; picking "Свій діапазон" is what unfolds it */}
          <Section title="Період">
            <Select
              value={periodValue}
              onValueChange={(v) => {
                if (v === CUSTOM_PERIOD) {
                  setCalendarOpen(true)
                  return
                }
                const hit = presets.find((x) => x.label === v)
                if (hit) {
                  onDateRange(hit.range)
                  setCalendarOpen(false)
                }
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <IconCalendar className="size-4 text-muted-foreground" />
                <SelectValue>
                  {(v: string) => (v === CUSTOM_PERIOD ? periodLabel : v)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {presets.map(({ label }) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CUSTOM_PERIOD}>
                  {isPresetPeriod ? "Свій діапазон…" : periodLabel}
                </SelectItem>
              </SelectContent>
            </Select>
            {calendarOpen && (
              <div className="rounded-lg border p-3">
                <RangePanel
                  layout="sheet"
                  value={dateRange}
                  onChange={onDateRange}
                  onDone={() => setCalendarOpen(false)}
                />
              </div>
            )}
          </Section>

          {/* breakdown - one choice, so a select */}
          <Section title="Розбивка">
            <Select
              value={breakdown}
              onValueChange={(v) => onBreakdown(v as string)}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {breakdowns.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {/* Реклама - платформа › бізнес-акаунт › кабінет in one picker, the
              same tree the Статистика panel is cut by */}
          <Section title="Реклама">
            <TreePicker
              label="Джерела"
              className="h-11"
              nodes={adNodes}
              filters={draft}
              onFilters={setDraft}
            />
          </Section>

          {/* columns */}
          <Section title="Стовпці" hint={`${visibleCount} з ${COLUMNS.length}`}>
            <button
              type="button"
              onClick={() => setColumnsOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium"
            >
              <IconColumns className="size-4 shrink-0 text-muted-foreground" />
              Показані стовпці
              <IconChevronDown
                className={cn(
                  "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
                  columnsOpen && "rotate-180"
                )}
              />
            </button>
            {columnsOpen && (
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Готовий набір
                  </span>
                  <ChipRow bleed="-mx-3 px-3">
                    {Object.entries(PRESETS).map(([label, groups]) => (
                      <Button
                        key={label}
                        variant="secondary"
                        size="sm"
                        onClick={() => onColumnPreset(groups)}
                      >
                        {label}
                      </Button>
                    ))}
                  </ChipRow>
                </div>
                {COL_GROUPS.map((g) => (
                  <div key={g.id} className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {g.label}
                    </span>
                    <ChipRow bleed="-mx-3 px-3">
                      {COLUMNS.filter((c) => c.group === g.id).map((c) => (
                        <ToggleChip
                          key={c.key}
                          active={!!visible[c.key]}
                          onClick={() => onToggleColumn(c.key)}
                        >
                          {c.label}
                        </ToggleChip>
                      ))}
                    </ChipRow>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* confirm - always closes, and only rebuilds the table when the ad
            sources actually changed */}
        <div className="shrink-0 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            className="h-11 w-full text-sm"
            onClick={() => {
              if (dirty) apply()
              onOpenChange(false)
            }}
          >
            Застосувати
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
