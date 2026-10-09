import {
  IconArrowsSort,
  IconArrowUpRight,
  IconBolt,
  IconBox,
  IconChevronDown,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconChevronUp,
  IconColumns,
  IconCrown,
  IconDownload,
  IconFilter,
  IconHelpCircle,
  IconLayoutGrid,
  IconLock,
  IconPackage,
  IconPencil,
  IconPlugConnectedX,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSpeakerphone,
  IconStack2,
  IconTag,
  IconTagOff,
  IconUser,
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useCurrency } from "@/components/currency-provider"
import { useDataSources } from "@/components/data-sources-provider"
import { useRules } from "@/components/rules-provider"
import { useTeam } from "@/components/team-provider"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { PricingDialog } from "@/features/billing/pricing-dialog"
import type { DisplayCurrency } from "@/features/currency/types"
import { RuleDialog, type RuleSeed } from "@/features/rules/rule-dialog"
import { blankRule, type RuleLevel } from "@/features/rules/types"
import type { TeamMember } from "@/features/team/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { AdsPicker } from "@/pages/statistics/ads-picker"
import {
  adsSummary,
  countFilters,
  EMPTY_FILTERS,
  matchingAccounts,
  runnerOf,
  type ReportFilters,
} from "@/pages/statistics/data"
import { useDraftFilters } from "@/pages/statistics/draft-filters"
import {
  AD_ACCOUNTS,
  AD_GROUPS,
  ADS,
  BUYOUT_DEPENDENT_KEYS,
  CAMPAIGNS,
  COL_GROUPS,
  COLUMNS,
  CRM_METRIC_KEYS,
  fmt,
  parseProductId,
  plural,
  PRESETS,
  PRODUCTS,
  totals,
  type Column,
  type ColumnGroup,
  type MetricKey,
  type Row,
} from "./data"
import { DateRangePicker } from "./date-range"
import { addDays, rangeLabel, startOfDay, type DateRange } from "./date-utils"
import { CampaignFiltersSheet } from "./filters-sheet"
import { PlatformBadge } from "./platform-badge"
import { ProductPickerDialog, type ProductTarget } from "./product-picker"

// Columns that stop being measurements once the base buyout % is substituted.
const FORECAST_KEYS = new Set(BUYOUT_DEPENDENT_KEYS)

// Wraps a forecast value so it explains itself on hover. Deliberately quieter
// than UnknownCell's amber dashed frame: there *is* a number here, it just
// isn't final yet.
function ForecastTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="cursor-help">{children}</span>}
      />
      <TooltipContent className="max-w-[260px] leading-relaxed">
        <span className="flex flex-col gap-1">
          <span className="font-medium">Прогноз, а не факт</span>
          <span>
            Спирається на базовий % викупу з Налаштувань — фактичного ще немає.
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

// ---- single metric cell: pill / mini-bar / plain number ----
// accepts a full Row or an aggregated { metric: value } map (product-group total)
function ValueCell({
  row,
  col,
  cur,
  compact = false,
  estimated = false,
}: {
  row: Record<MetricKey, number>
  col: Column
  /** display currency from Налаштування - money columns are converted into it */
  cur: DisplayCurrency
  /** phone layout - drops the decorative mini-bar, keeps the number */
  compact?: boolean
  /** the row runs on the base buyout %, so this value is a forecast */
  estimated?: boolean
}) {
  const v = row[col.key]
  // one leading tilde is the whole signal - it survives every layout, phone
  // included, and reads as "приблизно" without a legend. Kept as its own dimmed
  // span rather than glued to the string so it stays legible on "~-12,4%".
  const text = (
    <>
      {estimated && <span className="mr-px opacity-55">~</span>}
      {fmt(v, col.unit, cur)}
    </>
  )
  const wrap = (node: React.ReactNode) =>
    estimated ? <ForecastTooltip>{node}</ForecastTooltip> : node
  // dotted, not solid: an annotation on the number rather than a link
  const dotted =
    estimated && "underline decoration-dotted decoration-1 underline-offset-4"

  if (
    col.key === "roi" ||
    col.key === "romi" ||
    col.key === "probableIncome" ||
    col.key === "ownerIncome"
  ) {
    return wrap(
      <Badge
        variant="outline"
        className={cn(
          "tabular-nums",
          // a pill can't carry an underline legibly - it goes dashed instead
          estimated ? "border-dashed border-current/35" : "border-transparent",
          compact && "px-1.5 text-[11px]",
          v >= 0
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {text}
      </Badge>
    )
  }

  if (!compact && (col.key === "approveRate" || col.key === "buyoutRate")) {
    return wrap(
      <span className="inline-flex items-center gap-2">
        <span className={cn("w-11 tabular-nums", dotted)}>{text}</span>
        <span className="h-1.5 w-11 overflow-hidden rounded-full bg-muted">
          {/* a faded fill for a bar that was assumed rather than measured */}
          <span
            className={cn(
              "block h-full rounded-full",
              estimated ? "bg-primary/40" : "bg-primary"
            )}
            style={{ width: Math.min(100, v) + "%" }}
          />
        </span>
      </span>
    )
  }

  return wrap(<span className={cn("tabular-nums", dotted)}>{text}</span>)
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
// phone tab labels - "Групи оголошень" is too long for a 3-tab strip
const ENTITY_SHORT: Record<string, string> = {
  Кампанії: "Кампанії",
  "Групи оголошень": "Групи",
  Оголошення: "Оголошення",
}
// the level an automated rule made from this tab acts on
const ENTITY_LEVEL: Record<string, RuleLevel> = {
  Кампанії: "campaign",
  "Групи оголошень": "adset",
  Оголошення: "ad",
}
// Synthetic per-level identifier shown under the name: a campaign id on the
// campaign level, an ad-group id on groups, an ad id on ads. Ad-platform ids are
// long, so a campaign carries 12 digits; each level stays a couple of digits
// longer than the one above it, so the ids read as belonging to that level.
function entityId(entity: string, i: number): number {
  if (entity === "Групи оголошень") return 62340010023400 + i * 17
  if (entity === "Оголошення") return 7890120045000230 + i * 23
  return 481200734100 + i * 6 // Кампанії
}

// Who created the row: the buyer who runs the cabinet it sits in - the same
// person the Команда filter in Статистика reads that cabinet for. Ad groups and
// ads sit in their campaign's cabinet, so everything under one campaign shows
// the same person. A team with no buyer yet has nobody running cabinets, so a
// stable hash of the campaign name picks any member instead.
function authorOf(members: TeamMember[], c: Row): TeamMember | null {
  const cabinet = AD_ACCOUNTS.find((a) => a.id === c.adAccount)
  const runner = cabinet ? runnerOf(cabinet.login, members) : null
  if (runner) return runner
  if (!members.length) return null
  const key = c.campaign ?? c.name
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return members[h % members.length]
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
// The table is a list of products - a "shelf" row each, opening on the rows
// tied to it. Two shelves of their own head the list, named for the level on
// screen: every row, then the rows no product is tied to, neither by the id in
// the name nor by hand.
const ALL_SHELF: Record<string, string> = {
  Кампанії: "Усі кампанії",
  "Групи оголошень": "Усі групи оголошень",
  Оголошення: "Усі оголошення",
}
const NO_PRODUCT_SHELF: Record<string, string> = {
  Кампанії: "Кампанії без товару",
  "Групи оголошень": "Групи без товару",
  Оголошення: "Оголошення без товару",
}
// their keys in the expanded set - a product id is digits, so these can't clash
const ALL_ID = ":all"
const NO_PRODUCT_ID = ":none"
// how a shelf counts the rows under it, by level: 1 / 2-4 / 5 and up
const ENTITY_FORMS: Record<string, [string, string, string]> = {
  Кампанії: ["кампанія", "кампанії", "кампаній"],
  "Групи оголошень": ["група", "групи", "груп"],
  Оголошення: ["оголошення", "оголошення", "оголошень"],
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
// right edge of a frozen name column - a hairline that reads as a seam while scrolling
const FROZEN_EDGE = "shadow-[1px_0_0_0_var(--border)]"
// A row's bottom line drawn as an inset shadow rather than a border: a shadow
// takes no height, so a row folded shut under its shelf leaves nothing behind.
const ROW_LINE = "shadow-[inset_0_-1px_0_0_var(--border)]"
// ...and both at once, for a frozen name cell of such a row
const FROZEN_EDGE_LINE =
  "shadow-[1px_0_0_0_var(--border),inset_0_-1px_0_0_var(--border)]"
// The Товар column's right edge. Inset, unlike FROZEN_EDGE: the cell after it
// is frozen too and would paint over a hairline drawn outside this one.
const PRODUCT_EDGE = "shadow-[inset_-1px_0_0_0_var(--border)]"
const PRODUCT_EDGE_LINE =
  "shadow-[inset_-1px_0_0_0_var(--border),inset_0_-1px_0_0_var(--border)]"

// A shelf reads like a tab in a list: plain while shut, and once open a neutral
// wash a step off the rows it holds. The frozen variant is opaque so scrolled
// cells can't bleed through.
const OPEN_BG =
  "bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] hover:bg-[color-mix(in_oklab,var(--muted)_70%,var(--card))]"
const OPEN_FROZEN =
  "bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] group-hover/row:bg-[color-mix(in_oklab,var(--muted)_70%,var(--card))]"

// ---- manual product links ----
// A campaign is tied to a product by the id its name starts with. That id can be
// overridden by hand: the user attaches a product to a campaign whose name has
// none, swaps it, or detaches it. Links live in one map keyed by entity + name;
// a missing key means "whatever the name says".
type ProductLinks = Record<string, string | null>

function linkKey(entity: string, name: string) {
  return entity + ":" + name
}
// The product a row belongs to: its campaign's. A manual link wins over the id
// in the campaign's name, and null means no product at all. Ad groups and ads
// have none of their own - they follow the campaign they sit in, so a row keeps
// its shelf from one level to the next, a hand-attached product included.
function productIdFor(links: ProductLinks, row: Row): string | null {
  const campaign = row.campaign ?? row.name
  const k = linkKey("Кампанії", campaign)
  return k in links ? links[k] : parseProductId(campaign).id
}

// Shelf title for a product id: the catalogue name, or - for an id typed into
// the picker that the catalogue doesn't know yet - the campaign's own name when
// the id came from it, and a plain "Товар #id" when it didn't.
function productLabel(id: string, sampleName: string) {
  if (PRODUCTS[id]) return PRODUCTS[id]
  const parsed = parseProductId(sampleName)
  return parsed.id === id ? parsed.rest : "Товар " + id
}

// The action icon trailing the product chip - a pencil on a chip that holds a
// product, a plus on the empty slot. Always visible, so the row never hides what
// can be done to it; hovering the row just brings it up to full strength.
const CHIP_ACTION = "size-3.5 shrink-0 opacity-60 group-hover/row:opacity-100"

// The product marker every row carries: the #id chip when the row has a
// product, a dashed "Прикріпити товар" slot when it has none. On campaigns the marker is also the button that opens the picker,
// with a pencil / plus trailing the label. Ad groups / ads only ever show it
// read-only: products are attached to campaigns, deeper levels inherit them.
function ProductControl({
  productId,
  onEdit,
  compact = false,
}: {
  /** product in effect, null when the row has none */
  productId: string | null
  /** omitted where the link can't be edited (ad groups / ads) */
  onEdit?: () => void
  /** phone layout - shorter label, smaller hit area */
  compact?: boolean
}) {
  const productName = productId
    ? (PRODUCTS[productId] ?? "Товар " + productId)
    : null

  if (productId === null) {
    // An empty slot, not an alarm: the campaigns missing a product already have
    // a shelf of their own at the top of the list, so the row only has to offer
    // the fix. The dashed chip reads as "something goes here" and invites the
    // click.
    const cls = cn(
      "shrink-0 gap-1 border-dashed border-border/80 bg-transparent font-normal text-muted-foreground",
      compact && "h-4 px-1.5 text-[10px]",
      onEdit &&
        "cursor-pointer hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
    )
    if (!onEdit) {
      // ad groups / ads - nothing to click here, so it stays an explanation
      return (
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge variant="outline" className={cls}>
                <IconTag className="size-3" />
                Без товару
              </Badge>
            }
          />
          <TooltipContent className="max-w-[260px] leading-relaxed">
            У кампанії немає товару. Товар прикріплюється на рівні кампанії.
          </TooltipContent>
        </Tooltip>
      )
    }
    return (
      <Badge
        variant="outline"
        className={cls}
        render={
          <button
            type="button"
            onClick={onEdit}
            aria-label="Прикріпити товар до кампанії"
          />
        }
      >
        <IconTag className="size-3" />
        {compact ? "Прикріпити" : "Прикріпити товар"}
        <IconPlus className={CHIP_ACTION} />
      </Badge>
    )
  }

  // The product marker: one #id chip, so a row reads the same whether the id
  // came from its name or was attached by hand.
  // No tooltip - the chip says what it is, the pencil that it can be changed.
  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 gap-1 font-mono text-[10px] tracking-tight",
        compact && "h-4 px-1.5",
        onEdit && "cursor-pointer hover:bg-primary/12 hover:text-primary"
      )}
      render={
        onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={
              "Товар " +
              productId +
              " · " +
              productName +
              ". Змінити або відкріпити."
            }
          />
        ) : undefined
      }
    >
      <IconTag className="size-3" />
      {productId}
      {onEdit && <IconPencil className={CHIP_ACTION} />}
    </Badge>
  )
}

// no active plan: takes the sync-health strip's slot at the top of the page, so
// the state is announced before the table is even reached. Same one-line shape
// as the strip it replaces - the label and the CTA collapse on narrow screens.
function NoPlanStrip({ onPick }: { onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full shrink-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-left text-xs shadow-xs ring-1 ring-destructive/25 sm:gap-3 sm:px-3.5 sm:py-2.5 sm:text-[13px]"
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
        <IconLock className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate sm:flex-none">
        <b className="font-semibold">Немає активного тарифу</b>
        <span className="hidden sm:inline">
          {" "}
          - статистика кампаній прихована
        </span>
      </span>
      <span className="ml-auto hidden shrink-0 items-center gap-1 font-medium text-primary hover:underline sm:inline-flex">
        Обрати тариф
        <IconArrowUpRight className="size-3.5" />
      </span>
      <IconArrowUpRight
        className="size-4 shrink-0 text-primary sm:hidden"
        aria-label="Обрати тариф"
      />
    </button>
  )
}

// sits on top of the blurred table while the account has no plan - the toolbars
// stay live, only the numbers are held back. Same shape as the dashboard's
// locked stat widgets, with the crown flagged in the destructive tone.
function NoPlanOverlay({ onPick }: { onPick: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 p-4 dark:bg-black/60">
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
          <IconLock className="size-5 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold">Немає активного тарифу</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Підключіть тариф, щоб бачити статистику кампаній
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={onPick}
        >
          <IconCrown className="size-4" />
          Підключіть тариф
        </Button>
      </div>
    </div>
  )
}

// CRM (order-derived) metrics - the ones that can't always be attributed to a
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

// "no data at this level" cell - reads as clickable, opens an explanation (demo)
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

type SyncState = "syncing" | "idle" | "cooling"

// the whole sync state in one dot: green and pinging only while a pull is in
// flight, a quiet grey marker the rest of the time (amber while the rate
// limiter is holding the button)
function SyncDot({ state }: { state: SyncState }) {
  const color =
    state === "cooling"
      ? "bg-amber-500"
      : state === "syncing"
        ? "bg-emerald-500"
        : "bg-muted-foreground/50"

  return (
    <span className="relative flex size-1.5 shrink-0">
      {state === "syncing" && (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            color
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex size-full rounded-full transition-colors duration-700",
          color
        )}
      />
    </span>
  )
}

// "Оновити" + last-updated time, with a small anti-spam rate limiter: three quick
// clicks in a row lock the button for 5s. Isolated in its own component so its
// once-a-second tick doesn't re-render the whole table.
function RefreshControl({ compact = false }: { compact?: boolean }) {
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
    // two full pings of the dot - long enough to read as a real pull
    window.setTimeout(() => setSpinning(false), 1800)
  }

  const status = cooling
    ? `Наступна спроба через ${remaining}с`
    : relativeTime(lastUpdated, now)

  const dotState: SyncState = cooling
    ? "cooling"
    : spinning
      ? "syncing"
      : "idle"

  // lowercase to sit with "щойно" / "5 хв тому"
  const label = spinning && !cooling ? "синхронізація" : status

  // on a phone the "Оновити" label goes but the sync time stays - it's the one
  // thing you can't get back by tapping something
  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        {/* no room for a "синхронізація" label here - the pinging dot carries it */}
        <span
          className={cn(
            "flex items-center gap-1.5 text-[11px] whitespace-nowrap tabular-nums",
            cooling
              ? "text-amber-600 dark:text-amber-500"
              : "text-muted-foreground"
          )}
        >
          <SyncDot state={dotState} />
          {cooling ? remaining + "с" : relativeTime(lastUpdated, now)}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={refresh}
          disabled={cooling}
          className={cn(cooling && "text-amber-600 dark:text-amber-500")}
          title={cooling ? "Забагато оновлень поспіль" : "Оновлено " + status}
          aria-label="Оновити дані"
        >
          <IconRefresh className={cn("size-4", spinning && "animate-spin")} />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs whitespace-nowrap tabular-nums",
          cooling
            ? "text-amber-600 dark:text-amber-500"
            : "text-muted-foreground"
        )}
      >
        <SyncDot state={dotState} />
        {/* keyed so every label change (and the moment a pull lands) cross-fades
            instead of snapping */}
        <span key={label} className="animate-in duration-500 fade-in">
          {label}
        </span>
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

type SortKey = "name" | "active" | MetricKey
type Indexed = Row & { _i: number }

// One line of the product list: a product with the campaigns tied to it, or one
// of the two shelves heading the list (see ALL_SHELF / NO_PRODUCT_SHELF).
type Shelf = {
  kind: "all" | "none" | "product"
  id: string
  label: string
  rows: Indexed[]
  agg: Record<MetricKey, number>
  activeCount: number
}

export function CampaignsPage() {
  const allCols = COLUMNS
  // phones get a single "Фільтри" button + bottom sheet instead of the three
  // toolbar rows, and a denser table (see the DENSITY_* constants below)
  const isMobile = useIsMobile()
  // no active plan - same account-level state the dashboard locks its widgets
  // with; here it replaces the sync strip and veils the table
  const { noPlan } = useDataSources()
  // the people rows are attributed to - the same team managed in Налаштування
  const { members } = useTeam()
  const [pricingOpen, setPricingOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
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
    // the two frozen name columns: Товар, then Кампанія ("name")
    const defaults: Record<string, number> = { product: 280, name: 340 }
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
  // Реклама - one filter over the whole source hierarchy (платформа › акаунт ›
  // кабінет), the same picker the Статистика panel is cut by. It holds
  // cabinets, and empty is "усі".
  const [ads, setAds] = useState<ReportFilters>(EMPTY_FILTERS)
  const showToggleCol = true
  // The checkbox column is switched off: the table reads as a list of product
  // tabs now, with no rows to pick. What hangs off a selection - opening the
  // next level for the picked rows, a rule for them - stays out of the toolbar
  // with it, since nothing can be picked.
  const showSelectCol: boolean = false
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
  // display currency for money columns - set once in Налаштування → Загальне,
  // so it stays the same everywhere instead of being a per-table filter
  const { currency } = useCurrency()
  // the shelves standing open - ALL_ID, NO_PRODUCT_ID or product ids. Kept
  // across the levels, so a product stays open from its campaigns down to its ads.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  // products attached to rows by hand - see productIdFor above
  const [productLinks, setProductLinks] = useState<ProductLinks>({})
  // the row whose product is being edited - kept while the dialog animates out
  const [pickerTarget, setPickerTarget] = useState<ProductTarget | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  // automated rules - Ads Manager keeps its Rules menu in the table toolbar,
  // and a rule made there starts on the rows picked in the table
  const navigate = useNavigate()
  const { rules, saveRule } = useRules()
  const [ruleSeed, setRuleSeed] = useState<RuleSeed | null>(null)
  const [ruleOpen, setRuleOpen] = useState(false)

  // full-page loading skeleton on first load
  const [firstLoad, setFirstLoad] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setFirstLoad(false), 750)
    return () => window.clearTimeout(t)
  }, [])

  const cols = allCols.filter((c) => visible[c.key])
  const isLeaf = entity === "Оголошення"

  const productIdOf = (c: Row) => productIdFor(productLinks, c)
  // products are attached to campaigns; ad groups and ads follow their
  // campaign, so the picker is only reachable from the campaign level
  const canEditProduct = entity === "Кампанії"
  function openProductPicker(c: Row) {
    setPickerTarget({
      key: linkKey(entity, c.name),
      name: c.name,
      productId: productIdOf(c),
      // the address, not the name: the dialog is where you decide to go ask the
      // person who runs the campaign about the product behind it
      authorEmail: authorOf(members, c)?.email ?? null,
    })
    setPickerOpen(true)
  }
  function saveProductLink(key: string, productId: string | null) {
    setProductLinks((m) => ({ ...m, [key]: productId }))
    // open the shelf the campaign just joined, so the move is visible
    if (productId) setExpanded((s) => new Set(s).add(productId))
  }
  // The cabinets the filter leaves standing - a campaign belongs to exactly one.
  const keptAccounts = useMemo(
    () => new Set(matchingAccounts(ads).map((a) => a.id)),
    [ads]
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
    return keptAccounts.has(c.adAccount) && drillOk(e, c)
  }

  function setActive(c: Indexed, val: boolean) {
    setActiveMap((m) => ({ ...m, [entity + ":" + c._i]: val }))
  }
  function switchEntity(e: string) {
    setEntity(e)
    setSel(new Set())
  }
  // A narrower source can hide the rows a selection or a drill-down was made
  // on, so both are dropped whenever the filter lands - from the toolbar's
  // button or from the sheet's.
  function commitAds(next: ReportFilters) {
    setAds(next)
    setSel(new Set())
    setDrill({ campaigns: [], groups: [] })
  }
  // Ticking a cabinet does not rebuild the table - a set of ticks is only worth
  // re-reading once it is finished. Застосувати, in the picker or beside it,
  // is what hands the draft over.
  const adDraft = useDraftFilters(ads, commitAds)
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

  const counts = useMemo(
    () => ({
      Кампанії: CAMPAIGNS.filter((c) => baseFilter("Кампанії", c)).length,
      "Групи оголошень": AD_GROUPS.filter((c) =>
        baseFilter("Групи оголошень", c)
      ).length,
      Оголошення: ADS.filter((c) => baseFilter("Оголошення", c)).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keptAccounts, drill]
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
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, keptAccounts, drill, query, sort, activeMap])

  // share of orders (approves) that can't be synced to a product - orders on
  // campaigns with no product id, minus the ones a manual link resolved
  const unsyncedPct = useMemo(() => {
    let total = 0
    let bad = 0
    for (const c of CAMPAIGNS) {
      total += c.approves
      const k = linkKey("Кампанії", c.name)
      const resolved =
        k in productLinks ? productLinks[k] !== null : c.match === "ok"
      if (!resolved) bad += c.approves
    }
    return total ? Math.round((bad / total) * 100) : 0
  }, [productLinks])

  // The table is a list of products: a shelf per product, holding the rows tied
  // to it. Whatever the sort, two shelves head the list: every row, then the
  // rows with no product. The active sort orders the products by their totals;
  // the rows inside each shelf keep the order it gave them.
  const shelves = useMemo<Shelf[]>(() => {
    if (rows.length === 0) return []
    const shelf = (
      kind: Shelf["kind"],
      id: string,
      label: string,
      rs: Indexed[]
    ): Shelf => ({
      kind,
      id,
      label,
      rows: rs,
      agg: totals(rs),
      activeCount: rs.filter((r) => r.active).length,
    })
    const byProduct = new Map<string, Indexed[]>()
    const noProduct: Indexed[] = []
    for (const r of rows) {
      const id = productIdFor(productLinks, r)
      if (!id) {
        noProduct.push(r)
        continue
      }
      const arr = byProduct.get(id)
      if (arr) arr.push(r)
      else byProduct.set(id, [r])
    }
    const products = Array.from(byProduct, ([id, rs]) =>
      shelf("product", id, productLabel(id, rs[0].name), rs)
    )
    if (sort.key) {
      const key = sort.key
      const dir = sort.dir === "asc" ? 1 : -1
      const val = (s: Shelf): number | string =>
        key === "name"
          ? s.label.toLowerCase()
          : key === "active"
            ? s.activeCount
            : s.agg[key]
      products.sort((a, b) => {
        const av = val(a)
        const bv = val(b)
        const cmp =
          typeof av === "string"
            ? av.localeCompare(bv as string)
            : av - (bv as number)
        return cmp * dir
      })
    }
    return [
      shelf("all", ALL_ID, ALL_SHELF[entity], rows),
      ...(noProduct.length > 0
        ? [shelf("none", NO_PRODUCT_ID, NO_PRODUCT_SHELF[entity], noProduct)]
        : []),
      ...products,
    ]
  }, [rows, sort, productLinks, entity])

  const foot = useMemo(() => totals(rows), [rows])
  const totalLabel = "Разом · " + rows.length + " " + ENTITY_NOUN[entity]
  // a total built partly on the base buyout % is a forecast as well
  const footEstimated = useMemo(
    () => rows.some((r) => r.buyoutEstimated),
    [rows]
  )

  // "Розгорнути все" leaves the all-rows shelf shut - opened, it would list
  // every row a second time
  const groupIds = useMemo(
    () => shelves.flatMap((s) => (s.kind === "all" ? [] : [s.id])),
    [shelves]
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
    setExpanded((s) => (allExpanded ? new Set() : new Set([...s, ...groupIds])))
  }
  // a shelf's checkbox picks every row under it
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
  // the picked rows, as indices into the level's dataset
  const ruleTargets = Array.from(sel)
  function createRule() {
    setRuleSeed({
      rule: {
        ...blankRule(ENTITY_LEVEL[entity] ?? "campaign"),
        targets: ruleTargets.length > 0 ? ruleTargets : null,
      },
      isNew: true,
    })
    setRuleOpen(true)
  }
  const adCount = countFilters(ads)
  const adDraftCount = countFilters(adDraft.draft)

  // ---- mobile filter sheet plumbing ----
  const hiddenCols = allCols.length - cols.length
  // how many filters differ from the default - the number on the "Фільтри" pill
  const activeFilterCount = adCount + (hiddenCols > 0 ? 1 : 0)

  function applyColumnPreset(groups: ColumnGroup[] | null) {
    setVisible(
      Object.fromEntries(
        allCols.map((c) => [c.key, groups ? groups.includes(c.group) : true])
      )
    )
  }
  // "Скинути" in the sheet - back to the state the page opens in. A fresh empty
  // object rather than the shared constant, so a draft holding unapplied ticks
  // is reset along with what was applied.
  function resetFilters() {
    commitAds({ ...EMPTY_FILTERS })
    applyColumnPreset(null)
    setQuery("")
    const t = startOfDay(new Date())
    setDateRange({ from: addDays(t, -6), to: t })
  }

  // Two frozen name columns on a desktop: Товар, then Кампанія. A phone has
  // room for one, so there a shelf and the rows under it share it, nested.
  const twoCols = !isMobile
  const colSpan =
    cols.length +
    (twoCols ? 2 : 1) +
    (showSelectCol ? 1 : 0) +
    (showToggleCol ? 1 : 0)

  // Fixed frozen-column widths (px). Keeping them explicit means the sticky `left`
  // offsets can never drift out of sync with the rendered columns, so the frozen
  // block and the scrolling block always line up seamlessly.
  const W_SELECT = 44
  // on a phone this is the leftmost column, so it needs enough room for "ВКЛ" +
  // the sort arrow to sit centred instead of touching the card edge
  const W_TOGGLE = isMobile ? 56 : 52
  // Left to right: select, Товар, ВКЛ, Кампанія. The switch stands past Товар so
  // that everything of a campaign's own - on/off, name, product mark - starts
  // one column in, and Товар is left blank under the product it belongs to.
  const productLeft = showSelectCol ? W_SELECT : 0
  const productW = colWidths.product
  const toggleLeft = productLeft + (twoCols ? productW : 0)
  const nameLeft = toggleLeft + (showToggleCol ? W_TOGGLE : 0)
  // On a phone the name column is fixed (resizing needs a mouse) and metric
  // columns shrink to roughly two-and-a-bit per screen - wide enough for the
  // longest formatted number, narrow enough to swipe through quickly.
  const nameW = isMobile ? 158 : colWidths.name
  const colW = (c: Column) =>
    isMobile ? mobileColWidth(c.label) : colWidths[c.key]
  // phone density - one notch tighter than the desktop px-3 / py-2 cells
  const cellPad = isMobile ? "px-2 py-1.5" : "px-3"
  // the same for a cell that folds - there the padding moves inside the fold
  const foldPad = isMobile ? "px-2 py-1.5" : "px-3 py-2"
  const nameXPad = isMobile ? "pl-2" : "pl-3"
  const rowYPad = isMobile ? "py-1.5" : "py-2"
  // opaque tone for the frozen cells, and the matching one for the rest of the row
  const frozenBg = (selected: boolean) => (selected ? FROZEN_SEL : FROZEN_BASE)
  const rowBg = (selected: boolean) => (selected ? ROW_SEL : ROW_HOVER)

  // ---- a single campaign row ----
  // The full original campaign name is always shown, including the id prefix.
  // The row stays in the table while its shelf is shut, folded to no height
  // (see Fold), so that opening and shutting run as a movement, not a jump.
  function renderRow(c: Indexed, open: boolean, last: boolean) {
    // without the checkbox column there's no way to change the selection, so a
    // selection carried over from a wider viewport must not tint rows
    const selected = showSelectCol && sel.has(c._i)
    const displayName = c.name
    const author = authorOf(members, c)
    // product state of the row: attach / change / detach lives on this control
    const pid = productIdOf(c)
    const productCtl = (
      <ProductControl
        productId={pid}
        compact={isMobile}
        onEdit={canEditProduct ? () => openProductPicker(c) : undefined}
      />
    )
    return (
      <TableRow
        key={c._i}
        // folded away it must not be reachable by keyboard or screen reader
        inert={!open}
        className={cn("group/row border-0", rowBg(selected))}
      >
        {showSelectCol && (
          <TableCell
            className={cn(
              "sticky left-0 z-20 p-0 text-center",
              ROW_LINE,
              frozenBg(selected)
            )}
            style={{ width: W_SELECT, minWidth: W_SELECT }}
          >
            <Fold open={open} className="flex justify-center py-2">
              <Checkbox
                checked={selected}
                onCheckedChange={() => toggleSel(c._i)}
                aria-label="Обрати рядок"
              />
            </Fold>
          </TableCell>
        )}
        {/* Товар - blank here: the row hangs under its product, and all that
            is its own starts one column in. No line between the rows either,
            so the blank reads as one block, closed after the shelf's last. */}
        {twoCols && (
          <TableCell
            className={cn(
              "sticky z-20 p-0",
              last ? PRODUCT_EDGE_LINE : PRODUCT_EDGE,
              frozenBg(selected)
            )}
            style={{
              width: productW,
              minWidth: productW,
              maxWidth: productW,
              left: productLeft,
            }}
          />
        )}
        {showToggleCol && (
          <TableCell
            className={cn(
              "sticky z-20 p-0 text-center",
              ROW_LINE,
              frozenBg(selected)
            )}
            style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: toggleLeft }}
          >
            <Fold open={open} className="flex justify-center py-2">
              <RowSwitch
                active={c.active}
                onChange={(val) => setActive(c, val)}
              />
            </Fold>
          </TableCell>
        )}
        <TableCell
          className={cn(
            "sticky z-20 overflow-hidden p-0",
            FROZEN_EDGE_LINE,
            frozenBg(selected)
          )}
          style={{
            width: nameW,
            minWidth: nameW,
            maxWidth: nameW,
            left: nameLeft,
          }}
        >
          <Fold open={open} className={cn("pr-2", rowYPad, nameXPad)}>
            <div
              className={cn(
                "flex min-w-0 gap-1.5",
                twoCols ? "items-center" : "items-stretch"
              )}
            >
              {/* with one name column the row sits nested under its shelf */}
              {!twoCols && (
                <span className="ml-1.5 w-3 shrink-0 self-stretch border-l border-border/60" />
              )}
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-0.5",
                  !twoCols && "justify-center"
                )}
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  {isLeaf ? (
                    <span className="flex min-w-0 items-center gap-2 font-semibold">
                      <PlatformBadge id={c.platform} />
                      <span className="truncate">{displayName}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => drillRow(c)}
                      title={
                        "Відкрити " +
                        (entity === "Кампанії"
                          ? "групи оголошень"
                          : "оголошення")
                      }
                      className="flex min-w-0 items-center gap-2 font-semibold text-primary hover:underline"
                    >
                      <PlatformBadge id={c.platform} />
                      <span className="truncate">{displayName}</span>
                      <IconChevronDown className="size-3.5 shrink-0 -rotate-90 opacity-55" />
                    </button>
                  )}
                  {/* on a phone the badge would eat the whole 158px name
                      column, so there it moves down to the subline instead */}
                  {!isMobile && productCtl}
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                  {isMobile && pid === null ? (
                    // the warning is worth more than the row number here
                    productCtl
                  ) : (
                    <>
                      <span className="shrink-0 tabular-nums">
                        №{entityId(entity, c._i)}
                      </span>
                      {/* who made it - the name reads faster than the address
                          in a list, so the phone drops it (158px of name
                          column) and the product dialog carries the email
                          instead */}
                      {!isMobile && author && (
                        <span className="flex min-w-0 items-center gap-1">
                          <span aria-hidden className="opacity-40">
                            ·
                          </span>
                          <IconUser className="size-3 shrink-0 opacity-70" />
                          <span className="truncate" title={author.email}>
                            {author.name}
                          </span>
                        </span>
                      )}
                    </>
                  )}
                  {/* the phone keeps the row number and hangs the tag / edit
                      control off the end of the same line */}
                  {isMobile && pid !== null && (
                    <span className="ml-auto flex shrink-0">{productCtl}</span>
                  )}
                </div>
              </div>
            </div>
          </Fold>
        </TableCell>
        {cols.map((col) => {
          const unknown = CRM_KEYS.has(col.key) && crmUnresolved(c.name, entity)
          return (
            <TableCell
              key={col.key}
              className={cn(
                "overflow-hidden p-0 text-left tabular-nums",
                ROW_LINE,
                col.emphasize && "bg-primary/[0.045] font-medium"
              )}
            >
              <Fold open={open} className={foldPad}>
                {unknown ? (
                  <UnknownCell />
                ) : (
                  <ValueCell
                    row={c}
                    col={col}
                    cur={currency}
                    estimated={c.buyoutEstimated && FORECAST_KEYS.has(col.key)}
                    compact={isMobile}
                  />
                )}
              </Fold>
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  // ---- a product "shelf": its totals in one row, opening on its campaigns ----
  // The whole row is the switch - a click anywhere on it opens or shuts it. It
  // is dressed like a tab in a list: an icon, a name and the count beside it,
  // plain until it is the open one. The two shelves heading the list wear the
  // same frame, minus the #ID chip.
  function renderGroupRow(e: Shelf) {
    const isExp = expanded.has(e.id)
    const isProduct = e.kind === "product"
    const childIdx = e.rows.map((r) => r._i)
    const allChildSel = childIdx.every((i) => sel.has(i))
    const someChildSel = childIdx.some((i) => sel.has(i))
    const count =
      e.rows.length + " " + plural(e.rows.length, ...ENTITY_FORMS[entity])
    const frozen = isExp ? OPEN_FROZEN : FROZEN_BASE

    const ShelfIcon =
      e.kind === "all"
        ? IconStack2
        : e.kind === "none"
          ? IconTagOff
          : IconPackage

    // The shelf's own line: chevron, icon, #ID, name and count. The click is the
    // row's - the button is what a keyboard lands on.
    const title = (
      <button
        type="button"
        aria-expanded={isExp}
        title={isExp ? "Згорнути" : "Розгорнути"}
        className="flex w-full min-w-0 items-center gap-2 text-left"
      >
        <IconChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExp && "rotate-90"
          )}
        />
        {/* the icon and the #ID chip are the first things to go when the
            column shrinks to phone width. The no-product shelf keeps the amber
            of the sync strip - it is where the unsynced orders come from. */}
        {!isMobile && (
          <ShelfIcon
            className={cn(
              "size-4 shrink-0 transition-colors",
              e.kind === "none"
                ? "text-amber-600 dark:text-amber-400"
                : isExp
                  ? "text-primary"
                  : "text-muted-foreground"
            )}
          />
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            {!isMobile && isProduct && (
              <Badge
                variant="secondary"
                className="shrink-0 gap-1 font-mono text-[10px] tracking-tight"
              >
                <IconTag className="size-3" />
                {e.id}
              </Badge>
            )}
            <span
              className={cn(
                "min-w-0 truncate font-semibold transition-colors",
                isExp && "text-primary"
              )}
              title={e.label}
            >
              {e.label}
            </span>
            {/* the count a tab wears beside its name */}
            {twoCols && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors",
                  isExp
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
                title={count}
              >
                {e.rows.length}
              </span>
            )}
          </span>
          {/* with one name column there is no room for the chip and the count
              beside the name, so the subline carries one of them */}
          {!twoCols && (
            <span className="truncate text-[11px] text-muted-foreground">
              {isProduct ? "ID " + e.id : count}
            </span>
          )}
        </span>
      </button>
    )

    // the bar an active tab carries, down the row's leading edge
    const mark = (
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 bg-primary transition-opacity duration-200",
          isExp ? "opacity-100" : "opacity-0"
        )}
      />
    )

    return (
      <TableRow
        onClick={() => toggleExpand(e.id)}
        className={cn(
          "group/row cursor-pointer border-0",
          isExp ? OPEN_BG : ROW_HOVER
        )}
      >
        {showSelectCol && (
          <TableCell
            className={cn(
              "sticky left-0 z-20 border-b px-0 text-center",
              frozen
            )}
            style={{ width: W_SELECT, minWidth: W_SELECT }}
            // picking the rows under a shelf is not opening it
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex justify-center">
              <Checkbox
                checked={allChildSel}
                indeterminate={someChildSel && !allChildSel}
                onCheckedChange={() => setGroupSel(childIdx, !allChildSel)}
                aria-label={
                  isProduct
                    ? "Обрати всі кампанії товару " + e.label
                    : "Обрати " + e.label.toLowerCase()
                }
              />
            </div>
          </TableCell>
        )}
        {/* Товар - the shelf itself */}
        {twoCols && (
          <TableCell
            className={cn(
              "sticky z-20 overflow-hidden border-b",
              rowYPad,
              nameXPad,
              PRODUCT_EDGE,
              frozen
            )}
            style={{
              width: productW,
              minWidth: productW,
              maxWidth: productW,
              left: productLeft,
            }}
          >
            {mark}
            {title}
          </TableCell>
        )}
        {showToggleCol && (
          <TableCell
            className={cn("sticky z-20 border-b px-0 text-center", frozen)}
            style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: toggleLeft }}
          >
            {/* on a phone this is the row's leading cell */}
            {!twoCols && mark}
            <span
              className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums"
              title={e.activeCount + " з " + e.rows.length + " активні"}
            >
              {e.activeCount}/{e.rows.length}
            </span>
          </TableCell>
        )}
        {/* Кампанія - a shelf is not one, so the cell stays blank. With one
            name column this is where the shelf itself goes. */}
        <TableCell
          className={cn(
            "sticky z-20 overflow-hidden border-b",
            rowYPad,
            nameXPad,
            FROZEN_EDGE,
            frozen
          )}
          style={{
            width: nameW,
            minWidth: nameW,
            maxWidth: nameW,
            left: nameLeft,
          }}
        >
          {!twoCols && title}
        </TableCell>
        {cols.map((col) => (
          <TableCell
            key={col.key}
            className={cn(
              "overflow-hidden border-b text-left font-semibold tabular-nums",
              cellPad,
              col.emphasize && "bg-primary/[0.045]"
            )}
          >
            <ValueCell
              row={e.agg}
              col={col}
              cur={currency}
              // one campaign on the base % is enough to make the shelf total
              // a forecast too
              estimated={
                e.rows.some((r) => r.buyoutEstimated) &&
                FORECAST_KEYS.has(col.key)
              }
              compact={isMobile}
            />
          </TableCell>
        ))}
      </TableRow>
    )
  }

  // full-page skeleton on the very first load
  if (firstLoad) return <CampaignsSkeleton cols={cols.length} />

  return (
    <div className="flex h-[calc(100svh-58px)] w-full min-w-0 flex-col gap-2.5 overflow-hidden p-2.5 sm:gap-4 sm:p-4 md:p-6">
      {/* without a plan the sync health of orders is moot - the strip's slot
          carries the "no active plan" notice instead */}
      {noPlan ? (
        <NoPlanStrip onPick={() => setPricingOpen(true)} />
      ) : (
        /* flat order-sync health strip - stands in for the page title. Narrow
          screens drop the bar and the link's label and make the whole strip the
          tap target, so it always stays a single line. */
        <button
          type="button"
          className="flex w-full shrink-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-left text-xs shadow-xs sm:gap-3 sm:px-3.5 sm:py-2.5 sm:text-[13px]"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-amber-500/12 text-amber-600 dark:text-amber-400">
            <IconPlugConnectedX className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate sm:flex-none">
            <b className="font-semibold tabular-nums">{unsyncedPct}%</b>{" "}
            замовлень не синхронізовано
            <span className="hidden sm:inline"> з кампаніями</span>
          </span>
          <span
            className="hidden h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:block"
            title={unsyncedPct + "% не синхронізовано"}
          >
            <span
              className="block h-full rounded-full bg-amber-500"
              style={{ width: unsyncedPct + "%" }}
            />
          </span>
          <span className="ml-auto hidden shrink-0 items-center gap-1 font-medium text-primary hover:underline sm:inline-flex">
            Дізнатися чому
            <IconArrowUpRight className="size-3.5" />
          </span>
          <IconArrowUpRight
            className="size-4 shrink-0 text-primary sm:hidden"
            aria-label="Дізнатися чому"
          />
        </button>
      )}

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        {/* phone toolbar: search + one "Фільтри" button, with the applied
            filters spelled out underneath (see the sheet at the bottom) */}
        {isMobile && (
          <div className="flex items-center gap-2 border-b p-2.5">
            <div className="relative min-w-0 flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-8.5 text-[13px]"
                placeholder="Пошук за назвою"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              variant={activeFilterCount > 0 ? "secondary" : "outline"}
              size="sm"
              className="h-9 shrink-0"
              onClick={() => setFiltersOpen(true)}
            >
              <IconFilter className="size-4" />
              Фільтри
              {activeFilterCount > 0 && (
                <span className="grid size-4.5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Реклама - one picker over the whole source hierarchy; desktop only,
            on a phone it lives in the filter sheet */}
        {!isMobile && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b p-3.5">
            <AdsPicker
              label="Реклама"
              variant="outline"
              className="h-8 w-64"
              value={adDraft.draft.accounts}
              onChange={(accounts) =>
                adDraft.setDraft({ ...adDraft.draft, accounts })
              }
              onApply={() => {
                if (adDraft.dirty) adDraft.apply()
              }}
            />
            {/* Dead until the draft says something the table is not already
                built from - there is nothing to apply until then. */}
            <Button size="sm" disabled={!adDraft.dirty} onClick={adDraft.apply}>
              Застосувати
            </Button>
            {adDraftCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={adDraft.clear}
              >
                <IconX />
                Скинути
              </Button>
            )}

            <div className="ml-auto" />
            <RefreshControl />
          </div>
        )}

        {/* entity subtabs + date range (same row, date on the right) */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b",
            isMobile ? "px-2.5" : "px-3.5 pt-2.5"
          )}
        >
          {/* the tabs scroll sideways on a phone instead of wrapping -
              overflow-y stays clipped so the row can't scroll vertically */}
          <div
            className={cn(
              "flex items-center gap-1",
              isMobile &&
                "-mx-2.5 min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto overflow-y-hidden px-2.5 [&::-webkit-scrollbar]:hidden"
            )}
          >
            {ENTITY_TABS.map(([t, EntIcon]) => {
              const active = entity === t
              return (
                <button
                  key={t}
                  onClick={() => switchEntity(t)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-t-md border-b-2 font-semibold transition-colors",
                    isMobile
                      ? "gap-1.5 px-2 py-2.5 text-xs"
                      : "-mb-px px-3.5 py-2.5 text-[13px]",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <EntIcon className={isMobile ? "size-3.5" : "size-4"} />
                  {isMobile ? ENTITY_SHORT[t] : t}
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
          {!isMobile && (
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="mb-2"
            />
          )}
        </div>

        {/* phone: what the filters currently add up to - tapping any of it
            reopens the sheet on that setting */}
        {isMobile && (
          <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-left"
            >
              {[
                rangeLabel(dateRange, startOfDay(new Date())),
                adCount > 0 ? "Реклама: " + adsSummary(ads.accounts) : null,
              ]
                .filter(Boolean)
                .map((label, i) => (
                  <span
                    key={i}
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                ))}
            </button>
            <RefreshControl compact />
          </div>
        )}

        {/* drill-down filter bar */}
        {(drill.campaigns.length > 0 || drill.groups.length > 0) && (
          <div
            className={cn(
              "flex items-center border-b bg-primary/5",
              isMobile
                ? "gap-1.5 px-2.5 py-1.5"
                : "flex-wrap gap-2 px-3.5 py-2.5"
            )}
          >
            <span className="shrink-0 text-xs font-bold text-muted-foreground">
              {isMobile ? "Фільтр:" : "Фільтр за вибором:"}
            </span>
            {/* on a phone the chips scroll sideways so the bar stays one row -
                the label and the reset button are the fixed anchors */}
            <div
              className={cn(
                "flex items-center gap-1.5",
                isMobile ? "min-w-0 flex-1 overflow-x-auto" : "flex-wrap gap-2"
              )}
            >
              {drill.campaigns.length > 0 && (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 bg-card py-1 pr-1"
                >
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
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 bg-card py-1 pr-1"
                >
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
              {!isMobile && (
                <span className="text-xs text-muted-foreground">
                  · знайдено {rows.length} {ENTITY_NOUN[entity]}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={clearDrill}
            >
              <IconX />
              {isMobile ? "Скинути" : "Скинути все"}
            </Button>
          </div>
        )}

        {/* action toolbar - desktop only; the phone equivalent is the search +
            "Фільтри" row above */}
        {!isMobile && (
          <div className="flex flex-wrap items-center gap-2.5 border-b p-3.5">
            {/* expand / collapse all product shelves */}
            {groupIds.length > 0 && (
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

            {/* search - fills the space between the left actions and the columns menu */}
            <div className="relative ml-auto min-w-40 flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8.5"
                placeholder="Пошук за назвою"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* automated rules for this level - for the picked rows when there
                are any */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    <IconBolt />
                    Правила
                    <IconChevronDown className="text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onClick={createRule}>
                  <IconPlus />
                  {ruleTargets.length > 0
                    ? `Правило для обраних (${ruleTargets.length})`
                    : "Створити правило"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/rules")}>
                  <IconBolt />
                  Усі правила
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {rules.length}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
        )}

        {/* table - the only element that scrolls; header row, totals row and the
            left "identity" columns stay frozen just like in Ads Manager */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              noPlan &&
                "pointer-events-none opacity-80 blur-[3px] saturate-75 select-none"
            )}
          >
            <Table
              className={cn(
                "w-auto table-fixed border-separate border-spacing-0 text-[13px]",
                // phone density: one step down in type size and a shorter header;
                // the cell padding comes from cellPad / nameXPad / rowYPad below
                isMobile && "text-[11px] [&_th]:h-9"
              )}
              containerClassName="table-scroll min-h-0 flex-1 overflow-auto overscroll-none"
            >
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {showSelectCol && (
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
                  )}
                  {/* Товар and Кампанія sort as one: by name, the shelves
                        by theirs and the rows under them by their own */}
                  {twoCols && (
                    <TableHead
                      className={cn(
                        "sticky top-0 z-40 cursor-pointer overflow-hidden border-b",
                        nameXPad,
                        PRODUCT_EDGE,
                        HEADER_BG
                      )}
                      style={{
                        width: productW,
                        minWidth: productW,
                        left: productLeft,
                      }}
                      onClick={() => toggleSort("name")}
                    >
                      <span className="flex items-center gap-1 pr-2 select-none">
                        <span className="truncate">Товар</span>
                        <SortIndicator
                          state={sort.key === "name" ? sort.dir : null}
                        />
                      </span>
                      <ResizeHandle
                        onStart={(e) => startResize("product", e)}
                      />
                    </TableHead>
                  )}
                  {showToggleCol && (
                    <TableHead
                      className={cn(
                        "sticky top-0 z-40 cursor-pointer border-b px-0 text-center",
                        HEADER_BG
                      )}
                      style={{
                        width: W_TOGGLE,
                        minWidth: W_TOGGLE,
                        left: toggleLeft,
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
                      "sticky top-0 z-40 cursor-pointer overflow-hidden border-b",
                      nameXPad,
                      FROZEN_EDGE,
                      HEADER_BG
                    )}
                    style={{
                      width: nameW,
                      minWidth: nameW,
                      left: nameLeft,
                    }}
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1 pr-2 select-none">
                      <span className="truncate">
                        {twoCols ? "Кампанія" : "Товар / Кампанія"}
                      </span>
                      <SortIndicator
                        state={sort.key === "name" ? sort.dir : null}
                      />
                    </span>
                    {!isMobile && (
                      <ResizeHandle onStart={(e) => startResize("name", e)} />
                    )}
                  </TableHead>
                  {cols.map((c) => (
                    <TableHead
                      key={c.key}
                      className={cn(
                        "sticky top-0 z-20 cursor-pointer overflow-hidden border-b text-left",
                        cellPad,
                        c.emphasize ? HEADER_EMPH : HEADER_BG
                      )}
                      style={{
                        width: colW(c),
                        minWidth: colW(c),
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
                      {!isMobile && (
                        <ResizeHandle onStart={(e) => startResize(c.key, e)} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {shelves.map((s, i) => (
                  <Fragment key={s.id}>
                    {/* a strip of air before the first product: what stands
                        above it is not one, and should not read as one */}
                    {s.kind === "product" &&
                      shelves[i - 1]?.kind !== "product" && (
                        <TableRow
                          aria-hidden
                          className="border-0 hover:bg-transparent"
                        >
                          <TableCell
                            colSpan={colSpan}
                            className={cn("h-2.5 border-b p-0", HEADER_BG)}
                          />
                        </TableRow>
                      )}
                    {renderGroupRow(s)}
                    {s.rows.map((r, ri) =>
                      renderRow(r, expanded.has(s.id), ri === s.rows.length - 1)
                    )}
                  </Fragment>
                ))}
                {rows.length === 0 && (
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

              {/* nothing to total in an empty table */}
              {rows.length > 0 && (
                <TableFooter className="border-0 bg-transparent">
                  <TableRow className="hover:bg-transparent">
                    {showSelectCol && (
                      <TableCell
                        className={cn(
                          "sticky bottom-0 left-0 z-30 border-t",
                          FOOTER_BG
                        )}
                        style={{ width: W_SELECT, minWidth: W_SELECT }}
                      />
                    )}
                    {/* the label sits in the first name column, whichever that is */}
                    {twoCols && (
                      <TableCell
                        className={cn(
                          "sticky bottom-0 z-30 overflow-hidden border-t font-bold",
                          nameXPad,
                          PRODUCT_EDGE,
                          FOOTER_BG
                        )}
                        style={{
                          width: productW,
                          minWidth: productW,
                          left: productLeft,
                        }}
                      >
                        <span className="truncate">{totalLabel}</span>
                      </TableCell>
                    )}
                    {showToggleCol && (
                      <TableCell
                        className={cn(
                          "sticky bottom-0 z-30 border-t",
                          FOOTER_BG
                        )}
                        style={{
                          width: W_TOGGLE,
                          minWidth: W_TOGGLE,
                          left: toggleLeft,
                        }}
                      />
                    )}
                    <TableCell
                      className={cn(
                        "sticky bottom-0 z-30 overflow-hidden border-t font-bold",
                        nameXPad,
                        FROZEN_EDGE,
                        FOOTER_BG
                      )}
                      style={{
                        width: nameW,
                        minWidth: nameW,
                        left: nameLeft,
                      }}
                    >
                      {!twoCols && (
                        <span className="truncate">{totalLabel}</span>
                      )}
                    </TableCell>
                    {cols.map((col) => {
                      const est = footEstimated && FORECAST_KEYS.has(col.key)
                      const value = (
                        <>
                          {est && <span className="mr-px opacity-55">~</span>}
                          {fmt(foot[col.key], col.unit, currency)}
                        </>
                      )
                      const cell = RATE_KEYS.includes(col.key) ? (
                        <span className="font-medium text-muted-foreground">
                          сер. {value}
                        </span>
                      ) : (
                        <span className="font-bold">{value}</span>
                      )
                      return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            "sticky bottom-0 z-10 overflow-hidden border-t text-left tabular-nums",
                            cellPad,
                            col.emphasize ? HEADER_EMPH : FOOTER_BG
                          )}
                        >
                          {est ? (
                            <ForecastTooltip>
                              <span className="underline decoration-dotted decoration-1 underline-offset-4">
                                {cell}
                              </span>
                            </ForecastTooltip>
                          ) : (
                            cell
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
          {noPlan && <NoPlanOverlay onPick={() => setPricingOpen(true)} />}
        </div>
      </Card>

      {/* every filter the desktop toolbars carry, in one bottom sheet */}
      {isMobile && (
        <CampaignFiltersSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          dateRange={dateRange}
          onDateRange={setDateRange}
          ads={ads}
          onAds={commitAds}
          visible={visible}
          onToggleColumn={(key) =>
            setVisible((v) => ({ ...v, [key]: !v[key] }))
          }
          onColumnPreset={applyColumnPreset}
          onReset={resetFilters}
        />
      )}

      {/* attach / change / detach the product of a single campaign */}
      <ProductPickerDialog
        open={pickerOpen}
        target={pickerTarget}
        onOpenChange={setPickerOpen}
        onSave={saveProductLink}
      />

      <RuleDialog
        open={ruleOpen}
        onOpenChange={setRuleOpen}
        seed={ruleSeed}
        onSave={saveRule}
      />

      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </div>
  )
}

// full-page skeleton for the first load - mirrors the toolbar + table layout
function CampaignsSkeleton({ cols }: { cols: number }) {
  const isMobile = useIsMobile()
  const metricCols = Math.min(cols, isMobile ? 2 : 7)
  return (
    <div className="flex h-[calc(100svh-58px)] w-full min-w-0 flex-col gap-2.5 overflow-hidden p-2.5 sm:gap-4 sm:p-4 md:p-6">
      {/* sync strip - stands in for the page title */}
      <div className="flex shrink-0 items-center gap-3 rounded-xl bg-card px-3 py-2 shadow-xs sm:px-3.5 sm:py-2.5">
        <Skeleton className="size-6 shrink-0 rounded-md" />
        <Skeleton className="h-4 w-60 max-w-[45%]" />
        <Skeleton className="ml-auto h-4 w-28" />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        {isMobile ? (
          <>
            {/* search + "Фільтри" */}
            <div className="flex items-center gap-2 border-b p-2.5">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-24 shrink-0" />
            </div>
            {/* entity tabs */}
            <div className="flex items-center gap-3 border-b px-2.5 py-2.5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-5 w-20 shrink-0" />
              ))}
            </div>
            {/* applied-filter chips - just the period by default */}
            <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
              <Skeleton className="h-4 w-24 shrink-0 rounded-full" />
            </div>
          </>
        ) : (
          <>
            {/* data-source bar - the Реклама picker and its Застосувати */}
            <div className="flex flex-wrap items-center gap-2 border-b p-3.5">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-28" />
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
              <Skeleton className="h-8 w-36" />
              <Skeleton className="ml-auto h-8 flex-1" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="size-8" />
            </div>
          </>
        )}
        {/* table */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-2.5 sm:p-3.5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-5 w-8 shrink-0 rounded-full" />
              <Skeleton className="size-6 shrink-0 rounded-md" />
              <Skeleton
                className="h-4 shrink-0"
                style={{
                  width: isMobile
                    ? 70 + ((i * 41) % 50)
                    : 130 + ((i * 41) % 110),
                }}
              />
              <div className="ml-auto flex items-center gap-3 sm:gap-5">
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
// Phone widths: the same shape, scaled to the 11px type - about 2.5 metric
// columns fit next to the frozen name column on a 390px screen.
function mobileColWidth(label: string) {
  return Math.round(Math.min(116, Math.max(76, label.length * 5.5 + 22)))
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

// The rows under a shelf open and shut by height, and a table row can't be
// animated itself. So each of its cells keeps its padding inside this wrapper,
// which folds to nothing: once all of them are folded the row has no height
// left. The padding sits one level in - on the clipped box itself it would
// hold the row open.
function Fold({
  open,
  className,
  children,
}: {
  open: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div
        className={cn(
          "min-h-0 overflow-hidden transition-opacity duration-200 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0"
        )}
      >
        <div className={className}>{children}</div>
      </div>
    </div>
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
