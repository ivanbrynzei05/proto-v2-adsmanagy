import {
  IconAlertTriangle,
  IconArrowsSort,
  IconArrowsSplit2,
  IconArrowUpRight,
  IconBox,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconChevronUp,
  IconClock,
  IconCoin,
  IconColumns,
  IconDownload,
  IconHelpCircle,
  IconLayoutGrid,
  IconPackage,
  IconPlugConnectedX,
  IconRefresh,
  IconSearch,
  IconSpeakerphone,
  IconStack2,
  IconTag,
  IconWorld,
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  AD_ACCOUNTS,
  AD_GROUPS,
  ADS,
  CAMPAIGNS,
  COL_GROUPS,
  COLUMNS,
  CRM_METRIC_KEYS,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  fmt,
  parseProductId,
  PLATFORMS,
  PRESETS,
  PRODUCTS,
  totals,
  type Column,
  type CurrencyCode,
  type MetricKey,
  type PlatformId,
  type Row,
} from "./data"

// ---- platform (ad-account) badge ----
function PlatformBadge({ id, size = 15 }: { id: PlatformId; size?: number }) {
  const p = PLATFORMS.find((x) => x.id === id)
  if (!p) return null
  const logos: Record<PlatformId, React.ReactNode> = {
    facebook: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"
        />
      </svg>
    ),
    google: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.394 3.622v3.011h3.878c2.269-2.09 3.578-5.165 3.578-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.956-1.075 7.942-2.907l-3.878-3.01c-1.075.72-2.45 1.145-4.064 1.145-3.125 0-5.77-2.11-6.714-4.948H1.276v3.11A11.997 11.997 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.286 14.28A7.213 7.213 0 0 1 4.91 12c0-.79.137-1.558.376-2.28V6.61H1.276A11.997 11.997 0 0 0 0 12c0 1.937.464 3.769 1.276 5.39l4.01-3.11z"
        />
        <path
          fill="#EA4335"
          d="M12 4.773c1.762 0 3.343.605 4.587 1.794l3.44-3.44C17.952 1.19 15.235 0 12 0A11.997 11.997 0 0 0 1.276 6.61l4.01 3.11C6.23 6.882 8.875 4.773 12 4.773z"
        />
      </svg>
    ),
    tiktok: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          className="fill-foreground"
          d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"
        />
        <path
          fill="#25F4EE"
          d="M5.633 16.42a2.895 2.895 0 0 1 3.183-4.51V8.39a6.33 6.33 0 0 0-5.394 10.692 6.33 6.33 0 0 1 2.211-2.662z"
        />
        <path
          fill="#FE2C55"
          d="M20.592 6.79V6.686a4.793 4.793 0 0 1-2.767-.869 4.793 4.793 0 0 0 2.767.973z"
        />
      </svg>
    ),
  }
  return (
    <span
      className="inline-grid shrink-0 place-items-center leading-none"
      title={"Кабінет: " + p.label}
      style={{ width: size, height: size }}
    >
      {logos[id]}
    </span>
  )
}

// ---- single metric cell: pill / mini-bar / plain number ----
// accepts a full Row or an aggregated { metric: value } map (product-group total)
function ValueCell({
  row,
  col,
  cur = "UAH",
}: {
  row: Record<MetricKey, number>
  col: Column
  cur?: CurrencyCode
}) {
  const v = row[col.key]

  if (
    col.key === "roi" ||
    col.key === "romi" ||
    col.key === "probableIncome" ||
    col.key === "ownerIncome"
  ) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-transparent tabular-nums",
          v >= 0
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {fmt(v, col.unit, cur)}
      </Badge>
    )
  }

  if (col.key === "approveRate" || col.key === "buyoutRate") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-11 tabular-nums">{fmt(v, col.unit, cur)}</span>
        <span className="h-1.5 w-11 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: Math.min(100, v) + "%" }}
          />
        </span>
      </span>
    )
  }

  return <span className="tabular-nums">{fmt(v, col.unit, cur)}</span>
}

// ---- entity tabs (campaign → ad-group → ad drill levels) ----
const ENTITY_TABS: [string, TablerIcon][] = [
  ["Кампанії", IconSpeakerphone],
  ["Групи оголошень", IconLayoutGrid],
  ["Оголошення", IconBox],
]
const DATASETS: Record<string, Row[]> = {
  Кампанії: CAMPAIGNS,
  "Групи оголошень": AD_GROUPS,
  Оголошення: ADS,
}
const ENTITY_NOUN: Record<string, string> = {
  Кампанії: "кампаній",
  "Групи оголошень": "груп оголошень",
  Оголошення: "оголошень",
}
// Synthetic per-level identifier shown under the name: a campaign id on the
// campaign level, an ad-group id on groups, an ad id on ads. Each level uses a
// distinct base/length so the ids read as belonging to that level.
function entityId(entity: string, i: number): number {
  if (entity === "Групи оголошень") return 623400100 + i * 17
  if (entity === "Оголошення") return 890120045000 + i * 23
  return 481200 + i * 6 // Кампанії
}
const RATE_KEYS: MetricKey[] = [
  "costPerLead",
  "approveRate",
  "costPerApprove",
  "breakEvenLeadPrice",
  "cpm",
  "cpc",
  "ctr",
  "buyoutRate",
  "roi",
  "romi",
]
// "По товарам" groups campaigns by product id (default); "По кампаніям" is the
// flat list; the rest fan each row out into sub-rows (see BREAKDOWN_VALUES).
const BREAKDOWN_PRODUCT = "По товарам"
const BREAKDOWN_CAMPAIGN = "По кампаніям"
const BREAKDOWNS = [BREAKDOWN_PRODUCT, BREAKDOWN_CAMPAIGN, "По кабінетах"]

// Values each breakdown splits a row into (Ads-Manager style). The first entry
// ("Без розбивки") means "no breakdown" and is handled specially.
const BREAKDOWN_VALUES: Record<string, string[]> = {
  "По кабінетах": ["Кабінет №1", "Кабінет №2", "Кабінет №3"],
}
// Additive metrics are divided across breakdown rows; rate metrics (RATE_KEYS)
// stay unchanged, so every derived ratio remains internally consistent.
const ADDITIVE_KEYS: MetricKey[] = [
  "leads",
  "approves",
  "spend",
  "returns",
  "ccCost",
  "packaging",
  "probableIncome",
  "buyerIncome",
  "ownerIncome",
]
// Deterministic, slightly uneven weights that sum to 1 — rotated per row so not
// every campaign splits in the exact same proportions.
function breakdownWeights(n: number, rowSeed: number): number[] {
  const raw = Array.from({ length: n }, (_, i) => 1 + ((i + rowSeed) % n) * 0.4)
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((x) => x / sum)
}

// --- solid table surface colors ---
// Frozen columns must be fully opaque so scrolled cells never show through them;
// each state below has a matching opaque tone for the frozen cell and the rest of the row.
const ROW_HOVER = "hover:bg-[color-mix(in_oklab,var(--muted)_55%,var(--card))]"
const ROW_SEL =
  "bg-[color-mix(in_oklab,var(--primary)_9%,var(--card))] hover:bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))]"
const FROZEN_BASE =
  "bg-card group-hover/row:bg-[color-mix(in_oklab,var(--muted)_55%,var(--card))]"
const FROZEN_SEL =
  "bg-[color-mix(in_oklab,var(--primary)_9%,var(--card))] group-hover/row:bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))]"
const HEADER_BG = "bg-[color-mix(in_oklab,var(--muted)_45%,var(--card))]"
const HEADER_EMPH = "bg-[color-mix(in_oklab,var(--primary)_9%,var(--card))]"
const FOOTER_BG = "bg-[color-mix(in_oklab,var(--muted)_60%,var(--card))]"
// right edge of the frozen name column — a hairline that reads as a seam while scrolling
const FROZEN_EDGE = "shadow-[1px_0_0_0_var(--border)]"

// product-group header row — a soft primary tint so it reads as a "shelf" the
// campaigns sit under; the frozen variant is opaque so scrolled cells can't bleed through
const GROUP_BG =
  "bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] hover:bg-[color-mix(in_oklab,var(--primary)_11%,var(--card))]"
const GROUP_FROZEN =
  "bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] group-hover/row:bg-[color-mix(in_oklab,var(--primary)_11%,var(--card))]"
// child campaign rows sit on a faint muted wash so the nesting is obvious
const CHILD_BG =
  "bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] hover:bg-[color-mix(in_oklab,var(--muted)_45%,var(--card))]"
const CHILD_FROZEN =
  "bg-[color-mix(in_oklab,var(--muted)_28%,var(--card))] group-hover/row:bg-[color-mix(in_oklab,var(--muted)_45%,var(--card))]"

// Ukrainian plural picker (1 кампанія / 2 кампанії / 5 кампаній)
function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

// amber warning shown next to campaigns with no product id in the name
function NoProductWarning() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge className="shrink-0 gap-1 border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
            <IconAlertTriangle className="size-3" />
            Без ID товару
          </Badge>
        }
      />
      <TooltipContent className="max-w-[260px] leading-relaxed">
        Назва не починається з ID товару — розбивка по товару недоступна.
        Додайте ID на початок назви, напр. «1042 - …».
      </TooltipContent>
    </Tooltip>
  )
}

// CRM (order-derived) metrics — the ones that can't always be attributed to a
// deeper level than the campaign
const CRM_KEYS = new Set(CRM_METRIC_KEYS)

// Emulates attribution gaps: below the campaign level (ad groups / ads) some
// rows can't have their order data resolved. Deterministic ~1/3 subset so the
// demo always shows a believable mix.
function crmUnresolved(name: string, entity: string) {
  if (entity === "Кампанії") return false
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % 3 === 0
}

// "no data at this level" cell — reads as clickable, opens an explanation (demo)
function UnknownCell() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
          >
            <IconHelpCircle className="size-3" />
            н/д
          </button>
        }
      />
      <TooltipContent className="max-w-[240px] leading-relaxed">
        <span className="flex flex-col gap-1">
          <span>Немає даних на цьому рівні.</span>
          <span className="font-medium underline underline-offset-2">
            Дізнатися чому →
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

// compact "time ago" label (щойно / 5 хв тому / 2 год тому / 3 дн тому)
function relativeTime(from: Date, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - from.getTime()) / 1000))
  if (s < 60) return "щойно"
  const m = Math.floor(s / 60)
  if (m < 60) return m + " хв тому"
  const h = Math.floor(m / 60)
  if (h < 24) return h + " год тому"
  return Math.floor(h / 24) + " дн тому"
}

// "Оновити" + last-updated time, with a small anti-spam rate limiter: three quick
// clicks in a row lock the button for 5s. Isolated in its own component so its
// once-a-second tick doesn't re-render the whole table.
function RefreshControl() {
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [now, setNow] = useState(() => Date.now())
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const clicks = useRef<number[]>([])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const cooling = remaining > 0

  function refresh() {
    if (cooling) return
    const t = Date.now()
    // keep only clicks from the last 2s → detect "3 quick clicks in a row"
    clicks.current = [...clicks.current.filter((x) => t - x < 2000), t]
    if (clicks.current.length >= 3) {
      clicks.current = []
      setCooldownUntil(t + 5000)
      setNow(t)
      return
    }
    setSpinning(true)
    setLastUpdated(new Date(t))
    setNow(t)
    window.setTimeout(() => setSpinning(false), 600)
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex items-center gap-1 text-xs whitespace-nowrap",
          cooling
            ? "text-amber-600 dark:text-amber-500"
            : "text-muted-foreground"
        )}
      >
        <IconClock className="size-3.5 shrink-0" />
        {cooling
          ? `Наступна спроба через ${remaining}с`
          : relativeTime(lastUpdated, now)}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={cooling}
        title={cooling ? "Забагато оновлень поспіль" : "Оновити дані"}
      >
        <IconRefresh className={cn("size-4", spinning && "animate-spin")} />
        Оновити
      </Button>
    </div>
  )
}

// ---- date-range picker (calendar, "від — до") ----
type DateRange = { from: Date; to: Date }

const UA_MONTHS = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
]
const UA_MONTHS_SHORT = [
  "січ",
  "лют",
  "бер",
  "кві",
  "тра",
  "чер",
  "лип",
  "сер",
  "вер",
  "жов",
  "лис",
  "гру",
]
const UA_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
// earliest selectable day — the window is limited to the last 1.5 months
const DATE_WINDOW_DAYS = 45

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d: Date, n: number) {
  const x = startOfDay(d)
  x.setDate(x.getDate() + n)
  return x
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function fmtDay(d: Date, withYear = false) {
  return (
    `${d.getDate()} ${UA_MONTHS_SHORT[d.getMonth()]}` +
    (withYear ? ` ${d.getFullYear()}` : "")
  )
}
// Trigger / footer label: ranges that match a preset show the preset's name; a
// lone day collapses to its date; anything else reads "від — до".
function rangeLabel(r: DateRange, today: Date) {
  const named: [Date, Date, string][] = [
    [today, today, "Сьогодні"],
    [addDays(today, -1), addDays(today, -1), "Вчора"],
    [addDays(today, -6), today, "Останні 7 днів"],
    [addDays(today, -29), today, "Останні 30 днів"],
    [addDays(today, -DATE_WINDOW_DAYS), today, "Макс."],
  ]
  for (const [f, t, label] of named) {
    if (sameDay(r.from, f) && sameDay(r.to, t)) return label
  }
  if (sameDay(r.from, r.to)) return fmtDay(r.from, true)
  return `${fmtDay(r.from)} – ${fmtDay(r.to, true)}`
}

// A calendar popover for picking a "від — до" period. Future days are disabled,
// and nothing older than DATE_WINDOW_DAYS back can be chosen.
function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (r: DateRange) => void
}) {
  const [open, setOpen] = useState(false)
  const today = useMemo(() => startOfDay(new Date()), [])
  const minDate = useMemo(() => addDays(today, -DATE_WINDOW_DAYS), [today])
  // 1st of the month currently shown in the grid
  const [view, setView] = useState(
    () => new Date(value.to.getFullYear(), value.to.getMonth(), 1)
  )
  // the range being edited — only committed to the parent on "Застосувати"
  const [draft, setDraft] = useState<DateRange>(value)
  // while an anchor is set we're mid-selection (one end chosen, waiting for the
  // second); hover previews the other end
  const [anchor, setAnchor] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)

  // every time it reopens, snap back to the committed range
  function handleOpenChange(next: boolean) {
    if (next) {
      setView(new Date(value.to.getFullYear(), value.to.getMonth(), 1))
      setDraft(value)
      setAnchor(null)
      setHover(null)
    }
    setOpen(next)
  }

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
      // first click — start a fresh selection (draft is a single day for now)
      setAnchor(d)
      setDraft({ from: d, to: d })
      setHover(d)
      return
    }
    // second click — complete the range; stays open until "Застосувати"
    const from = anchor <= d ? anchor : d
    const to = anchor <= d ? d : anchor
    setDraft({ from, to })
    setAnchor(null)
    setHover(null)
  }

  // presets are quick picks — they commit and close right away, no confirm
  function applyPreset(from: Date, to: Date) {
    onChange({ from, to })
    setOpen(false)
  }

  function apply() {
    onChange(draft)
    setOpen(false)
  }

  const presets: [string, () => void][] = [
    ["Сьогодні", () => applyPreset(today, today)],
    ["Вчора", () => applyPreset(addDays(today, -1), addDays(today, -1))],
    ["Останні 7 днів", () => applyPreset(addDays(today, -6), today)],
    ["Останні 30 днів", () => applyPreset(addDays(today, -29), today)],
    ["Макс.", () => applyPreset(minDate, today)],
  ]

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button variant="secondary" size="sm" className="mb-2 gap-1.5">
            <IconCalendar className="size-4 text-muted-foreground" />
            {rangeLabel(value, today)}
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          {/* quick presets */}
          <div className="flex w-40 shrink-0 flex-col gap-0.5 border-r p-2">
            {presets.map(([label, fn]) => (
              <button
                key={label}
                onClick={fn}
                className="rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted"
              >
                {label}
              </button>
            ))}
          </div>
          {/* month calendar */}
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() =>
                  setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
                }
                disabled={!canPrev}
                aria-label="Попередній місяць"
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
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
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              >
                <IconChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-[repeat(7,36px)] gap-y-1">
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
                      "grid h-8 w-9 place-items-center text-[13px] tabular-nums transition-colors",
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
              <span className="text-[12px] font-medium tabular-nums">
                {rangeLabel(draft, today)}
              </span>
              <Button size="sm" onClick={apply}>
                Застосувати
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type SortKey = "name" | "active" | MetricKey
type Indexed = Row & { _i: number; _breakdown?: string }

// One line in the grouped view: a product shelf (2+ campaigns), a single
// product-tagged campaign, or a campaign with no product id at all.
type DisplayEntry =
  | {
      kind: "group"
      id: string
      product: string
      rows: Indexed[]
      agg: Record<MetricKey, number>
      activeCount: number
    }
  | { kind: "single"; id: string; row: Indexed }
  | { kind: "orphan"; row: Indexed }

export function CampaignsPage() {
  const allCols = COLUMNS
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allCols.map((c) => [c.key, true]))
  )
  const [sort, setSort] = useState<{
    key: SortKey | null
    dir: "asc" | "desc"
  }>({
    key: "spend",
    dir: "desc",
  })
  // resizable column widths (name + every metric), remembered in localStorage
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = { name: 340 }
    for (const c of COLUMNS) defaults[c.key] = defaultColWidth(c.label)
    try {
      const saved = localStorage.getItem(COL_WIDTHS_KEY)
      if (saved)
        return { ...defaults, ...(JSON.parse(saved) as Record<string, number>) }
    } catch {
      /* ignore */
    }
    return defaults
  })
  const resizeRef = useRef<{
    key: string
    startX: number
    startW: number
  } | null>(null)
  useEffect(() => {
    try {
      localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(colWidths))
    } catch {
      /* ignore */
    }
  }, [colWidths])

  function startResize(key: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = {
      key,
      startX: e.clientX,
      startW: colWidths[key] ?? 120,
    }
    const move = (ev: MouseEvent) => {
      const r = resizeRef.current
      if (!r) return
      const w = Math.max(72, Math.min(560, r.startW + (ev.clientX - r.startX)))
      setColWidths((prev) =>
        prev[r.key] === w ? prev : { ...prev, [r.key]: w }
      )
    }
    const up = () => {
      resizeRef.current = null
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"
  }

  const [query, setQuery] = useState("")
  const [sel, setSel] = useState<Set<number>>(() => new Set())
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({})
  const [entity, setEntity] = useState("Кампанії")
  // data-source hierarchy: platform → ad account
  const [platforms, setPlatforms] = useState<Set<PlatformId>>(
    () => new Set(PLATFORMS.map((p) => p.id))
  )
  const [adAccounts, setAdAccounts] = useState<Set<string>>(
    () => new Set(AD_ACCOUNTS.map((a) => a.id))
  )
  const showToggleCol = true
  const [drill, setDrill] = useState<{ campaigns: string[]; groups: string[] }>(
    {
      campaigns: [],
      groups: [],
    }
  )
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const t = startOfDay(new Date())
    return { from: addDays(t, -6), to: t } // default: останні 7 днів
  })
  // "Розбивка" is the primary mode selector; "По товарам" groups by product id
  const [breakdown, setBreakdown] = useState(BREAKDOWN_PRODUCT)
  // display currency for money columns (mock data is stored in UAH)
  const [currency, setCurrency] = useState<CurrencyCode>("UAH")
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // loading skeletons: a full-page one on first load, and a short table pulse
  // whenever the breakdown / entity changes so the switch feels "live"
  const [firstLoad, setFirstLoad] = useState(true)
  const [switching, setSwitching] = useState(false)
  const pulseRef = useRef<number | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => setFirstLoad(false), 750)
    return () => window.clearTimeout(t)
  }, [])
  function pulse(ms = 450) {
    setSwitching(true)
    if (pulseRef.current) window.clearTimeout(pulseRef.current)
    pulseRef.current = window.setTimeout(() => setSwitching(false), ms)
  }

  const cols = allCols.filter((c) => visible[c.key])
  const isLeaf = entity === "Оголошення"
  // "По товарам" groups by product id on every level (campaigns / groups / ads)
  const grouped = breakdown === BREAKDOWN_PRODUCT

  // level 2 — ad accounts on the currently chosen platform(s)
  const scopedAccounts = useMemo(
    () => AD_ACCOUNTS.filter((a) => platforms.has(a.platform)),
    [platforms]
  )

  function drillOk(e: string, c: Row) {
    if (e === "Групи оголошень")
      return (
        drill.campaigns.length === 0 ||
        drill.campaigns.includes(c.campaign ?? "")
      )
    if (e === "Оголошення")
      return (
        (drill.campaigns.length === 0 ||
          drill.campaigns.includes(c.campaign ?? "")) &&
        (drill.groups.length === 0 || drill.groups.includes(c.group ?? ""))
      )
    return true
  }
  function baseFilter(e: string, c: Row) {
    return (
      platforms.has(c.platform) && adAccounts.has(c.adAccount) && drillOk(e, c)
    )
  }

  function setActive(c: Indexed, val: boolean) {
    setActiveMap((m) => ({ ...m, [entity + ":" + c._i]: val }))
  }
  function switchEntity(e: string) {
    setEntity(e)
    setSel(new Set())
  }
  function switchBreakdown(b: string) {
    setBreakdown(b)
    setSel(new Set())
    pulse()
  }
  const ALL_ACCOUNTS = () => new Set(AD_ACCOUNTS.map((a) => a.id))
  // narrowing a level re-selects everything below it, so the filter never
  // silently hides rows the user didn't intend to hide
  function togglePlatform(id: PlatformId) {
    setPlatforms((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n.size === 0 ? s : n
    })
    setAdAccounts(ALL_ACCOUNTS())
    setSel(new Set())
    setDrill({ campaigns: [], groups: [] })
  }
  function toggleAdAccount(id: string) {
    setAdAccounts((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
    setSel(new Set())
    setDrill({ campaigns: [], groups: [] })
  }
  function clearDrill() {
    setDrill({ campaigns: [], groups: [] })
  }
  function drillInto(target: string) {
    const names = rows.filter((r) => sel.has(r._i)).map((r) => r.name)
    if (entity === "Кампанії") setDrill({ campaigns: names, groups: [] })
    else if (entity === "Групи оголошень")
      setDrill((d) => ({ campaigns: d.campaigns, groups: names }))
    setEntity(target)
    setSel(new Set())
  }
  // click a row's name to open its children (campaign → groups → ads)
  function drillRow(c: Indexed) {
    if (entity === "Кампанії") {
      setDrill({ campaigns: [c.name], groups: [] })
      setEntity("Групи оголошень")
    } else if (entity === "Групи оголошень") {
      setDrill((d) => ({
        campaigns: d.campaigns.length ? d.campaigns : [c.campaign ?? ""],
        groups: [c.name],
      }))
      setEntity("Оголошення")
    }
    setSel(new Set())
  }
  // click a product-group name to open the next level for all its campaigns
  function drillProduct(e: Extract<DisplayEntry, { kind: "group" }>) {
    if (entity === "Кампанії") {
      setDrill({ campaigns: e.rows.map((r) => r.name), groups: [] })
      setEntity("Групи оголошень")
    } else if (entity === "Групи оголошень") {
      const campaigns = Array.from(new Set(e.rows.map((r) => r.campaign ?? "")))
      setDrill({ campaigns, groups: e.rows.map((r) => r.name) })
      setEntity("Оголошення")
    }
    // keep the same product open on the next level so its rows are visible
    setExpanded((s) => new Set(s).add(e.id))
    setSel(new Set())
  }

  const counts = useMemo(
    () => ({
      Кампанії: CAMPAIGNS.filter((c) => baseFilter("Кампанії", c)).length,
      "Групи оголошень": AD_GROUPS.filter((c) =>
        baseFilter("Групи оголошень", c)
      ).length,
      Оголошення: ADS.filter((c) => baseFilter("Оголошення", c)).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platforms, adAccounts, drill]
  )

  // data-source + search filters (shared by the table and the counters)
  function passesFilters(e: string, c: Row) {
    if (!baseFilter(e, c)) return false
    if (query.trim() && !c.name.toLowerCase().includes(query.toLowerCase()))
      return false
    return true
  }

  const rows = useMemo<Indexed[]>(() => {
    let r: Indexed[] = (DATASETS[entity] || CAMPAIGNS).map((c, i) => ({
      ...c,
      _i: i,
      active:
        entity + ":" + i in activeMap ? activeMap[entity + ":" + i] : c.active,
    }))
    r = r.filter((c) => passesFilters(entity, c))
    if (sort.key) {
      const key = sort.key
      r.sort((a, b) => {
        const av = a[key]
        const bv = b[key]
        let cmp: number
        if (typeof av === "boolean") cmp = (av ? 1 : 0) - (bv ? 1 : 0)
        else if (typeof av === "string") cmp = av.localeCompare(bv as string)
        else cmp = (av as number) - (bv as number)
        return sort.dir === "asc" ? cmp : -cmp
      })
    }
    // breakdown: fan every row out into one sub-row per breakdown value
    const vals = BREAKDOWN_VALUES[breakdown]
    if (vals?.length) {
      r = r.flatMap((row, ri) => {
        const w = breakdownWeights(vals.length, ri)
        return vals.map((val, vi) => {
          const sub: Indexed = {
            ...row,
            _i: row._i * 100 + vi,
            _breakdown: val,
          }
          for (const k of ADDITIVE_KEYS)
            sub[k] = Math.round((row[k] as number) * w[vi])
          return sub
        })
      })
    }
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, platforms, adAccounts, drill, query, sort, activeMap, breakdown])

  const foot = useMemo(() => totals(rows), [rows])

  // share of orders (approves) that can't be synced to a product — orders on
  // campaigns whose name has no product id
  const unsyncedPct = useMemo(() => {
    let total = 0
    let bad = 0
    for (const c of CAMPAIGNS) {
      total += c.approves
      if (c.match !== "ok") bad += c.approves
    }
    return total ? Math.round((bad / total) * 100) : 0
  }, [])

  // Fold the flat, already-filtered/sorted rows into product shelves. Rows keep
  // their natural order; a product with 2+ campaigns becomes a collapsible
  // group, a lone product-tagged campaign becomes a "single", and a campaign
  // with no id prefix becomes an "orphan" (warned about, never grouped).
  const entries = useMemo<DisplayEntry[]>(() => {
    if (!grouped) return []
    const map = new Map<string, Indexed[]>()
    const order: Array<{ t: "g"; id: string } | { t: "o"; row: Indexed }> = []
    for (const r of rows) {
      const { id } = parseProductId(r.name)
      if (!id) {
        order.push({ t: "o", row: r })
        continue
      }
      const arr = map.get(id)
      if (arr) arr.push(r)
      else {
        map.set(id, [r])
        order.push({ t: "g", id })
      }
    }
    const list: DisplayEntry[] = order.map((o) => {
      if (o.t === "o") return { kind: "orphan", row: o.row }
      const rs = map.get(o.id)!
      if (rs.length === 1) return { kind: "single", id: o.id, row: rs[0] }
      return {
        kind: "group",
        id: o.id,
        product: PRODUCTS[o.id] ?? parseProductId(rs[0].name).rest,
        rows: rs,
        agg: totals(rs),
        activeCount: rs.filter((r) => r.active).length,
      }
    })
    // Three tiers, always in this order: product groups first, then lone
    // product-tagged campaigns, then the no-id campaigns pinned to the bottom.
    // The active sort only reorders rows *within* each tier.
    const groupsTier = list.filter((e) => e.kind === "group")
    const singlesTier = list.filter((e) => e.kind === "single")
    const orphansTier = list.filter((e) => e.kind === "orphan")
    if (sort.key) {
      const key = sort.key
      const dir = sort.dir === "asc" ? 1 : -1
      const val = (e: DisplayEntry): number | string => {
        if (key === "name")
          return e.kind === "group"
            ? e.product.toLowerCase()
            : parseProductId(e.row.name).rest.toLowerCase()
        if (key === "active")
          return e.kind === "group" ? e.activeCount : e.row.active ? 1 : 0
        return (e.kind === "group" ? e.agg[key] : e.row[key]) as number
      }
      const byKey = (a: DisplayEntry, b: DisplayEntry) => {
        const av = val(a)
        const bv = val(b)
        const cmp =
          typeof av === "string"
            ? av.localeCompare(bv as string)
            : av - (bv as number)
        return cmp * dir
      }
      groupsTier.sort(byKey)
      singlesTier.sort(byKey)
      orphansTier.sort(byKey)
    }
    return [...groupsTier, ...singlesTier, ...orphansTier]
  }, [rows, grouped, sort])

  const groupIds = useMemo(
    () => entries.flatMap((e) => (e.kind === "group" ? [e.id] : [])),
    [entries]
  )
  const orphanCount = useMemo(
    () => entries.reduce((n, e) => n + (e.kind === "orphan" ? 1 : 0), 0),
    [entries]
  )
  const allExpanded =
    groupIds.length > 0 && groupIds.every((id) => expanded.has(id))

  function toggleExpand(id: string) {
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function toggleAllExpand() {
    setExpanded(allExpanded ? new Set() : new Set(groupIds))
  }
  function setGroupSel(childIdx: number[], select: boolean) {
    setSel((s) => {
      const n = new Set(s)
      for (const i of childIdx) {
        if (select) n.add(i)
        else n.delete(i)
      }
      return n
    })
  }

  // three states per column: desc → asc → none (unsorted) → desc …
  function toggleSort(key: SortKey) {
    setSort((s) => {
      if (s.key !== key) return { key, dir: "desc" }
      if (s.dir === "desc") return { key, dir: "asc" }
      return { key: null, dir: "desc" }
    })
  }
  function toggleSel(i: number) {
    setSel((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  }
  const allSel = rows.length > 0 && rows.every((r) => sel.has(r._i))
  function toggleAll() {
    setSel(allSel ? new Set() : new Set(rows.map((r) => r._i)))
  }

  const selCount = sel.size
  const PLATFORM_BY_ID = useMemo(
    () =>
      Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
        PlatformId,
        (typeof PLATFORMS)[number]
      >,
    []
  )
  // level 1 — platform
  const platLabel =
    platforms.size === PLATFORMS.length
      ? "Усі платформи"
      : platforms.size === 1
        ? PLATFORM_BY_ID[[...platforms][0]].label
        : platforms.size + " платформи"
  // level 2 — ad account (scoped to the chosen platform(s))
  const selAccounts = scopedAccounts.filter((a) => adAccounts.has(a.id))
  const accLabel =
    selAccounts.length === scopedAccounts.length
      ? "Усі акаунти"
      : selAccounts.length === 1
        ? selAccounts[0].name
        : selAccounts.length + " акаунти"

  const colSpan = cols.length + 2 + (showToggleCol ? 1 : 0)

  // Fixed frozen-column widths (px). Keeping them explicit means the sticky `left`
  // offsets can never drift out of sync with the rendered columns, so the frozen
  // block and the scrolling block always line up seamlessly.
  const W_SELECT = 44
  const W_TOGGLE = 52
  const nameLeft = W_SELECT + (showToggleCol ? W_TOGGLE : 0)
  // opaque tone for the frozen cells; child rows get the muted wash
  const frozenBg = (selected: boolean, child = false) =>
    selected ? FROZEN_SEL : child ? CHILD_FROZEN : FROZEN_BASE
  const rowBg = (selected: boolean, child = false) =>
    selected ? ROW_SEL : child ? CHILD_BG : ROW_HOVER

  // ---- a single campaign row (also used for group children / orphans) ----
  // the full original campaign name is always shown, including the id prefix
  type RowOpts = {
    child?: boolean // indented under a product group
    warn?: boolean // show the "no product id" warning
  }
  function renderRow(c: Indexed, opts: RowOpts = {}) {
    const selected = sel.has(c._i)
    const child = !!opts.child
    const displayName = c.name
    return (
      <TableRow
        key={c._i}
        className={cn("group/row border-0", rowBg(selected, child))}
      >
        <TableCell
          className={cn(
            "sticky left-0 z-20 border-b px-0 text-center",
            frozenBg(selected, child)
          )}
          style={{ width: W_SELECT, minWidth: W_SELECT }}
        >
          <div className="flex justify-center">
            <Checkbox
              checked={selected}
              onCheckedChange={() => toggleSel(c._i)}
              aria-label="Обрати рядок"
            />
          </div>
        </TableCell>
        {showToggleCol && (
          <TableCell
            className={cn(
              "sticky z-20 border-b px-0 text-center",
              frozenBg(selected, child)
            )}
            style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
          >
            <div className="flex justify-center">
              <RowSwitch
                active={c.active}
                onChange={(val) => setActive(c, val)}
              />
            </div>
          </TableCell>
        )}
        <TableCell
          className={cn(
            "sticky z-20 overflow-hidden border-b py-2 pl-3",
            FROZEN_EDGE,
            frozenBg(selected, child)
          )}
          style={{
            width: colWidths.name,
            minWidth: colWidths.name,
            maxWidth: colWidths.name,
            left: nameLeft,
          }}
        >
          <div
            className={cn(
              "flex min-w-0 gap-1.5",
              child ? "items-stretch" : "items-center"
            )}
          >
            {child && (
              <span className="ml-1.5 w-3 shrink-0 self-stretch border-l border-border/60" />
            )}
            <div
              className={cn(
                "flex min-w-0 flex-col gap-0.5",
                child && "justify-center"
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {c._breakdown ? (
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <IconArrowsSplit2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{c._breakdown}</span>
                  </span>
                ) : isLeaf ? (
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <PlatformBadge id={c.platform} />
                    <span className="truncate">{displayName}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => drillRow(c)}
                    title={
                      "Відкрити " +
                      (entity === "Кампанії" ? "групи оголошень" : "оголошення")
                    }
                    className={cn(
                      "flex min-w-0 items-center gap-2 text-primary hover:underline",
                      child ? "font-medium" : "font-semibold"
                    )}
                  >
                    <PlatformBadge id={c.platform} />
                    <span className="truncate">{displayName}</span>
                    <IconChevronDown className="size-3.5 shrink-0 -rotate-90 opacity-55" />
                  </button>
                )}
                {opts.warn && <NoProductWarning />}
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                {c._breakdown ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <PlatformBadge id={c.platform} size={12} />
                    <span className="truncate">{c.name}</span>
                  </span>
                ) : (
                  <span className="truncate tabular-nums">
                    №{entityId(entity, c._i)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TableCell>
        {cols.map((col) => {
          const unknown =
            !c._breakdown &&
            CRM_KEYS.has(col.key) &&
            crmUnresolved(c.name, entity)
          return (
            <TableCell
              key={col.key}
              className={cn(
                "overflow-hidden border-b px-3 text-left tabular-nums",
                col.emphasize && "bg-primary/[0.045] font-medium"
              )}
            >
              {unknown ? (
                <UnknownCell />
              ) : (
                <ValueCell row={c} col={col} cur={currency} />
              )}
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  // ---- a product "shelf" header: aggregate metrics + expand/collapse ----
  // 10 arrangements of the same shelf, chosen from the floating design dock
  function renderGroupRow(e: Extract<DisplayEntry, { kind: "group" }>) {
    const isExp = expanded.has(e.id)
    const childIdx = e.rows.map((r) => r._i)
    const allChildSel = childIdx.every((i) => sel.has(i))
    const someChildSel = childIdx.some((i) => sel.has(i))
    const count =
      e.rows.length +
      " " +
      plural(e.rows.length, "кампанія", "кампанії", "кампаній")

    // base frame: box icon (left) · #ID chip + product name · round counter (right)
    const idChip = (
      <Badge
        variant="secondary"
        className="shrink-0 gap-1 font-mono text-[10px] tracking-tight"
      >
        <IconTag className="size-3" />
        {e.id}
      </Badge>
    )
    const iconBox = (
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
        <IconPackage className="size-3.5" />
      </span>
    )
    const countBadge = (
      <span
        className="ml-auto grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary tabular-nums"
        title={count}
      >
        {e.rows.length}
      </span>
    )

    return (
      <TableRow className={cn("group/row border-0", GROUP_BG)}>
        <TableCell
          className={cn(
            "sticky left-0 z-20 border-b px-0 text-center",
            GROUP_FROZEN
          )}
          style={{ width: W_SELECT, minWidth: W_SELECT }}
        >
          <div className="flex justify-center">
            <Checkbox
              checked={allChildSel}
              indeterminate={someChildSel && !allChildSel}
              onCheckedChange={() => setGroupSel(childIdx, !allChildSel)}
              aria-label={"Обрати всі кампанії товару " + e.product}
            />
          </div>
        </TableCell>
        {showToggleCol && (
          <TableCell
            className={cn(
              "sticky z-20 border-b px-0 text-center",
              GROUP_FROZEN
            )}
            style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
          >
            <span
              className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums"
              title={e.activeCount + " з " + e.rows.length + " активні"}
            >
              {e.activeCount}/{e.rows.length}
            </span>
          </TableCell>
        )}
        <TableCell
          className={cn(
            "sticky z-20 overflow-hidden border-b py-2 pl-2",
            FROZEN_EDGE,
            GROUP_FROZEN
          )}
          style={{
            width: colWidths.name,
            minWidth: colWidths.name,
            maxWidth: colWidths.name,
            left: nameLeft,
          }}
        >
          <div className="flex w-full min-w-0 items-center gap-2">
            {/* chevron + icon toggle expand/collapse */}
            <button
              onClick={() => toggleExpand(e.id)}
              className="flex shrink-0 items-center gap-2"
              title={isExp ? "Згорнути товар" : "Розгорнути товар"}
            >
              <IconChevronRight
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isExp && "rotate-90"
                )}
              />
              {iconBox}
            </button>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex min-w-0 items-center gap-1.5">
                {idChip}
                {isLeaf ? (
                  <span className="min-w-0 truncate font-semibold">
                    {e.product}
                  </span>
                ) : (
                  <button
                    onClick={() => drillProduct(e)}
                    title={
                      "Відкрити " +
                      (entity === "Кампанії" ? "групи оголошень" : "оголошення")
                    }
                    className="flex min-w-0 items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span className="min-w-0 truncate">{e.product}</span>
                    <IconChevronDown className="size-3.5 shrink-0 -rotate-90 opacity-55" />
                  </button>
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {e.activeCount} активних
              </span>
            </span>
            {countBadge}
          </div>
        </TableCell>
        {cols.map((col) => (
          <TableCell
            key={col.key}
            className={cn(
              "overflow-hidden border-b px-3 text-left font-semibold tabular-nums",
              col.emphasize && "bg-primary/[0.06]"
            )}
          >
            <ValueCell row={e.agg} col={col} cur={currency} />
          </TableCell>
        ))}
      </TableRow>
    )
  }

  // ---- section header row ("По товарам" / "По кампаніям") ----
  // the label lives in the frozen name column so it stays visible while scrolling
  function renderDivider(
    key: string,
    Icon: TablerIcon,
    label: string,
    n: number
  ) {
    return (
      <TableRow key={key} className="hover:bg-transparent">
        <TableCell
          className={cn("sticky left-0 z-20 border-y", FOOTER_BG)}
          style={{ width: W_SELECT, minWidth: W_SELECT }}
        />
        {showToggleCol && (
          <TableCell
            className={cn("sticky z-20 border-y", FOOTER_BG)}
            style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
          />
        )}
        <TableCell
          className={cn(
            "sticky z-20 overflow-hidden border-y py-1.5 pl-3",
            FROZEN_EDGE,
            FOOTER_BG
          )}
          style={{
            width: colWidths.name,
            minWidth: colWidths.name,
            maxWidth: colWidths.name,
            left: nameLeft,
          }}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <Icon className="size-3.5 shrink-0" />
            {label}
            <Badge variant="secondary" className="text-[10px] tabular-nums">
              {n}
            </Badge>
          </span>
        </TableCell>
        {cols.map((col) => (
          <TableCell key={col.key} className={cn("border-y", FOOTER_BG)} />
        ))}
      </TableRow>
    )
  }

  // ---- skeleton row (shown while the breakdown / entity is switching) ----
  function renderSkeletonRow(i: number) {
    return (
      <TableRow key={"sk" + i} className="hover:bg-transparent">
        <TableCell
          className={cn("sticky left-0 z-20 border-b", FROZEN_BASE)}
          style={{ width: W_SELECT, minWidth: W_SELECT }}
        >
          <div className="flex justify-center">
            <Skeleton className="size-[18px] rounded-[5px]" />
          </div>
        </TableCell>
        {showToggleCol && (
          <TableCell
            className={cn("sticky z-20 border-b", FROZEN_BASE)}
            style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
          >
            <div className="flex justify-center">
              <Skeleton className="h-[18px] w-8 rounded-full" />
            </div>
          </TableCell>
        )}
        <TableCell
          className={cn(
            "sticky z-20 overflow-hidden border-b py-2 pl-3",
            FROZEN_EDGE,
            FROZEN_BASE
          )}
          style={{
            width: colWidths.name,
            minWidth: colWidths.name,
            maxWidth: colWidths.name,
            left: nameLeft,
          }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 shrink-0 rounded-md" />
            <div className="flex flex-col gap-1.5">
              <Skeleton
                className="h-3.5 w-40"
                style={{ width: 120 + ((i * 37) % 90) }}
              />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        </TableCell>
        {cols.map((col) => (
          <TableCell key={col.key} className="border-b px-3">
            <Skeleton
              className="h-4"
              style={{ width: 32 + ((i * 19 + col.key.length * 7) % 28) }}
            />
          </TableCell>
        ))}
      </TableRow>
    )
  }

  // full-page skeleton on the very first load
  if (firstLoad) return <CampaignsSkeleton cols={cols.length} />

  return (
    <div className="flex h-[calc(100svh-58px)] w-full min-w-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
      {/* flat order-sync health strip — stands in for the page title */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-card px-3.5 py-2.5 text-[13px] shadow-xs">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-amber-500/12 text-amber-600 dark:text-amber-400">
          <IconPlugConnectedX className="size-4" />
        </span>
        <span>
          <b className="font-semibold tabular-nums">{unsyncedPct}%</b> замовлень
          не синхронізовано з кампаніями
        </span>
        <span
          className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted"
          title={unsyncedPct + "% не синхронізовано"}
        >
          <span
            className="block h-full rounded-full bg-amber-500"
            style={{ width: unsyncedPct + "%" }}
          />
        </span>
        <button
          type="button"
          className="ml-auto inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
        >
          Дізнатися чому
          <IconArrowUpRight className="size-3.5" />
        </button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        {/* data-source hierarchy: platform › ad account */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 border-b p-3.5">
          {/* level 1 — platform */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <IconWorld className="size-4 text-muted-foreground" />
                  {platLabel}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="tracking-wide uppercase">
                Платформа
              </DropdownMenuLabel>
              {PLATFORMS.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p.id}
                  checked={platforms.has(p.id)}
                  onCheckedChange={() => togglePlatform(p.id)}
                  closeOnClick={false}
                >
                  <span className="flex items-center gap-2">
                    <PlatformBadge id={p.id} size={16} />
                    {p.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                closeOnClick={false}
                onClick={() => {
                  setPlatforms(new Set(PLATFORMS.map((p) => p.id)))
                  setAdAccounts(ALL_ACCOUNTS())
                  setSel(new Set())
                  setDrill({ campaigns: [], groups: [] })
                }}
              >
                Обрати всі
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <IconChevronRight className="size-4 shrink-0 text-muted-foreground/50" />

          {/* level 2 — ad account (scoped to the chosen platform(s)) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <IconStack2 className="size-4 text-muted-foreground" />
                  {accLabel}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="tracking-wide uppercase">
                Рекламні акаунти
              </DropdownMenuLabel>
              {scopedAccounts.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Немає акаунтів для цих платформ
                </div>
              ) : (
                scopedAccounts.map((a) => (
                  <DropdownMenuCheckboxItem
                    key={a.id}
                    checked={adAccounts.has(a.id)}
                    onCheckedChange={() => toggleAdAccount(a.id)}
                    closeOnClick={false}
                  >
                    <span className="flex items-center gap-2">
                      <PlatformBadge id={a.platform} size={15} />
                      {a.name}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {scopedAccounts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={() => {
                      setAdAccounts(ALL_ACCOUNTS())
                      setSel(new Set())
                      setDrill({ campaigns: [], groups: [] })
                    }}
                  >
                    Обрати всі
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto" />
          {/* display currency for money columns */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <IconCoin className="size-4 text-muted-foreground" />
                  {currency} {CURRENCY_SYMBOLS[currency]}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="tracking-wide uppercase">
                Валюта
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={currency}
                onValueChange={(v) => setCurrency(v as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <DropdownMenuRadioItem key={c} value={c} closeOnClick>
                    {c} {CURRENCY_SYMBOLS[c]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <RefreshControl />
        </div>

        {/* entity subtabs + date range (same row, date on the right) */}
        <div className="flex items-center justify-between gap-2 border-b px-3.5 pt-2.5">
          <div className="flex items-center gap-1">
            {ENTITY_TABS.map(([t, EntIcon]) => {
              const active = entity === t
              return (
                <button
                  key={t}
                  onClick={() => switchEntity(t)}
                  className={cn(
                    "-mb-px flex items-center gap-2 rounded-t-md border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <EntIcon className="size-4" />
                  {t}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {counts[t as keyof typeof counts]}
                  </span>
                </button>
              )
            })}
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* drill-down filter bar */}
        {(drill.campaigns.length > 0 || drill.groups.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-3.5 py-2.5">
            <span className="text-xs font-bold text-muted-foreground">
              Фільтр за вибором:
            </span>
            {drill.campaigns.length > 0 && (
              <Badge variant="outline" className="gap-1 bg-card py-1 pr-1">
                <IconSpeakerphone className="size-3.5" />
                Кампанії: {drill.campaigns.length}
                <button
                  onClick={clearDrill}
                  className="ml-0.5 grid size-4 place-items-center rounded-full hover:bg-muted"
                  title="Прибрати"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            )}
            {drill.groups.length > 0 && (
              <Badge variant="outline" className="gap-1 bg-card py-1 pr-1">
                <IconLayoutGrid className="size-3.5" />
                Групи: {drill.groups.length}
                <button
                  onClick={() =>
                    setDrill((d) => ({ campaigns: d.campaigns, groups: [] }))
                  }
                  className="ml-0.5 grid size-4 place-items-center rounded-full hover:bg-muted"
                  title="Прибрати"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              · знайдено {rows.length} {ENTITY_NOUN[entity]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1"
              onClick={clearDrill}
            >
              <IconX />
              Скинути все
            </Button>
          </div>
        )}

        {/* action toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b p-3.5">
          {/* Розбивка — primary mode selector, where the status tabs used to be */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <IconArrowsSplit2 />
                  <span className="text-muted-foreground">Розбивка:</span>
                  <span className="font-semibold">{breakdown}</span>
                  <IconChevronDown className="text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="tracking-wide uppercase">
                Розбивка
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={breakdown}
                onValueChange={switchBreakdown}
              >
                {BREAKDOWNS.map((b) => (
                  <DropdownMenuRadioItem key={b} value={b} closeOnClick>
                    {b}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* expand / collapse all product groups */}
          {grouped && groupIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllExpand}
              title={
                allExpanded ? "Згорнути всі товари" : "Розгорнути всі товари"
              }
            >
              {allExpanded ? <IconChevronsUp /> : <IconChevronsDown />}
              {allExpanded ? "Згорнути все" : "Розгорнути все"}
            </Button>
          )}

          {selCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-6!" />
              <span className="text-[13px] font-bold text-primary">
                Обрано: {selCount}
              </span>
              {entity === "Кампанії" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => drillInto("Групи оголошень")}
                >
                  <IconLayoutGrid />
                  Групи оголошень для {selCount}
                </Button>
              )}
              {entity === "Групи оголошень" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => drillInto("Оголошення")}
                >
                  <IconBox />
                  Оголошення для {selCount}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSel(new Set())}
              >
                <IconX />
                Зняти
              </Button>
            </>
          )}

          {/* search — fills the space between the left actions and the columns menu */}
          <div className="relative ml-auto min-w-40 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8.5"
              placeholder="Пошук за назвою"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* columns dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <IconColumns />
                  Стовпці
                  <IconChevronDown className="text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="max-h-[460px] w-64">
              <DropdownMenuLabel className="tracking-wide uppercase">
                Набори
              </DropdownMenuLabel>
              {Object.keys(PRESETS).map((p) => (
                <DropdownMenuItem
                  key={p}
                  closeOnClick={false}
                  onClick={() => {
                    const groups = PRESETS[p]
                    setVisible(
                      Object.fromEntries(
                        allCols.map((c) => [
                          c.key,
                          groups ? groups.includes(c.group) : true,
                        ])
                      )
                    )
                  }}
                >
                  <IconColumns />
                  {p}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {COL_GROUPS.map((g) => (
                <div key={g.id}>
                  <DropdownMenuLabel className="tracking-wide uppercase">
                    {g.label}
                  </DropdownMenuLabel>
                  {allCols
                    .filter((c) => c.group === g.id)
                    .map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.key}
                        checked={!!visible[c.key]}
                        onCheckedChange={() =>
                          setVisible((v) => ({ ...v, [c.key]: !v[c.key] }))
                        }
                        closeOnClick={false}
                      >
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon-sm" aria-label="Експорт">
            <IconDownload />
          </Button>
        </div>

        {/* heads-up: campaigns that can't be grouped because their name has no
            product id up front */}
        {grouped && entity === "Кампанії" && orphanCount > 0 && (
          <div className="flex items-start gap-2 border-b bg-amber-500/[0.07] px-3.5 py-2 text-xs text-amber-700 dark:bg-amber-400/[0.07] dark:text-amber-400">
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
              <b className="font-semibold">{orphanCount}</b>{" "}
              {plural(orphanCount, "кампанія", "кампанії", "кампаній")} без ID у
              назві — розбивка по товару для них недоступна.{" "}
              <button
                type="button"
                className="font-medium whitespace-nowrap underline underline-offset-2 hover:no-underline"
              >
                Читати детальніше
              </button>
            </span>
          </div>
        )}

        {/* table — the only element that scrolls; header row, totals row and the
            left "identity" columns stay frozen just like in Ads Manager */}
        <Table
          className="w-auto table-fixed border-separate border-spacing-0 text-[13px]"
          containerClassName="table-scroll min-h-0 flex-1 overflow-auto overscroll-none"
        >
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className={cn(
                  "sticky top-0 left-0 z-40 border-b px-0 text-center",
                  HEADER_BG
                )}
                style={{ width: W_SELECT, minWidth: W_SELECT }}
              >
                <div className="flex justify-center">
                  <Checkbox
                    checked={allSel}
                    onCheckedChange={toggleAll}
                    aria-label="Обрати всі"
                  />
                </div>
              </TableHead>
              {showToggleCol && (
                <TableHead
                  className={cn(
                    "sticky top-0 z-40 cursor-pointer border-b px-0 text-center",
                    HEADER_BG
                  )}
                  style={{
                    width: W_TOGGLE,
                    minWidth: W_TOGGLE,
                    left: W_SELECT,
                  }}
                  onClick={() => toggleSort("active")}
                >
                  <span className="inline-flex items-center gap-1 select-none">
                    ВКЛ
                    <SortIndicator
                      state={sort.key === "active" ? sort.dir : null}
                    />
                  </span>
                </TableHead>
              )}
              <TableHead
                className={cn(
                  "sticky top-0 z-40 cursor-pointer overflow-hidden border-b pl-3",
                  FROZEN_EDGE,
                  HEADER_BG
                )}
                style={{
                  width: colWidths.name,
                  minWidth: colWidths.name,
                  left: nameLeft,
                }}
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1 pr-2 select-none">
                  <span className="truncate">
                    {grouped ? "Товар / Кампанія" : "Кампанія"}
                  </span>
                  <SortIndicator
                    state={sort.key === "name" ? sort.dir : null}
                  />
                </span>
                <ResizeHandle onStart={(e) => startResize("name", e)} />
              </TableHead>
              {cols.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "sticky top-0 z-20 cursor-pointer overflow-hidden border-b px-3 text-left",
                    c.emphasize ? HEADER_EMPH : HEADER_BG
                  )}
                  style={{
                    width: colWidths[c.key],
                    minWidth: colWidths[c.key],
                  }}
                  title={c.hint}
                  onClick={() => toggleSort(c.key)}
                >
                  <span className="flex items-center gap-1 pr-2 select-none">
                    <span className="truncate">{c.label}</span>
                    <SortIndicator
                      state={sort.key === c.key ? sort.dir : null}
                    />
                  </span>
                  <ResizeHandle onStart={(e) => startResize(c.key, e)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {switching
              ? Array.from({ length: 8 }, (_, i) => renderSkeletonRow(i))
              : grouped
                ? (() => {
                    // "По товарам" = everything tied to a product (groups + singles);
                    // "По кампаніям" = campaigns with no product id (orphans)
                    const productCount = entries.filter(
                      (e) => e.kind !== "orphan"
                    ).length
                    const orphanTotal = entries.length - productCount
                    const out: React.ReactNode[] = []
                    let productHeaderDone = false
                    let campaignHeaderDone = false
                    for (const e of entries) {
                      if (!productHeaderDone && e.kind !== "orphan") {
                        productHeaderDone = true
                        out.push(
                          renderDivider(
                            "hdr-product",
                            IconPackage,
                            "По товарам",
                            productCount
                          )
                        )
                      }
                      if (!campaignHeaderDone && e.kind === "orphan") {
                        campaignHeaderDone = true
                        out.push(
                          renderDivider(
                            "hdr-campaign",
                            IconSpeakerphone,
                            "По кампаніям",
                            orphanTotal
                          )
                        )
                      }
                      if (e.kind === "orphan") {
                        out.push(renderRow(e.row, { warn: true }))
                      } else if (e.kind === "single") {
                        out.push(renderRow(e.row))
                      } else {
                        out.push(
                          <Fragment key={"g:" + e.id}>
                            {renderGroupRow(e)}
                            {expanded.has(e.id) &&
                              e.rows.map((r) => renderRow(r, { child: true }))}
                          </Fragment>
                        )
                      }
                    }
                    return out
                  })()
                : rows.map((c) => renderRow(c))}
            {!switching && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={colSpan}
                  className="py-16 text-center text-muted-foreground"
                >
                  Нічого не знайдено за фільтрами
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter className="border-0 bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell
                className={cn(
                  "sticky bottom-0 left-0 z-30 border-t",
                  FOOTER_BG
                )}
                style={{ width: W_SELECT, minWidth: W_SELECT }}
              />
              {showToggleCol && (
                <TableCell
                  className={cn("sticky bottom-0 z-30 border-t", FOOTER_BG)}
                  style={{
                    width: W_TOGGLE,
                    minWidth: W_TOGGLE,
                    left: W_SELECT,
                  }}
                />
              )}
              <TableCell
                className={cn(
                  "sticky bottom-0 z-30 overflow-hidden border-t pl-3 font-bold",
                  FROZEN_EDGE,
                  FOOTER_BG
                )}
                style={{
                  width: colWidths.name,
                  minWidth: colWidths.name,
                  left: nameLeft,
                }}
              >
                <span className="truncate">
                  Разом · {rows.length}{" "}
                  {BREAKDOWN_VALUES[breakdown] ? "рядків" : ENTITY_NOUN[entity]}
                </span>
              </TableCell>
              {cols.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    "sticky bottom-0 z-10 overflow-hidden border-t px-3 text-left tabular-nums",
                    col.emphasize ? HEADER_EMPH : FOOTER_BG
                  )}
                >
                  {RATE_KEYS.includes(col.key) ? (
                    <span className="font-medium text-muted-foreground">
                      сер. {fmt(foot[col.key], col.unit, currency)}
                    </span>
                  ) : (
                    <span className="font-bold">
                      {fmt(foot[col.key], col.unit, currency)}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  )
}

// full-page skeleton for the first load — mirrors the toolbar + table layout
function CampaignsSkeleton({ cols }: { cols: number }) {
  const metricCols = Math.min(cols, 7)
  return (
    <div className="flex h-[calc(100svh-58px)] w-full min-w-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
      {/* sync strip — stands in for the page title */}
      <div className="flex shrink-0 items-center gap-3 rounded-xl bg-card px-3.5 py-2.5 shadow-xs">
        <Skeleton className="size-6 shrink-0 rounded-md" />
        <Skeleton className="h-4 w-60 max-w-[45%]" />
        <Skeleton className="ml-auto h-4 w-28" />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        {/* data-source bar */}
        <div className="flex flex-wrap items-center gap-2 border-b p-3.5">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="ml-auto h-8 w-28" />
          <Skeleton className="size-8" />
        </div>
        {/* entity tabs */}
        <div className="flex items-center gap-5 border-b px-3.5 py-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-32" />
          ))}
          <Skeleton className="ml-auto h-8 w-32" />
        </div>
        {/* action toolbar */}
        <div className="flex items-center gap-2.5 border-b p-3.5">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="ml-auto h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="size-8" />
        </div>
        {/* table */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3.5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-[18px] shrink-0 rounded-[5px]" />
              <Skeleton className="h-5 w-8 shrink-0 rounded-full" />
              <Skeleton className="size-6 shrink-0 rounded-md" />
              <Skeleton
                className="h-4 shrink-0"
                style={{ width: 130 + ((i * 41) % 110) }}
              />
              <div className="ml-auto flex items-center gap-5">
                {Array.from({ length: metricCols }, (_, j) => (
                  <Skeleton
                    key={j}
                    className="h-4"
                    style={{ width: 34 + ((i * 13 + j * 17) % 26) }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// three visual states: ascending ▲, descending ▼, or unsorted (faded ⇅)
function SortIndicator({ state }: { state: "asc" | "desc" | null }) {
  if (state === "asc")
    return <IconChevronUp className="size-3.5 shrink-0 text-foreground" />
  if (state === "desc")
    return <IconChevronDown className="size-3.5 shrink-0 text-foreground" />
  return (
    <IconArrowsSort className="size-3.5 shrink-0 text-muted-foreground/35" />
  )
}

const COL_WIDTHS_KEY = "campaigns.colWidths.v1"
function defaultColWidth(label: string) {
  return Math.round(Math.min(180, Math.max(100, label.length * 7.5 + 34)))
}

// drag handle on a column's right edge; sits over the header cell's border
function ResizeHandle({ onStart }: { onStart: (e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={onStart}
      onClick={(e) => e.stopPropagation()}
      role="separator"
      aria-orientation="vertical"
      className="group/resize absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none items-center justify-center"
    >
      <span className="h-1/2 w-px bg-border transition-all group-hover/resize:h-full group-hover/resize:w-0.5 group-hover/resize:bg-primary" />
    </span>
  )
}

// row on/off switch that shows a brief loader while the change "saves"
function RowSwitch({
  active,
  onChange,
}: {
  active: boolean
  onChange: (v: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  function handle(v: boolean) {
    setLoading(true)
    window.setTimeout(() => {
      onChange(v)
      setLoading(false)
    }, 700)
  }
  return (
    <Switch
      checked={active}
      loading={loading}
      onCheckedChange={handle}
      aria-label="Увімкнути / вимкнути"
    />
  )
}
