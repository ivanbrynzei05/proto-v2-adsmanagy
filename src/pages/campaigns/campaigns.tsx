import { useMemo, useState } from "react"
import {
  IconAdjustmentsHorizontal,
  IconArrowsSplit2,
  IconBox,
  IconCalendar,
  IconChevronDown,
  IconColumns,
  IconDownload,
  IconFolder,
  IconLayoutGrid,
  IconSearch,
  IconSpeakerphone,
  IconStack2,
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
      <span className="inline-flex items-center justify-end gap-2">
        <span className="h-1.5 w-11 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: Math.min(100, v) + "%" }}
          />
        </span>
        <span className="w-12 text-right tabular-nums">{fmt(v, col.unit)}</span>
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

type Indexed = Row & { _i: number }

export function CampaignsPage() {
  const allCols = COLUMNS
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allCols.map((c) => [c.key, true]))
  )
  const [sort, setSort] = useState<{ key: "name" | MetricKey; dir: "asc" | "desc" }>({
    key: "spend",
    dir: "desc",
  })
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "on" | "off">("all")
  const [sel, setSel] = useState<Set<number>>(() => new Set())
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({})
  const [entity, setEntity] = useState("Кампанії")
  const [portfolio, setPortfolio] = useState("all")
  const [showToggleCol, setShowToggleCol] = useState(true)
  const [platforms, setPlatforms] = useState<Set<PlatformId>>(
    () => new Set(PLATFORMS.map((p) => p.id))
  )
  const [drill, setDrill] = useState<{ campaigns: string[]; groups: string[] }>({
    campaigns: [],
    groups: [],
  })
  const [dateLabel, setDateLabel] = useState(DATE_PRESETS[2])
  const [breakdown, setBreakdown] = useState(BREAKDOWNS[0])

  const cols = allCols.filter((c) => visible[c.key])
  const isLeaf = entity === "Оголошення"

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
      (portfolio === "all" || c.portfolio === portfolio) &&
      platforms.has(c.platform) &&
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
  function switchPortfolio(p: string) {
    setPortfolio(p)
    setSel(new Set())
    setDrill({ campaigns: [], groups: [] })
  }
  function togglePlatform(id: PlatformId) {
    setPlatforms((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n.size === 0 ? s : n
    })
    setSel(new Set())
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
    [portfolio, platforms, drill]
  )

  const rows = useMemo<Indexed[]>(() => {
    let r: Indexed[] = (DATASETS[entity] || CAMPAIGNS).map((c, i) => ({
      ...c,
      _i: i,
      active: entity + ":" + i in activeMap ? activeMap[entity + ":" + i] : c.active,
    }))
    r = r.filter((c) => baseFilter(entity, c))
    if (query.trim()) r = r.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    if (statusFilter === "on") r = r.filter((c) => c.active)
    if (statusFilter === "off") r = r.filter((c) => !c.active)
    r.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      const cmp =
        typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sort.dir === "asc" ? cmp : -cmp
    })
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, portfolio, platforms, drill, query, statusFilter, sort, activeMap])

  const foot = useMemo(() => totals(rows), [rows])

  function toggleSort(key: "name" | MetricKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    )
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
  const curPf = PORTFOLIOS.find((p) => p.id === portfolio)
  const pfLabel = portfolio === "all" ? "Усі портфоліо" : curPf ? curPf.name : "Портфоліо"
  const PLATFORM_BY_ID = useMemo(
    () => Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, (typeof PLATFORMS)[number]>,
    []
  )
  const allAcc = platforms.size === PLATFORMS.length
  const accLabel = allAcc
    ? "Усі кабінети"
    : platforms.size === 1
      ? PLATFORM_BY_ID[[...platforms][0]].label
      : platforms.size + " кабінети"

  const colSpan = cols.length + 2 + (showToggleCol ? 1 : 0)

  // sticky left offsets for the frozen control + name columns
  const nameLeft = 44 + (showToggleCol ? 56 : 0)
  const stickyBg = (selected: boolean) =>
    selected ? "bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))]" : "bg-card"

  return (
    <div className="flex w-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Кампанії</h1>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="secondary" className="gap-1.5">
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

      <Card className="gap-0 overflow-hidden py-0">
        {/* data-source row: business portfolio + ad accounts */}
        <div className="flex flex-wrap items-center gap-3 border-b p-3.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="gap-1.5">
                  <IconFolder className="size-4 text-muted-foreground" />
                  {pfLabel}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel className="uppercase tracking-wide">
                Джерело даних
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={portfolio} onValueChange={switchPortfolio}>
                <DropdownMenuRadioItem value="all" closeOnClick>
                  Усі портфоліо
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {PORTFOLIOS.map((p) => (
                  <DropdownMenuRadioItem key={p.id} value={p.id} closeOnClick>
                    {p.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="gap-1.5">
                  <IconStack2 className="size-4 text-muted-foreground" />
                  {accLabel}
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="uppercase tracking-wide">
                Рекламні кабінети
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
                onClick={() => setPlatforms(new Set(PLATFORMS.map((p) => p.id)))}
              >
                Обрати всі
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto" />
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
              placeholder="Пошук та фільтр: назва кампанії, товар або показник"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* entity subtabs */}
        <div className="flex items-center gap-1 border-b px-3.5 pt-2.5">
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="uppercase tracking-wide">Службові</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showToggleCol}
                onCheckedChange={() => setShowToggleCol((v) => !v)}
                closeOnClick={false}
              >
                Стовпець «ВКЛ / ВИКЛ»
              </DropdownMenuCheckboxItem>
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
              <DropdownMenuRadioGroup value={breakdown} onValueChange={setBreakdown}>
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

        {/* table */}
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className={cn("sticky left-0 z-20 w-11 px-0 text-center", stickyBg(false))}
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
                    "sticky left-11 z-20 w-14 px-0 text-center text-[11px]",
                    stickyBg(false)
                  )}
                >
                  ВКЛ
                </TableHead>
              )}
              <TableHead
                className={cn(
                  "sticky z-20 min-w-65 cursor-pointer shadow-[1px_0_0_var(--border)]",
                  stickyBg(false)
                )}
                style={{ left: nameLeft }}
                onClick={() => toggleSort("name")}
              >
                <span className="inline-flex items-center gap-1">
                  Кампанія / товар
                  <SortIndicator active={sort.key === "name"} dir={sort.dir} />
                </span>
              </TableHead>
              {cols.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "cursor-pointer text-right",
                    c.emphasize && "bg-muted/40"
                  )}
                  title={c.hint}
                  onClick={() => toggleSort(c.key)}
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    {c.label}
                    <SortIndicator active={sort.key === c.key} dir={sort.dir} />
                  </span>
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
                  className={cn(selected && "bg-primary/[0.06] hover:bg-primary/[0.06]")}
                >
                  <TableCell
                    className={cn("sticky left-0 z-10 w-11 px-0 text-center", stickyBg(selected))}
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
                        "sticky left-11 z-10 w-14 px-0 text-center",
                        stickyBg(selected)
                      )}
                    >
                      <div className="flex justify-center">
                        <Switch
                          checked={c.active}
                          onCheckedChange={(val) => setActive(c, val)}
                          aria-label="Увімкнути / вимкнути"
                        />
                      </div>
                    </TableCell>
                  )}
                  <TableCell
                    className={cn(
                      "sticky z-10 min-w-65 shadow-[1px_0_0_var(--border)]",
                      stickyBg(selected)
                    )}
                    style={{ left: nameLeft }}
                  >
                    <div className="flex flex-col gap-0.5">
                      {isLeaf ? (
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <PlatformBadge id={c.platform} />
                          {c.name}
                        </span>
                      ) : (
                        <button
                          onClick={() => drillRow(c)}
                          title={
                            "Відкрити " +
                            (entity === "Кампанії" ? "групи оголошень" : "оголошення")
                          }
                          className="inline-flex w-fit items-center gap-2 font-semibold text-primary hover:underline"
                        >
                          <PlatformBadge id={c.platform} />
                          {c.name}
                          <IconChevronDown className="size-3.5 -rotate-90 opacity-55" />
                        </button>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          className={cn(
                            "inline-block size-1.5 rounded-full",
                            c.active ? "bg-emerald-500" : "bg-muted-foreground/50"
                          )}
                        />
                        {c.active ? "Активна" : "Вимкнена"} ·{" "}
                        {PLATFORM_BY_ID[c.platform]?.label} · ID {1042 + c._i}
                      </div>
                    </div>
                  </TableCell>
                  {cols.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn("text-right", col.emphasize && "bg-muted/30")}
                    >
                      <ValueCell row={c} col={col} />
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
                  Нічого не знайдено за фільтрами
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className={cn("sticky left-0 z-10 w-11 px-0", stickyBg(false))} />
              {showToggleCol && (
                <TableCell className={cn("sticky left-11 z-10 w-14 px-0", stickyBg(false))} />
              )}
              <TableCell
                className={cn(
                  "sticky z-10 min-w-65 font-bold shadow-[1px_0_0_var(--border)]",
                  stickyBg(false)
                )}
                style={{ left: nameLeft }}
              >
                Разом · {rows.length} {ENTITY_NOUN[entity]}
              </TableCell>
              {cols.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn("text-right tabular-nums", col.emphasize && "bg-muted/30")}
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

function SortIndicator({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <IconChevronDown
      className={cn(
        "size-3.5 transition-transform",
        active ? "text-foreground" : "text-muted-foreground/40",
        active && dir === "asc" && "rotate-180"
      )}
    />
  )
}
