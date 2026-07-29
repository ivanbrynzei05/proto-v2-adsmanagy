import {
  IconCalendar,
  IconChevronDown,
  IconColumns,
  IconRestore,
  IconStack2,
  IconWorld,
  IconX,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  COL_GROUPS,
  COLUMNS,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  PLATFORMS,
  PRESETS,
  type AdAccount,
  type ColumnGroup,
  type CurrencyCode,
  type PlatformId,
} from "./data"
import { RangePanel } from "./date-range"
import {
  datePresets,
  rangeLabel,
  startOfDay,
  type DateRange,
} from "./date-utils"
import { PlatformBadge } from "./platform-badge"
import { ChipRow, ToggleChip } from "./toggle-chip"

// stands for "any range that isn't one of the named presets"
const CUSTOM_PERIOD = "__custom__"

// ---- shared bits ----

// full-width row with a checkbox — used for the multi-select lists (platforms,
// ad accounts). The whole row is the hit target, the checkbox is decorative.
function CheckRow({
  checked,
  onClick,
  children,
}: {
  checked: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors",
        checked ? "border-primary/40 bg-primary/[0.06]" : "border-border"
      )}
    >
      <Checkbox
        checked={checked}
        className="pointer-events-none"
        tabIndex={-1}
      />
      {children}
    </button>
  )
}

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

  platforms: Set<PlatformId>
  onTogglePlatform: (id: PlatformId) => void
  onAllPlatforms: () => void

  scopedAccounts: AdAccount[]
  adAccounts: Set<string>
  onToggleAdAccount: (id: string) => void
  onAllAdAccounts: () => void

  currency: CurrencyCode
  onCurrency: (c: CurrencyCode) => void

  visible: Record<string, boolean>
  onToggleColumn: (key: string) => void
  onColumnPreset: (groups: ColumnGroup[] | null) => void

  onReset: () => void
}

// Bottom sheet that carries every filter the desktop toolbar spreads across
// three rows. Changes apply live to the table underneath, so the footer button
// only confirms and closes.
export function CampaignFiltersSheet(props: FiltersSheetProps) {
  const {
    open,
    onOpenChange,
    dateRange,
    onDateRange,
    breakdown,
    breakdowns,
    onBreakdown,
    platforms,
    onTogglePlatform,
    onAllPlatforms,
    scopedAccounts,
    adAccounts,
    onToggleAdAccount,
    onAllAdAccounts,
    currency,
    onCurrency,
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
  const selectedAccounts = scopedAccounts.filter((a) => adAccounts.has(a.id))

  function close() {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              Період, розбивка, джерела даних, валюта та стовпці таблиці
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
          {/* period — named ranges in the select, the calendar for anything
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

          {/* breakdown + display currency — one choice each, so both are selects */}
          <div className="grid grid-cols-[1fr_7.5rem] gap-3">
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

            <Section title="Валюта">
              <Select
                value={currency}
                onValueChange={(v) => onCurrency(v as CurrencyCode)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue>
                    {(v: CurrencyCode) => `${v} ${CURRENCY_SYMBOLS[v]}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c} {CURRENCY_SYMBOLS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>
          </div>

          {/* platform */}
          <Section
            title="Платформа"
            hint={`${platforms.size} з ${PLATFORMS.length}`}
          >
            <div className="flex flex-col gap-1.5">
              {PLATFORMS.map((p) => (
                <CheckRow
                  key={p.id}
                  checked={platforms.has(p.id)}
                  onClick={() => onTogglePlatform(p.id)}
                >
                  <PlatformBadge id={p.id} size={16} />
                  <span className="truncate">{p.label}</span>
                </CheckRow>
              ))}
              {platforms.size < PLATFORMS.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={onAllPlatforms}
                >
                  <IconWorld className="size-4" />
                  Обрати всі
                </Button>
              )}
            </div>
          </Section>

          {/* ad accounts */}
          <Section
            title="Рекламні акаунти"
            hint={`${selectedAccounts.length} з ${scopedAccounts.length}`}
          >
            {scopedAccounts.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                Немає акаунтів для цих платформ
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {scopedAccounts.map((a) => (
                  <CheckRow
                    key={a.id}
                    checked={adAccounts.has(a.id)}
                    onClick={() => onToggleAdAccount(a.id)}
                  >
                    <PlatformBadge id={a.platform} size={16} />
                    <span className="truncate">{a.name}</span>
                  </CheckRow>
                ))}
                {selectedAccounts.length < scopedAccounts.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={onAllAdAccounts}
                  >
                    <IconStack2 className="size-4" />
                    Обрати всі
                  </Button>
                )}
              </div>
            )}
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

        {/* confirm */}
        <div className="shrink-0 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button className="h-11 w-full text-sm" onClick={close}>
            Застосувати
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
