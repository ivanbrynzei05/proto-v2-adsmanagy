import {
  IconAdjustments,
  IconChartArea,
  IconChartBar,
  IconChartDonut3,
  IconChartLine,
  IconChevronDown,
  IconCoin,
  IconLayoutList,
  IconPackage,
  IconPlayerPlay,
  IconRestore,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconTargetArrow,
  IconWorld,
  type Icon as TablerIcon,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { COL_GROUPS, COLUMNS, type MetricKey } from "@/pages/campaigns/data"
import { DateRangePicker } from "@/pages/campaigns/date-range"
import {
  activeFilterCount,
  AD_ACCOUNT_OPTIONS,
  chartAllowed,
  CHART_KINDS,
  DIMENSIONS,
  isAdditive,
  isTimeDimension,
  MAX_METRICS,
  metricColumn,
  metricCount,
  PLATFORM_OPTIONS,
  PORTFOLIO_OPTIONS,
  PRODUCT_OPTIONS,
  selectedMetrics,
  seriesColor,
  STATUSES,
  toggleMetricSlot,
  type ChartKind,
  type Dimension,
  type ReportParams,
} from "./data"

const CHART_ICONS: Record<ChartKind, TablerIcon> = {
  line: IconChartLine,
  area: IconChartArea,
  bar: IconChartBar,
  hbar: IconSortDescending,
  donut: IconChartDonut3,
}

// ---- small building blocks ----

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
    <section className="flex flex-col gap-2.5 px-4 py-3.5">
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  )
}

// A number the user types. Kept as a string so the field can be emptied, and
// only turned into a threshold when the report is built.
function NumberField({
  label,
  placeholder,
  suffix,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  suffix?: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <span className="relative">
        <Input
          inputMode="decimal"
          className={cn("h-9", suffix && "pr-7")}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
    </label>
  )
}

// Multi-select behind a dropdown: the trigger says how much of the list is in
// play, the list itself carries the checkboxes.
function MultiPicker({
  icon: Icon,
  options,
  value,
  onChange,
  emptyLabel,
  allLabel,
}: {
  icon: TablerIcon
  options: { id: string; label: string }[]
  value: string[]
  onChange: (next: string[]) => void
  emptyLabel: string
  allLabel: string
}) {
  const all = options.length
  const n = value.length
  const summary =
    n === 0
      ? emptyLabel
      : n === all
        ? `${allLabel} · ${all}`
        : n === 1
          ? (options.find((o) => o.id === value[0])?.label ?? `${n} з ${all}`)
          : `Обрано ${n} з ${all}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-9 w-full justify-between px-2.5 font-normal"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span
                className={cn("truncate", n === 0 && "text-muted-foreground")}
              >
                {summary}
              </span>
            </span>
            <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="max-h-80 min-w-56">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.id}
            checked={value.includes(o.id)}
            onCheckedChange={() =>
              onChange(
                value.includes(o.id)
                  ? value.filter((v) => v !== o.id)
                  : [...value, o.id]
              )
            }
            closeOnClick={false}
          >
            <span className="truncate">{o.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          closeOnClick={false}
          onClick={() => onChange(n === all ? [] : options.map((o) => o.id))}
        >
          {n === all ? "Зняти все" : "Обрати все"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// The metric picker doubles as the chart's legend key: the dot next to each
// chosen metric is the colour it will be drawn in.
function MetricPicker({
  params,
  patch,
}: {
  params: ReportParams
  patch: (next: Partial<ReportParams>) => void
}) {
  const chosen = selectedMetrics(params.metrics)
  const count = metricCount(params.metrics)
  const full = count >= MAX_METRICS

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              className="h-9 w-full justify-between px-2.5 font-normal"
            >
              <span className="flex items-center gap-1.5">
                <IconLayoutList className="size-4 text-muted-foreground" />
                {count === 0
                  ? "Оберіть метрики"
                  : `Обрано ${count} з ${MAX_METRICS}`}
              </span>
              <IconChevronDown className="size-4 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="max-h-[420px] min-w-64">
          {COL_GROUPS.map((g) => (
            <div key={g.id}>
              <DropdownMenuLabel className="tracking-wide uppercase">
                {g.label}
              </DropdownMenuLabel>
              {COLUMNS.filter((c) => c.group === g.id).map((c) => {
                const on = params.metrics.includes(c.key)
                return (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={on}
                    disabled={!on && full}
                    onCheckedChange={() =>
                      patch({
                        metrics: toggleMetricSlot(params.metrics, c.key),
                      })
                    }
                    closeOnClick={false}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{c.label}</span>
                      {c.unit && (
                        <span className="text-xs text-muted-foreground">
                          {c.unit}
                        </span>
                      )}
                    </span>
                  </DropdownMenuCheckboxItem>
                )
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chosen.map((m) => (
            <span
              key={m.key}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card py-1 pr-1 pl-2 text-xs font-medium shadow-xs"
            >
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: seriesColor(m.slot) }}
              />
              {m.column.label}
              <button
                type="button"
                aria-label={`Прибрати ${m.column.label}`}
                onClick={() =>
                  patch({ metrics: toggleMetricSlot(params.metrics, m.key) })
                }
                className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function OptionRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

// ---- the panel ----

export function ParamsPanel({
  params,
  patch,
  dirty,
  onApply,
  onReset,
  collapsed = false,
  onToggleCollapsed,
}: {
  params: ReportParams
  patch: (next: Partial<ReportParams>) => void
  /** the draft differs from what is drawn on the right */
  dirty: boolean
  onApply: () => void
  onReset: () => void
  /** phones fold the panel away once a report is drawn - see the page */
  collapsed?: boolean
  onToggleCollapsed?: () => void
}) {
  const metrics = selectedMetrics(params.metrics)
  const primary = metrics[0]
  const timeCut = isTimeDimension(params.dim)
  const filters = activeFilterCount(params)
  const dimension = DIMENSIONS.find((d) => d.id === params.dim)
  const kinds = CHART_KINDS.filter((k) => chartAllowed(k.id, params.dim))

  return (
    <Card className="gap-0 py-0 [--card-spacing:16px]">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          !collapsed && "border-b"
        )}
      >
        <IconAdjustments className="size-4 text-muted-foreground" />
        <h2 className="text-[15px] font-bold tracking-tight">Параметри</h2>
        {filters > 0 && (
          <Badge
            variant="outline"
            className="border-transparent bg-primary/10 text-primary tabular-nums"
          >
            {filters}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={onReset}
            >
              <IconRestore className="size-4" />
              Скинути
            </Button>
          )}
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={onToggleCollapsed}
            >
              {collapsed ? "Змінити" : "Згорнути"}
              <IconChevronDown
                className={cn(
                  "size-4 transition-transform",
                  !collapsed && "rotate-180"
                )}
              />
            </Button>
          )}
        </div>
      </div>

      {collapsed ? null : (
        <div className="flex flex-col divide-y">
          {/* period */}
          <Section title="Період">
            <DateRangePicker
              value={params.range}
              onChange={(range) => patch({ range })}
              className="h-9 w-full justify-between px-2.5"
            />
            {timeCut && (
              <label className="flex items-center justify-between gap-2">
                <FieldLabel>Крок</FieldLabel>
                <Select
                  value={params.step}
                  onValueChange={(v) => patch({ step: v as "day" | "week" })}
                >
                  <SelectTrigger size="sm" className="w-32">
                    <SelectValue>
                      {(v: string) => (v === "week" ? "По тижнях" : "По днях")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">По днях</SelectItem>
                    <SelectItem value="week">По тижнях</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            )}
          </Section>

          {/* what the x axis is */}
          <Section title="Розріз" hint={dimension?.hint}>
            <Select
              value={params.dim}
              onValueChange={(v) => patch({ dim: v as Dimension })}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue>
                  {(v: string) =>
                    DIMENSIONS.find((d) => d.id === v)?.label ?? v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {/* metrics */}
          <Section title="Метрики" hint={`до ${MAX_METRICS}`}>
            <MetricPicker params={params} patch={patch} />
          </Section>

          {/* chart type */}
          <Section title="Тип графіка">
            <div className="grid grid-cols-3 gap-1 rounded-lg border p-1">
              {kinds.map((k) => {
                const KindIcon = CHART_ICONS[k.id]
                const shareOnly =
                  k.id === "donut" && (!primary || !isAdditive(primary.key))
                const active = params.chart === k.id
                return (
                  <button
                    key={k.id}
                    type="button"
                    disabled={shareOnly}
                    title={
                      shareOnly
                        ? "Частки рахуються лише для сумарних метрик"
                        : k.label
                    }
                    onClick={() => patch({ chart: k.id })}
                    className={cn(
                      "flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      shareOnly && "pointer-events-none opacity-40"
                    )}
                  >
                    <KindIcon className="size-4" />
                    {k.label}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* the slice of data itself */}
          <Section
            title="Фільтри"
            hint={filters > 0 ? `${filters} активних` : undefined}
          >
            <div className="flex flex-col gap-1">
              <FieldLabel>Платформи</FieldLabel>
              <MultiPicker
                icon={IconWorld}
                options={PLATFORM_OPTIONS}
                value={params.platforms}
                onChange={(v) =>
                  patch({ platforms: v as ReportParams["platforms"] })
                }
                emptyLabel="Жодної платформи"
                allLabel="Усі платформи"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Рекламні кабінети</FieldLabel>
              <MultiPicker
                icon={IconTargetArrow}
                options={AD_ACCOUNT_OPTIONS}
                value={params.adAccounts}
                onChange={(adAccounts) => patch({ adAccounts })}
                emptyLabel="Жодного кабінету"
                allLabel="Усі кабінети"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Бізнес-акаунти</FieldLabel>
              <MultiPicker
                icon={IconCoin}
                options={PORTFOLIO_OPTIONS}
                value={params.portfolios}
                onChange={(portfolios) => patch({ portfolios })}
                emptyLabel="Жодного акаунта"
                allLabel="Усі акаунти"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Товари</FieldLabel>
              <MultiPicker
                icon={IconPackage}
                options={PRODUCT_OPTIONS}
                value={params.products}
                onChange={(products) => patch({ products })}
                emptyLabel="Жодного товару"
                allLabel="Усі товари"
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Статус кампаній</FieldLabel>
              <Select
                value={params.status}
                onValueChange={(v) =>
                  patch({ status: v as ReportParams["status"] })
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue>
                    {(v: string) =>
                      STATUSES.find((s) => s.id === v)?.label ?? v
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Назва кампанії містить</FieldLabel>
              <div className="relative">
                <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8.5"
                  placeholder="напр. Neck Relax"
                  value={params.query}
                  onChange={(e) => patch({ query: e.target.value })}
                />
              </div>
            </div>
          </Section>

          {/* numeric thresholds - the "typed in" half of the report */}
          <Section title="Пороги" hint="порожнє = без обмеження">
            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                label="Витрати від"
                placeholder="0"
                suffix="₴"
                value={params.minSpend}
                onChange={(minSpend) => patch({ minSpend })}
              />
              <NumberField
                label="Лідів від"
                placeholder="0"
                value={params.minLeads}
                onChange={(minLeads) => patch({ minLeads })}
              />
              <NumberField
                label="ROI від"
                placeholder="-100"
                suffix="%"
                value={params.minRoi}
                onChange={(minRoi) => patch({ minRoi })}
              />
              <NumberField
                label="Топ позицій"
                placeholder="усі"
                value={params.topN}
                onChange={(topN) => patch({ topN })}
              />
            </div>
          </Section>

          {/* sorting - only a category cut can be sorted; a period is chronological */}
          <Section
            title="Сортування"
            hint={timeCut ? "хронологічно" : undefined}
          >
            <div className="flex gap-2">
              <Select
                value={params.sortBy}
                onValueChange={(v) => patch({ sortBy: v as MetricKey })}
                disabled={timeCut}
              >
                <SelectTrigger className="h-9 min-w-0 flex-1">
                  <SelectValue>
                    {(v: string) => metricColumn(v as MetricKey).label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                disabled={timeCut}
                aria-label={
                  params.sortDir === "desc"
                    ? "Від більшого до меншого"
                    : "Від меншого до більшого"
                }
                onClick={() =>
                  patch({ sortDir: params.sortDir === "desc" ? "asc" : "desc" })
                }
              >
                {params.sortDir === "desc" ? (
                  <IconSortDescending />
                ) : (
                  <IconSortAscending />
                )}
              </Button>
            </div>
          </Section>

          <Section title="Що показати">
            <OptionRow
              label="Порівняти з минулим періодом"
              hint="дельта на плитках метрик"
              checked={params.compare}
              onChange={(compare) => patch({ compare })}
            />
            <OptionRow
              label="Підписи значень"
              hint="цифри просто на графіку"
              checked={params.labels}
              onChange={(labels) => patch({ labels })}
            />
          </Section>
        </div>
      )}

      {/* the whole point of the page: nothing is drawn until this is pressed */}
      {!collapsed && (
        <div className="sticky bottom-0 z-10 flex flex-col gap-1.5 border-t bg-card p-4">
          <Button
            className="w-full gap-1.5"
            disabled={metrics.length === 0}
            onClick={onApply}
          >
            <IconPlayerPlay className="size-4" />
            Застосувати
          </Button>
          <span className="text-center text-[11px] text-muted-foreground">
            {metrics.length === 0
              ? "Оберіть хоча б одну метрику"
              : dirty
                ? "Параметри змінено - звіт ще не перебудовано"
                : "Звіт побудовано за цими параметрами"}
          </span>
        </div>
      )}
    </Card>
  )
}
