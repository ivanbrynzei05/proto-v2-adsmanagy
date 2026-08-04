import {
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  addDays,
  DATE_WINDOW_DAYS,
  datePresets,
  rangeLabel,
  sameDay,
  startOfDay,
  UA_MONTHS,
  UA_WEEKDAYS,
  type DateRange,
} from "./date-utils"

// The month grid for picking a "від - до" period. Future days are disabled, and
// nothing older than DATE_WINDOW_DAYS back can be chosen.
//
// `layout` decides how it's arranged: "popover" puts the named ranges in a
// narrow left column and confirms with "Застосувати" (desktop); "sheet" is the
// bare full-width calendar, because there the named ranges live in the period
// select and picking both ends is the confirmation.
export function RangePanel({
  value,
  onChange,
  onDone,
  layout = "popover",
}: {
  value: DateRange
  onChange: (r: DateRange) => void
  onDone?: () => void
  layout?: "popover" | "sheet"
}) {
  const sheet = layout === "sheet"
  const today = useMemo(() => startOfDay(new Date()), [])
  const minDate = useMemo(() => addDays(today, -DATE_WINDOW_DAYS), [today])
  // 1st of the month currently shown in the grid
  const [view, setView] = useState(
    () => new Date(value.to.getFullYear(), value.to.getMonth(), 1)
  )
  // the range being edited - only committed to the parent on "Застосувати"
  const [draft, setDraft] = useState<DateRange>(value)
  // while an anchor is set we're mid-selection (one end chosen, waiting for the
  // second); hover previews the other end
  const [anchor, setAnchor] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)

  const monthFirst = new Date(view.getFullYear(), view.getMonth(), 1)
  const canPrev = monthFirst > minDate
  const canNext =
    new Date(view.getFullYear(), view.getMonth() + 1, 1) <=
    new Date(today.getFullYear(), today.getMonth(), 1)

  // 6×7 grid, Monday-first
  const gridDays = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const start = addDays(first, -offset)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [view])

  const isDisabled = (d: Date) => d < minDate || d > today

  // range to paint: the anchored start + hovered end while selecting, otherwise
  // the current draft
  const a = anchor ?? draft.from
  const b = anchor ? (hover ?? anchor) : draft.to
  const lo = a <= b ? a : b
  const hi = a <= b ? b : a

  function pick(d: Date) {
    if (isDisabled(d)) return
    if (!anchor) {
      // first click - start a fresh selection (draft is a single day for now)
      setAnchor(d)
      setDraft({ from: d, to: d })
      setHover(d)
      return
    }
    // second click - the range is complete
    const from = anchor <= d ? anchor : d
    const to = anchor <= d ? d : anchor
    setDraft({ from, to })
    setAnchor(null)
    setHover(null)
    // in the sheet there is no second confirm (the sheet has its own) - both
    // ends picked means done; the popover waits for "Застосувати"
    if (sheet) {
      onChange({ from, to })
      onDone?.()
    }
  }

  // presets are quick picks - they commit and close right away, no confirm
  function applyPreset(from: Date, to: Date) {
    setDraft({ from, to })
    setAnchor(null)
    setHover(null)
    onChange({ from, to })
    onDone?.()
  }

  function apply() {
    onChange(draft)
    onDone?.()
  }

  return (
    <div className={cn(sheet ? "" : "flex")}>
      {/* quick presets - the sheet offers these in its period select instead,
          so there it's the calendar alone */}
      {!sheet && (
        <div className="flex w-40 shrink-0 flex-col gap-0.5 border-r p-2">
          {datePresets(today).map(({ label, range }) => (
            <button
              key={label}
              onClick={() => applyPreset(range.from, range.to)}
              className="rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {/* month calendar */}
      <div className={cn(sheet ? "" : "p-3")}>
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() =>
              setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
            }
            disabled={!canPrev}
            aria-label="Попередній місяць"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <span className="text-[13px] font-semibold">
            {UA_MONTHS[view.getMonth()]} {view.getFullYear()}
          </span>
          <button
            onClick={() =>
              setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
            }
            disabled={!canNext}
            aria-label="Наступний місяць"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
        <div
          className={cn(
            "grid gap-y-1",
            sheet ? "grid-cols-7" : "grid-cols-[repeat(7,36px)]"
          )}
        >
          {UA_WEEKDAYS.map((w) => (
            <span
              key={w}
              className="grid h-7 place-items-center text-[11px] font-medium text-muted-foreground"
            >
              {w}
            </span>
          ))}
          {gridDays.map((d) => {
            const outside = d.getMonth() !== view.getMonth()
            const disabled = isDisabled(d)
            const inRange = d >= lo && d <= hi
            const isLo = sameDay(d, lo)
            const isHi = sameDay(d, hi)
            const isEnd = isLo || isHi
            return (
              <button
                key={d.getTime()}
                onClick={() => pick(d)}
                onMouseEnter={() => anchor && setHover(d)}
                disabled={disabled}
                className={cn(
                  "grid place-items-center text-[13px] tabular-nums transition-colors",
                  sheet ? "h-9 w-full" : "h-8 w-9",
                  "disabled:pointer-events-none disabled:opacity-30",
                  inRange && !isEnd && "bg-primary/15",
                  inRange && isLo && "rounded-l-md",
                  inRange && isHi && "rounded-r-md",
                  isEnd
                    ? "rounded-md bg-primary font-semibold text-primary-foreground"
                    : !inRange && "rounded-md hover:bg-muted",
                  outside && !inRange && "text-muted-foreground/50"
                )}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
          <span
            className={cn(
              "text-[12px] font-medium tabular-nums",
              anchor && "text-muted-foreground"
            )}
          >
            {anchor ? "Оберіть кінець періоду" : rangeLabel(draft, today)}
          </span>
          {!sheet && (
            <Button size="sm" onClick={apply}>
              Застосувати
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Desktop trigger: the calendar in a popover, re-mounted on every open so it
// always snaps back to the committed range.
export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange
  onChange: (r: DateRange) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // bumped on every open so the panel remounts and snaps back to the committed
  // range (without unmounting mid-close, which would kill the exit animation)
  const [opens, setOpens] = useState(0)
  const today = useMemo(() => startOfDay(new Date()), [])

  function handleOpenChange(next: boolean) {
    if (next) setOpens((n) => n + 1)
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            className={cn("gap-1.5", className)}
          >
            <IconCalendar className="size-4 text-muted-foreground" />
            {rangeLabel(value, today)}
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto p-0">
        <RangePanel
          key={opens}
          value={value}
          onChange={onChange}
          onDone={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
