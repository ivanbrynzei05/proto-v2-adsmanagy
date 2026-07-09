import { useEffect, useMemo, useRef, useState } from "react"
import {
  IconAdjustmentsHorizontal,
  IconArrowsSort,
  IconArrowsSplit2,
  IconBox,
  IconBriefcase,
  IconCalendar,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconClock,
  IconColumns,
  IconDownload,
  IconLayoutGrid,
  IconRefresh,
  IconSearch,
  IconSpeakerphone,
  IconStack2,
  IconWorld,
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react"

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
import { Separator } from "@/components/ui/separator"
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
import { cn } from "@/lib/utils"
import {
  AD_ACCOUNTS,
  AD_GROUPS,
  ADS,
  CAMPAIGNS,
  COL_GROUPS,
  COLUMNS,
  DATE_PRESETS,
  fmt,
  PLATFORMS,
  PORTFOLIOS,
  PRESETS,
  totals,
  type Column,
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
        <path fill="#4285F4" d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.394 3.622v3.011h3.878c2.269-2.09 3.578-5.165 3.578-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.956-1.075 7.942-2.907l-3.878-3.01c-1.075.72-2.45 1.145-4.064 1.145-3.125 0-5.77-2.11-6.714-4.948H1.276v3.11A11.997 11.997 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.286 14.28A7.213 7.213 0 0 1 4.91 12c0-.79.137-1.558.376-2.28V6.61H1.276A11.997 11.997 0 0 0 0 12c0 1.937.464 3.769 1.276 5.39l4.01-3.11z" />
        <path fill="#EA4335" d="M12 4.773c1.762 0 3.343.605 4.587 1.794l3.44-3.44C17.952 1.19 15.235 0 12 0A11.997 11.997 0 0 0 1.276 6.61l4.01 3.11C6.23 6.882 8.875 4.773 12 4.773z" />
      </svg>
    ),
    tiktok: (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path className="fill-foreground" d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
        <path fill="#25F4EE" d="M5.633 16.42a2.895 2.895 0 0 1 3.183-4.51V8.39a6.33 6.33 0 0 0-5.394 10.692 6.33 6.33 0 0 1 2.211-2.662z" />
        <path fill="#FE2C55" d="M20.592 6.79V6.686a4.793 4.793 0 0 1-2.767-.869 4.793 4.793 0 0 0 2.767.973z" />
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
function ValueCell({ row, col }: { row: Row; col: Column }) {
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
          "tabular-nums border-transparent",
          v >= 0
            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {fmt(v, col.unit)}
      </Badge>
    )
  }

  if (col.key === "approveRate" || col.key === "buyoutRate") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-11 tabular-nums">{fmt(v, col.unit)}</span>
        <span className="h-1.5 w-11 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: Math.min(100, v) + "%" }}
          />
        </span>
      </span>
    )
  }

  return <span className="tabular-nums">{fmt(v, col.unit)}</span>
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
const STATUS_LABELS: Record<string, string> = { all: "Усі", on: "Активні", off: "Вимкнені" }
const BREAKDOWNS = ["Без розбивки", "По кабінетах", "По днях", "По колцентрах", "По баєрах"]

// Values each breakdown splits a row into (Ads-Manager style). The first entry
// ("Без розбивки") means "no breakdown" and is handled specially.
const BREAKDOWN_VALUES: Record<string, string[]> = {
  "По кабінетах": ["Кабінет №1", "Кабінет №2", "Кабінет №3"],
  "По днях": ["02.07", "03.07", "04.07", "05.07", "06.07", "07.07", "08.07"],
  "По колцентрах": ["Колцентр «Альфа»", "Колцентр «Бета»"],
  "По баєрах": ["Баєр Олег", "Баєр Ірина", "Баєр Максим"],
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
          cooling ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
        )}
      >
        <IconClock className="size-3.5 shrink-0" />
        {cooling ? `Наступна спроба через ${remaining}с` : relativeTime(lastUpdated, now)}
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
type Indexed = Row & { _i: number; _breakdown?: string }

export function CampaignsPage() {
  const allCols = COLUMNS
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allCols.map((c) => [c.key, true]))
  )
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({
    key: "spend",
    dir: "desc",
  })
  // resizable column widths (name + every metric), remembered in localStorage
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = { name: 340 }
    for (const c of COLUMNS) defaults[c.key] = defaultColWidth(c.label)
    try {
      const saved = localStorage.getItem(COL_WIDTHS_KEY)
      if (saved) return { ...defaults, ...(JSON.parse(saved) as Record<string, number>) }
    } catch {
      /* ignore */
    }
    return defaults
  })
  const resizeRef = useRef<{ key: string; startX: number; startW: number } | null>(null)
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
    resizeRef.current = { key, startX: e.clientX, startW: colWidths[key] ?? 120 }
    const move = (ev: MouseEvent) => {
      const r = resizeRef.current
      if (!r) return
      const w = Math.max(72, Math.min(560, r.startW + (ev.clientX - r.startX)))
      setColWidths((prev) => (prev[r.key] === w ? prev : { ...prev, [r.key]: w }))
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
  const [statusFilter, setStatusFilter] = useState<"all" | "on" | "off">("all")
  const [sel, setSel] = useState<Set<number>>(() => new Set())
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({})
  const [entity, setEntity] = useState("Кампанії")
  // data-source hierarchy: platform → ad account → business account
  const [platforms, setPlatforms] = useState<Set<PlatformId>>(
    () => new Set(PLATFORMS.map((p) => p.id))
  )
  const [adAccounts, setAdAccounts] = useState<Set<string>>(
    () => new Set(AD_ACCOUNTS.map((a) => a.id))
  )
  const [businesses, setBusinesses] = useState<Set<string>>(
    () => new Set(PORTFOLIOS.map((p) => p.id))
  )
  const showToggleCol = true
  const [drill, setDrill] = useState<{ campaigns: string[]; groups: string[] }>({
    campaigns: [],
    groups: [],
  })
  const [dateLabel, setDateLabel] = useState(DATE_PRESETS[2])
  const [breakdown, setBreakdown] = useState(BREAKDOWNS[0])

  const cols = allCols.filter((c) => visible[c.key])
  const isLeaf = entity === "Оголошення"

  // level 2 — ad accounts on the currently chosen platform(s)
  const scopedAccounts = useMemo(
    () => AD_ACCOUNTS.filter((a) => platforms.has(a.platform)),
    [platforms]
  )
  // level 3 — business accounts reachable through the chosen platform(s) + account(s)
  const scopedBusinesses = useMemo(() => {
    const ids = new Set(
      scopedAccounts.filter((a) => adAccounts.has(a.id)).map((a) => a.business)
    )
    return PORTFOLIOS.filter((b) => ids.has(b.id))
  }, [scopedAccounts, adAccounts])

  function drillOk(e: string, c: Row) {
    if (e === "Групи оголошень")
      return drill.campaigns.length === 0 || drill.campaigns.includes(c.campaign ?? "")
    if (e === "Оголошення")
      return (
        (drill.campaigns.length === 0 || drill.campaigns.includes(c.campaign ?? "")) &&
        (drill.groups.length === 0 || drill.groups.includes(c.group ?? ""))
      )
    return true
  }
  function baseFilter(e: string, c: Row) {
    return (
      platforms.has(c.platform) &&
      adAccounts.has(c.adAccount) &&
      businesses.has(c.portfolio) &&
      drillOk(e, c)
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
  }
  const ALL_ACCOUNTS = () => new Set(AD_ACCOUNTS.map((a) => a.id))
  const ALL_BUSINESSES = () => new Set(PORTFOLIOS.map((p) => p.id))
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
    setBusinesses(ALL_BUSINESSES())
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
    setBusinesses(ALL_BUSINESSES())
    setSel(new Set())
    setDrill({ campaigns: [], groups: [] })
  }
  function toggleBusiness(id: string) {
    setBusinesses((s) => {
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

  const counts = useMemo(
    () => ({
      Кампанії: CAMPAIGNS.filter((c) => baseFilter("Кампанії", c)).length,
      "Групи оголошень": AD_GROUPS.filter((c) => baseFilter("Групи оголошень", c)).length,
      Оголошення: ADS.filter((c) => baseFilter("Оголошення", c)).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platforms, adAccounts, businesses, drill]
  )

  // data-source + search + status filters (shared by the table and the counters)
  function passesFilters(e: string, c: Row) {
    if (!baseFilter(e, c)) return false
    if (query.trim() && !c.name.toLowerCase().includes(query.toLowerCase())) return false
    if (statusFilter === "on" && !c.active) return false
    if (statusFilter === "off" && c.active) return false
    return true
  }

  const rows = useMemo<Indexed[]>(() => {
    let r: Indexed[] = (DATASETS[entity] || CAMPAIGNS).map((c, i) => ({
      ...c,
      _i: i,
      active: entity + ":" + i in activeMap ? activeMap[entity + ":" + i] : c.active,
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
          const sub: Indexed = { ...row, _i: row._i * 100 + vi, _breakdown: val }
          for (const k of ADDITIVE_KEYS) sub[k] = Math.round((row[k] as number) * w[vi])
          return sub
        })
      })
    }
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, platforms, adAccounts, businesses, drill, query, statusFilter, sort, activeMap, breakdown])

  const foot = useMemo(() => totals(rows), [rows])

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
    () => Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, (typeof PLATFORMS)[number]>,
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
      ? "Усі кабінети"
      : selAccounts.length === 1
        ? selAccounts[0].name
        : selAccounts.length + " кабінети"
  // level 3 — business account (scoped to the chosen platform(s) + account(s))
  const selBusinesses = scopedBusinesses.filter((b) => businesses.has(b.id))
  const bizLabel =
    selBusinesses.length === scopedBusinesses.length
      ? "Усі бізнес-акаунти"
      : selBusinesses.length === 1
        ? selBusinesses[0].name
        : selBusinesses.length + " бізнес-акаунти"

  const colSpan = cols.length + 2 + (showToggleCol ? 1 : 0)

  // Fixed frozen-column widths (px). Keeping them explicit means the sticky `left`
  // offsets can never drift out of sync with the rendered columns, so the frozen
  // block and the scrolling block always line up seamlessly.
  const W_SELECT = 44
  const W_TOGGLE = 52
  const nameLeft = W_SELECT + (showToggleCol ? W_TOGGLE : 0)
  const frozenBg = (selected: boolean) => (selected ? FROZEN_SEL : FROZEN_BASE)

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-bold tracking-tight">Кампанії</h1>

      <Card className="gap-0 overflow-hidden py-0">
        {/* data-source hierarchy: platform › ad account › business account */}
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
              <DropdownMenuLabel className="uppercase tracking-wide">Платформа</DropdownMenuLabel>
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
                  setBusinesses(ALL_BUSINESSES())
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
              <DropdownMenuLabel className="uppercase tracking-wide">
                Рекламний кабінет
              </DropdownMenuLabel>
              {scopedAccounts.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Немає кабінетів для цих платформ
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
                      setBusinesses(ALL_BUSINESSES())
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

          <IconChevronRight className="size-4 shrink-0 text-muted-foreground/50" />

          {/* level 3 — business account (scoped to the chosen platform(s) + account(s)) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <IconBriefcase className="size-4 text-muted-foreground" />
                  {bizLabel}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="uppercase tracking-wide">
                Бізнес-акаунт
              </DropdownMenuLabel>
              {scopedBusinesses.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Немає бізнес-акаунтів для цих кабінетів
                </div>
              ) : (
                scopedBusinesses.map((b) => (
                  <DropdownMenuCheckboxItem
                    key={b.id}
                    checked={businesses.has(b.id)}
                    onCheckedChange={() => toggleBusiness(b.id)}
                    closeOnClick={false}
                  >
                    <span className="flex items-center gap-2">
                      <IconBriefcase className="size-4 text-muted-foreground" />
                      {b.name}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {scopedBusinesses.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={() => {
                      setBusinesses(ALL_BUSINESSES())
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
          <RefreshControl />
          <Button variant="ghost" size="icon" aria-label="Налаштування таблиці">
            <IconAdjustmentsHorizontal />
          </Button>
        </div>

        {/* search */}
        <div className="border-b p-3.5">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8.5"
              placeholder="Пошук за назвою"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
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
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {counts[t as keyof typeof counts]}
                  </span>
                </button>
              )
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="secondary" size="sm" className="mb-2 gap-1.5">
                  <IconCalendar className="size-4 text-muted-foreground" />
                  {dateLabel}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={dateLabel} onValueChange={setDateLabel}>
                {DATE_PRESETS.map((p) => (
                  <DropdownMenuRadioItem key={p} value={p} closeOnClick>
                    {p}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* drill-down filter bar */}
        {(drill.campaigns.length > 0 || drill.groups.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-3.5 py-2.5">
            <span className="text-xs font-bold text-muted-foreground">Фільтр за вибором:</span>
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
                  onClick={() => setDrill((d) => ({ campaigns: d.campaigns, groups: [] }))}
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
            <Button variant="ghost" size="sm" className="ml-1" onClick={clearDrill}>
              <IconX />
              Скинути все
            </Button>
          </div>
        )}

        {/* action toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b p-3.5">
          {selCount > 0 ? (
            <>
              <span className="text-[13px] font-bold text-primary">Обрано: {selCount}</span>
              <Separator orientation="vertical" className="h-6!" />
              {entity === "Кампанії" && (
                <Button variant="outline" size="sm" onClick={() => drillInto("Групи оголошень")}>
                  <IconLayoutGrid />
                  Групи оголошень для {selCount}
                </Button>
              )}
              {entity === "Групи оголошень" && (
                <Button variant="outline" size="sm" onClick={() => drillInto("Оголошення")}>
                  <IconBox />
                  Оголошення для {selCount}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSel(new Set())}>
                <IconX />
                Зняти
              </Button>
            </>
          ) : (
            <div className="inline-flex h-8 items-center gap-0.5 rounded-md border bg-muted/40 p-0.5 text-xs">
              {(["all", "on", "off"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-[7px] px-3 py-1 font-medium transition-colors",
                    statusFilter === s
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto" />

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
              <DropdownMenuLabel className="uppercase tracking-wide">Набори</DropdownMenuLabel>
              {Object.keys(PRESETS).map((p) => (
                <DropdownMenuItem
                  key={p}
                  closeOnClick={false}
                  onClick={() => {
                    const groups = PRESETS[p]
                    setVisible(
                      Object.fromEntries(
                        allCols.map((c) => [c.key, groups ? groups.includes(c.group) : true])
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
                  <DropdownMenuLabel className="uppercase tracking-wide">
                    {g.label}
                  </DropdownMenuLabel>
                  {allCols
                    .filter((c) => c.group === g.id)
                    .map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.key}
                        checked={!!visible[c.key]}
                        onCheckedChange={() => setVisible((v) => ({ ...v, [c.key]: !v[c.key] }))}
                        closeOnClick={false}
                      >
                        {c.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* breakdown dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <IconArrowsSplit2 />
                  Розбивка
                  <IconChevronDown className="text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={breakdown} onValueChange={switchBreakdown}>
                {BREAKDOWNS.map((b) => (
                  <DropdownMenuRadioItem key={b} value={b} closeOnClick>
                    {b}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon-sm" aria-label="Експорт">
            <IconDownload />
          </Button>
        </div>

        {/* table — the only element that scrolls; header row, totals row and the
            left "identity" columns stay frozen just like in Ads Manager */}
        <Table
          className="w-auto table-fixed border-separate border-spacing-0 text-[13px]"
          containerClassName="table-scroll max-h-[calc(100svh-25rem)] overflow-auto overscroll-none"
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
                    "sticky top-0 z-40 cursor-pointer border-b px-0 text-center text-[11px] font-medium tracking-wide text-muted-foreground",
                    HEADER_BG
                  )}
                  style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
                  onClick={() => toggleSort("active")}
                >
                  <span className="inline-flex items-center gap-0.5 select-none">
                    ВКЛ
                    <SortIndicator state={sort.key === "active" ? sort.dir : null} />
                  </span>
                </TableHead>
              )}
              <TableHead
                className={cn(
                  "sticky top-0 z-40 cursor-pointer overflow-hidden border-b pl-3",
                  FROZEN_EDGE,
                  HEADER_BG
                )}
                style={{ width: colWidths.name, minWidth: colWidths.name, left: nameLeft }}
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1 pr-2 select-none">
                  <span className="truncate">Кампанія / товар</span>
                  <SortIndicator state={sort.key === "name" ? sort.dir : null} />
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
                  style={{ width: colWidths[c.key], minWidth: colWidths[c.key] }}
                  title={c.hint}
                  onClick={() => toggleSort(c.key)}
                >
                  <span className="flex items-center gap-1 pr-2 select-none">
                    <span className="truncate">{c.label}</span>
                    <SortIndicator state={sort.key === c.key ? sort.dir : null} />
                  </span>
                  <ResizeHandle onStart={(e) => startResize(c.key, e)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((c) => {
              const selected = sel.has(c._i)
              return (
                <TableRow
                  key={c._i}
                  className={cn("group/row border-0", selected ? ROW_SEL : ROW_HOVER)}
                >
                  <TableCell
                    className={cn(
                      "sticky left-0 z-20 border-b px-0 text-center",
                      frozenBg(selected)
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
                        frozenBg(selected)
                      )}
                      style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
                    >
                      <div className="flex justify-center">
                        <RowSwitch active={c.active} onChange={(val) => setActive(c, val)} />
                      </div>
                    </TableCell>
                  )}
                  <TableCell
                    className={cn(
                      "sticky z-20 overflow-hidden border-b py-2 pl-3",
                      FROZEN_EDGE,
                      frozenBg(selected)
                    )}
                    style={{
                      width: colWidths.name,
                      minWidth: colWidths.name,
                      maxWidth: colWidths.name,
                      left: nameLeft,
                    }}
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                      {c._breakdown ? (
                        <span className="flex min-w-0 items-center gap-2 font-semibold">
                          <IconArrowsSplit2 className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{c._breakdown}</span>
                        </span>
                      ) : isLeaf ? (
                        <span className="flex min-w-0 items-center gap-2 font-semibold">
                          <PlatformBadge id={c.platform} />
                          <span className="truncate">{c.name}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => drillRow(c)}
                          title={
                            "Відкрити " +
                            (entity === "Кампанії" ? "групи оголошень" : "оголошення")
                          }
                          className="flex min-w-0 items-center gap-2 font-semibold text-primary hover:underline"
                        >
                          <PlatformBadge id={c.platform} />
                          <span className="truncate">{c.name}</span>
                          <IconChevronDown className="size-3.5 shrink-0 -rotate-90 opacity-55" />
                        </button>
                      )}
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        {c._breakdown ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <PlatformBadge id={c.platform} size={12} />
                            <span className="truncate">{c.name}</span>
                          </span>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "inline-block size-1.5 shrink-0 rounded-full",
                                c.active ? "bg-emerald-500" : "bg-muted-foreground/50"
                              )}
                            />
                            <span className="truncate">
                              {c.active ? "Активна" : "Вимкнена"} ·{" "}
                              {PLATFORM_BY_ID[c.platform]?.label} · ID {1042 + c._i}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {cols.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "overflow-hidden border-b px-3 text-left tabular-nums",
                        col.emphasize && "bg-primary/[0.045] font-medium"
                      )}
                    >
                      <ValueCell row={c} col={col} />
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="py-16 text-center text-muted-foreground">
                  Нічого не знайдено за фільтрами
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter className="border-0 bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell
                className={cn("sticky bottom-0 left-0 z-30 border-t", FOOTER_BG)}
                style={{ width: W_SELECT, minWidth: W_SELECT }}
              />
              {showToggleCol && (
                <TableCell
                  className={cn("sticky bottom-0 z-30 border-t", FOOTER_BG)}
                  style={{ width: W_TOGGLE, minWidth: W_TOGGLE, left: W_SELECT }}
                />
              )}
              <TableCell
                className={cn(
                  "sticky bottom-0 z-30 overflow-hidden border-t pl-3 font-bold",
                  FROZEN_EDGE,
                  FOOTER_BG
                )}
                style={{ width: colWidths.name, minWidth: colWidths.name, left: nameLeft }}
              >
                <span className="truncate">
                  Разом · {rows.length}{" "}
                  {breakdown === BREAKDOWNS[0] ? ENTITY_NOUN[entity] : "рядків"}
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
                      сер. {fmt(foot[col.key], col.unit)}
                    </span>
                  ) : (
                    <span className="font-bold">{fmt(foot[col.key], col.unit)}</span>
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

// three visual states: ascending ▲, descending ▼, or unsorted (faded ⇅)
function SortIndicator({ state }: { state: "asc" | "desc" | null }) {
  if (state === "asc")
    return <IconChevronUp className="size-3.5 shrink-0 text-foreground" />
  if (state === "desc")
    return <IconChevronDown className="size-3.5 shrink-0 text-foreground" />
  return <IconArrowsSort className="size-3.5 shrink-0 text-muted-foreground/35" />
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
function RowSwitch({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
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
