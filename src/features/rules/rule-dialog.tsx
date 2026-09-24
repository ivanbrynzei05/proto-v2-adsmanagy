import {
  IconBell,
  IconBrandTelegram,
  IconCheck,
  IconClock,
  IconMail,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/components/ui/segmented"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { MetricKey, Row } from "@/pages/campaigns/data"
import { UA_WEEKDAYS } from "@/pages/campaigns/date-utils"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import { ToggleChip } from "@/pages/campaigns/toggle-chip"

import { RuleSentence } from "./rule-chips"
import {
  ACTIONS,
  formatMetric,
  isBudget,
  LEVEL_ICON,
  LEVELS,
  levelInfo,
  levelRows,
  matchingRows,
  metricColumn,
  metricValue,
  OPERATORS,
  RANGES,
  RULE_METRICS,
  scheduleLabel,
  scopeLabel,
  type ActionType,
  type Channels,
  type Every,
  type Operator,
  type Rule,
  type RuleLevel,
  type Schedule,
  type TimeRange,
} from "./types"

// The rule being edited, and whether saving it adds a new one.
export type RuleSeed = { rule: Rule; isNew: boolean }

// a sensible first number for each metric, so switching the metric of a
// condition never leaves "CTR > 60%" behind
const DEFAULT_VALUE: Record<string, number> = {
  spend: 1000,
  leads: 10,
  costPerLead: 60,
  cpm: 200,
  cpc: 10,
  ctr: 1,
  approves: 20,
  approveRate: 30,
  costPerApprove: 150,
  buyoutRate: 60,
  roi: 0,
  romi: 0,
}

const TIMES = Array.from(
  { length: 24 },
  (_, h) => String(h).padStart(2, "0") + ":00"
)

// the check interval as a row of segments - short enough to fit a phone
const EVERY_SHORT: Record<Every, string> = {
  "15m": "15 хв",
  "30m": "30 хв",
  "1h": "1 год",
  "3h": "3 год",
  daily: "Розклад",
}

const MAX_CONDITIONS = 5

const LABEL =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"

type DraftCondition = {
  key: number
  metric: MetricKey
  op: Operator
  value: string
}

// "41,5" and "41.5" are the same number on a Ukrainian layout
function num(value: string): number | null {
  const n = Number(value.replace(",", ".").trim())
  return value.trim() !== "" && Number.isFinite(n) ? n : null
}

function text(value: number) {
  return String(value).replace(".", ",")
}

// One numbered step of the form, with room on the right for a control.
function Step({
  n,
  title,
  aside,
  children,
}: {
  n: number
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-7 items-center gap-2.5">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular-nums">
          {n}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      <div className="flex flex-col gap-2.5 sm:pl-7.5">{children}</div>
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

// A number with its unit welded on the right - the salary field in the team
// dialog does the same.
function UnitInput({
  value,
  onChange,
  unit,
  label,
  className,
}: {
  value: string
  onChange: (value: string) => void
  unit?: string
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-9 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30",
        num(value) === null && "border-destructive/60",
        className
      )}
    >
      <Input
        value={value}
        aria-label={label}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))}
        className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      {unit && (
        <span className="flex shrink-0 items-center bg-muted px-2.5 text-sm text-muted-foreground">
          {unit}
        </span>
      )}
    </div>
  )
}

// Specific objects to hand the rule, searched by name. Groups and ads repeat
// names across campaigns, so each line carries its campaign underneath.
function TargetPicker({
  level,
  value,
  onChange,
}: {
  level: RuleLevel
  value: number[]
  onChange: (value: number[]) => void
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const list = levelRows(level)
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row }) =>
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.campaign?.toLowerCase().includes(q)
    )

  function toggle(index: number) {
    onChange(
      value.includes(index)
        ? value.filter((i) => i !== index)
        : [...value, index]
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="relative border-b">
        <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук за назвою"
          className="h-9 w-full bg-transparent pr-3 pl-8.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul className="max-h-52 overflow-y-auto p-1">
        {list.length === 0 && (
          <li className="px-2 py-6 text-center text-[13px] text-muted-foreground">
            Нічого не знайдено
          </li>
        )}
        {list.map(({ row, index }) => {
          const checked = value.includes(index)
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={checked}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background"
                  )}
                >
                  {checked && <IconCheck className="size-2.5" stroke={3.5} />}
                </span>
                <PlatformBadge id={row.platform} size={14} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-[13px]",
                      !row.active && "text-muted-foreground"
                    )}
                  >
                    {row.name}
                  </span>
                  {row.campaign && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {row.campaign}
                    </span>
                  )}
                </span>
                {!row.active && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    вимк.
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MetricSelect({
  value,
  onChange,
  className,
}: {
  value: MetricKey
  onChange: (metric: MetricKey) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MetricKey)}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue>
          {(v: string) => metricColumn(v as MetricKey).label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {RULE_METRICS.map((g) => (
          <SelectGroup key={g.group}>
            <SelectLabel>{g.group}</SelectLabel>
            {g.keys.map((k) => (
              <SelectItem key={k} value={k}>
                {metricColumn(k).label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

// What the rule would catch right now, with the numbers it looks at.
function Matches({
  matches,
  level,
  metrics,
  range,
  max,
}: {
  matches: { row: Row; index: number }[]
  level: RuleLevel
  metrics: MetricKey[]
  range: TimeRange
  max: number
}) {
  if (matches.length === 0)
    return (
      <p className="rounded-lg border border-dashed px-3 py-4 text-center text-[13px] text-muted-foreground">
        {levelInfo(level).none}
      </p>
    )
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {matches.slice(0, max).map(({ row, index }) => (
        <li key={index} className="flex items-start gap-2.5 px-3 py-2">
          <span className="mt-0.5 shrink-0">
            <PlatformBadge id={row.platform} size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px]">{row.name}</div>
            {metrics.length > 0 && (
              <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground tabular-nums">
                {metrics.map((m) => (
                  <span key={m}>
                    {metricColumn(m).label}{" "}
                    <span className="font-medium text-foreground">
                      {formatMetric(m, metricValue(row, m, range))}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
      {matches.length > max && (
        <li className="px-3 py-2 text-xs text-muted-foreground">
          і ще {matches.length - max}
        </li>
      )}
    </ul>
  )
}

// Lives inside the popup, which unmounts on close - every open starts from the
// seed it was handed.
function RuleForm({
  seed,
  onCancel,
  onSave,
}: {
  seed: RuleSeed
  onCancel: () => void
  onSave: (rule: Rule) => void
}) {
  const initial = seed.rule
  const [name, setName] = useState(initial.name)
  const [level, setLevel] = useState<RuleLevel>(initial.level)
  const [targets, setTargets] = useState<number[] | null>(initial.targets)
  const [conditions, setConditions] = useState<DraftCondition[]>(() =>
    initial.conditions.map((c, key) => ({ ...c, key, value: text(c.value) }))
  )
  const [range, setRange] = useState<TimeRange>(initial.range)
  const [actionType, setActionType] = useState<ActionType>(initial.action.type)
  const [percent, setPercent] = useState(text(initial.action.percent))
  const [limit, setLimit] = useState(
    initial.action.limit ? text(initial.action.limit) : ""
  )
  const [schedule, setSchedule] = useState<Schedule>(initial.schedule)
  const [notify, setNotify] = useState<Channels>(initial.notify)

  const activating = actionType === "activate"
  const budget = isBudget(actionType)

  // conditions still being typed are left out of the preview until they parse
  const parsed = conditions.flatMap((c) => {
    const value = num(c.value)
    return value === null ? [] : [{ metric: c.metric, op: c.op, value }]
  })
  const draft: Rule = {
    ...initial,
    name: name.trim(),
    level,
    targets,
    conditions: parsed,
    range,
    action: {
      type: actionType,
      percent: num(percent) ?? 0,
      limit: num(limit) ?? 0,
    },
    schedule,
    notify,
  }
  const matches = matchingRows(draft)
  // the metrics the conditions look at, next to each match
  const shown = Array.from(new Set(parsed.map((c) => c.metric))).slice(0, 2)
  const LevelIcon = LEVEL_ICON[level]

  const valid =
    draft.name !== "" &&
    parsed.length === conditions.length &&
    // a rule without conditions only makes sense on a timetable
    (conditions.length > 0 || schedule.every === "daily") &&
    (targets === null || targets.length > 0) &&
    (!budget || (draft.action.percent > 0 && draft.action.limit > 0)) &&
    (actionType !== "notify" ||
      notify.app ||
      notify.email ||
      notify.telegram) &&
    (schedule.every !== "daily" || schedule.days.length > 0)

  function changeLevel(next: RuleLevel) {
    setLevel(next)
    // indices point into another list on another level
    setTargets((t) => (t === null ? null : []))
    // ads carry no budget of their own
    if (next === "ad" && budget) setActionType("pause")
  }

  function changeAction(next: ActionType) {
    setActionType(next)
    // a budget step never starts without its ceiling / floor filled in
    if (isBudget(next) && num(limit) === null)
      setLimit(next === "budgetUp" ? "8000" : "1000")
  }

  function updateCondition(key: number, patch: Partial<DraftCondition>) {
    setConditions((list) =>
      list.map((c) => (c.key === key ? { ...c, ...patch } : c))
    )
  }

  function addCondition() {
    const used = new Set(conditions.map((c) => c.metric))
    const metric =
      RULE_METRICS.flatMap((g) => g.keys).find((k) => !used.has(k)) ?? "spend"
    setConditions((list) => [
      ...list,
      {
        key: Math.max(-1, ...list.map((c) => c.key)) + 1,
        metric,
        op: ">",
        value: text(DEFAULT_VALUE[metric] ?? 0),
      },
    ])
  }

  function toggleDay(day: number) {
    setSchedule((s) => ({
      ...s,
      days: s.days.includes(day)
        ? s.days.filter((d) => d !== day)
        : [...s.days, day],
    }))
  }

  const matchCount = (
    <span className="text-sm font-semibold tabular-nums">{matches.length}</span>
  )

  return (
    <>
      <DialogHeader className="gap-3 border-b px-4 pt-5 pr-12 pb-4 sm:px-6">
        <DialogTitle className="text-base">
          {seed.isNew ? "Нове правило" : "Редагування правила"}
        </DialogTitle>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Назва правила"
          aria-label="Назва"
          className="h-10 text-[15px] font-medium"
        />
      </DialogHeader>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-7 overflow-y-auto px-4 py-5 sm:px-6">
          <Step n={1} title="Застосувати до">
            <Segmented
              value={level}
              onChange={changeLevel}
              options={LEVELS.map((l) => {
                const Icon = LEVEL_ICON[l.id]
                return {
                  id: l.id,
                  label: (
                    <>
                      <Icon className="hidden sm:block" />
                      <span className="sm:hidden">{l.short}</span>
                      <span className="hidden sm:inline">{l.label}</span>
                    </>
                  ),
                }
              })}
            />
            <Segmented
              value={targets === null ? "all" : "picked"}
              onChange={(v) =>
                setTargets((t) => (v === "all" ? null : (t ?? [])))
              }
              options={[
                {
                  id: "all",
                  label: activating ? "Усі вимкнені" : "Усі активні",
                },
                {
                  id: "picked",
                  label:
                    "Вибрані" +
                    (targets && targets.length > 0
                      ? " · " + targets.length
                      : ""),
                },
              ]}
            />
            {targets !== null && (
              <TargetPicker
                level={level}
                value={targets}
                onChange={setTargets}
              />
            )}
          </Step>

          <Step
            n={2}
            title="Якщо"
            aside={
              <Select
                value={range}
                onValueChange={(v) => setRange(v as TimeRange)}
              >
                <SelectTrigger size="sm" className="h-7 text-[13px]">
                  <IconClock className="text-muted-foreground" />
                  <SelectValue>
                    {(v: string) =>
                      RANGES.find((r) => r.id === v)?.label ?? String(v)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {RANGES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {conditions.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-3 text-center text-[13px] text-muted-foreground">
                Без умов
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {conditions.map((c, i) => {
                  const unit = metricColumn(c.metric).unit
                  return (
                    <div key={c.key} className="flex flex-col gap-1.5">
                      {i > 0 && (
                        <span className="self-start rounded bg-muted px-1.5 py-px text-[10px] font-semibold text-muted-foreground uppercase">
                          і
                        </span>
                      )}
                      {/* phone: the metric and the remove button on one line,
                          the comparison under them */}
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_8.5rem_auto]">
                        <MetricSelect
                          className="col-span-2 sm:col-span-1"
                          value={c.metric}
                          onChange={(metric) =>
                            updateCondition(c.key, {
                              metric,
                              value: text(DEFAULT_VALUE[metric] ?? 0),
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Прибрати умову"
                          className="text-muted-foreground sm:order-last"
                          onClick={() =>
                            setConditions((list) =>
                              list.filter((x) => x.key !== c.key)
                            )
                          }
                        >
                          <IconX />
                        </Button>
                        <Segmented
                          className="h-9"
                          value={c.op}
                          onChange={(op) => updateCondition(c.key, { op })}
                          options={OPERATORS.map((o) => ({
                            id: o.id,
                            label: (
                              <span
                                title={o.label}
                                className="w-4 text-center text-sm"
                              >
                                {o.id}
                              </span>
                            ),
                          }))}
                        />
                        <UnitInput
                          className="col-span-2 sm:col-span-1"
                          label="Значення"
                          value={c.value}
                          unit={unit || undefined}
                          onChange={(value) =>
                            updateCondition(c.key, { value })
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {conditions.length < MAX_CONDITIONS && (
              <Button
                variant="outline"
                size="sm"
                className="self-start border-dashed"
                onClick={addCondition}
              >
                <IconPlus />
                Умова
              </Button>
            )}
          </Step>

          {/* the side panel carries this on a wide screen */}
          <section className="flex flex-col gap-2 lg:hidden">
            <div className="flex items-center justify-between">
              <h3 className={LABEL}>Підпадають зараз</h3>
              {matchCount}
            </div>
            <Matches
              matches={matches}
              level={level}
              metrics={shown}
              range={range}
              max={5}
            />
          </section>

          <Step n={3} title="То">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {ACTIONS.map((a) => {
                const on = actionType === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    // ads carry no budget of their own
                    disabled={level === "ad" && isBudget(a.id)}
                    onClick={() => changeAction(a.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2 text-left text-[13px] leading-tight font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 sm:flex-col sm:items-start sm:gap-2 sm:p-2.5",
                      on
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-input hover:bg-muted/60"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-md [&>svg]:size-4",
                        a.tone
                      )}
                    >
                      <a.icon />
                    </span>
                    {a.label}
                  </button>
                )
              })}
            </div>
            {budget && (
              <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                <Field label="Крок">
                  <UnitInput
                    label="Крок"
                    value={percent}
                    onChange={setPercent}
                    unit="%"
                  />
                </Field>
                <Field
                  label={
                    actionType === "budgetUp"
                      ? "Максимум на день"
                      : "Мінімум на день"
                  }
                >
                  <UnitInput
                    label="Ліміт бюджету"
                    value={limit}
                    onChange={setLimit}
                    unit="₴"
                  />
                </Field>
              </div>
            )}
          </Step>

          <Step n={4} title="Перевіряти">
            <Segmented
              value={schedule.every}
              onChange={(every) => setSchedule((s) => ({ ...s, every }))}
              options={(Object.keys(EVERY_SHORT) as Every[]).map((id) => ({
                id,
                label: EVERY_SHORT[id],
              }))}
            />
            {schedule.every === "daily" && (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={schedule.time}
                  onValueChange={(v) =>
                    setSchedule((s) => ({ ...s, time: v as string }))
                  }
                >
                  <SelectTrigger className="w-28">
                    <IconClock className="text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex min-w-0 flex-1 gap-1">
                  {UA_WEEKDAYS.map((d, i) => {
                    const on = schedule.days.includes(i)
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(i)}
                        className={cn(
                          "grid h-9 min-w-0 flex-1 place-items-center rounded-md border text-[13px] font-medium transition-colors sm:max-w-10",
                          on
                            ? "border-primary/60 bg-primary/10 text-primary"
                            : "border-input text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Step>

          <Step n={5} title="Сповістити">
            <div className="flex flex-wrap gap-1.5">
              <ToggleChip
                active={notify.app}
                onClick={() => setNotify((n) => ({ ...n, app: !n.app }))}
              >
                <IconBell className="size-4" />У застосунку
              </ToggleChip>
              <ToggleChip
                active={notify.email}
                onClick={() => setNotify((n) => ({ ...n, email: !n.email }))}
              >
                <IconMail className="size-4" />
                Email
              </ToggleChip>
              <ToggleChip
                active={notify.telegram}
                onClick={() =>
                  setNotify((n) => ({ ...n, telegram: !n.telegram }))
                }
              >
                <IconBrandTelegram className="size-4" />
                Telegram
              </ToggleChip>
            </div>
          </Step>
        </div>

        {/* the rule as it will read in the list, and what it catches now */}
        <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l bg-muted/30 p-5 lg:flex">
          <section className="flex flex-col gap-2">
            <h3 className={LABEL}>Підсумок</h3>
            <div className="flex flex-col gap-2.5 rounded-lg border bg-card p-3">
              <RuleSentence rule={draft} />
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <LevelIcon className="size-3.5 shrink-0" />
                  {targets !== null && targets.length === 0
                    ? levelInfo(level).none
                    : scopeLabel(draft)}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconClock className="size-3.5 shrink-0" />
                  {scheduleLabel(schedule)}
                </span>
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className={LABEL}>Підпадають зараз</h3>
              {matchCount}
            </div>
            <Matches
              matches={matches}
              level={level}
              metrics={shown}
              range={range}
              max={12}
            />
          </section>
        </aside>
      </div>

      <DialogFooter className="border-t px-4 py-3 sm:px-6">
        <Button variant="secondary" onClick={onCancel}>
          Скасувати
        </Button>
        <Button
          disabled={!valid}
          className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          onClick={() => onSave(draft)}
        >
          {seed.isNew ? "Створити правило" : "Зберегти"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function RuleDialog({
  open,
  onOpenChange,
  seed,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** kept while the dialog animates out */
  seed: RuleSeed | null
  onSave: (rule: Rule) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 lg:h-[min(48rem,calc(100vh-2rem))] lg:max-w-5xl">
        {seed && (
          <RuleForm
            key={seed.rule.id}
            seed={seed}
            onCancel={() => onOpenChange(false)}
            onSave={(rule) => {
              onSave(rule)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
