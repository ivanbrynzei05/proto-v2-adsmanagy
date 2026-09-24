import {
  IconBell,
  IconBolt,
  IconBrandTelegram,
  IconChevronDown,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconHistory,
  IconMail,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react"
import { useState } from "react"

import { useRules } from "@/components/rules-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChipCount, FilterChip } from "@/components/ui/filter-chip"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Segmented } from "@/components/ui/segmented"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ActionChip, Chip } from "@/features/rules/rule-chips"
import { RuleDialog, type RuleSeed } from "@/features/rules/rule-dialog"
import {
  ACTIONS,
  actionInfo,
  blankRule,
  conditionLabel,
  countLabel,
  dayLabel,
  formatMetric,
  fromTemplate,
  LEVEL_ICON,
  LEVELS,
  metricColumn,
  newRuleId,
  rangeInfo,
  RULE_TEMPLATES,
  scheduleLabel,
  scopeLabel,
  timeLabel,
  type ActionType,
  type LogResult,
  type Rule,
  type RuleLevel,
  type RuleLogEntry,
} from "@/features/rules/types"
import { pageOf } from "@/lib/paging"
import { cn } from "@/lib/utils"
import { fmt } from "@/pages/campaigns/data"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"

type Tab = "rules" | "log"

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {children}
    </span>
  )
}

// The rules table's columns. On a phone the header goes and each row folds
// into a card: the middle cells stack under the name.
const RULE_GRID =
  "md:grid md:grid-cols-[2.25rem_minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_2rem] md:items-center md:gap-x-4"

function RuleHeader() {
  return (
    <div
      className={cn(
        RULE_GRID,
        "hidden border-b bg-muted/40 px-5 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
      )}
    >
      <span />
      <span>Правило</span>
      <span>Якщо</span>
      <span>То</span>
      <span>Перевірка</span>
      <span>Спрацювало</span>
      <span />
    </div>
  )
}

function RuleRow({
  rule,
  lastRun,
  onToggle,
  onEdit,
  onDuplicate,
  onJournal,
  onRemove,
}: {
  rule: Rule
  /** the latest run in the journal and how many objects it touched */
  lastRun: { at: Date; count: number } | null
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onDuplicate: () => void
  onJournal: () => void
  onRemove: () => void
}) {
  const LevelIcon = LEVEL_ICON[rule.level]
  const { app, email, telegram } = rule.notify
  // the switch and the menu stay bright on a switched-off rule
  const dim = cn("transition-opacity", !rule.enabled && "opacity-55")

  return (
    <li
      className={cn(
        RULE_GRID,
        "relative flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 md:px-5 md:py-3"
      )}
    >
      <Switch
        className="relative z-10 mt-0.5 md:mt-0"
        checked={rule.enabled}
        onCheckedChange={onToggle}
        aria-label={rule.enabled ? "Вимкнути правило" : "Увімкнути правило"}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 md:contents">
        <div className={cn("min-w-0", dim)}>
          {/* the whole row opens the editor */}
          <button
            type="button"
            onClick={onEdit}
            className="block max-w-full truncate text-left text-sm font-semibold after:absolute after:inset-0 hover:underline"
          >
            {rule.name}
          </button>
          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <LevelIcon className="size-3.5 shrink-0" />
            <span className="truncate">{scopeLabel(rule)}</span>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center gap-1", dim)}>
          {rule.conditions.length === 0 ? (
            <span className="text-xs text-muted-foreground">Без умов</span>
          ) : (
            <>
              {rule.conditions.map((c, i) => (
                <Chip key={i} className="bg-muted">
                  {conditionLabel(c)}
                </Chip>
              ))}
              <span className="text-[11px] text-muted-foreground">
                {rangeInfo(rule.range).label}
              </span>
            </>
          )}
        </div>

        <div className={cn("min-w-0", dim)}>
          <ActionChip
            action={rule.action}
            className="max-w-full whitespace-normal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground md:contents md:text-xs">
          <div className={cn("flex flex-col gap-1", dim)}>
            <span className="flex items-center gap-1">
              <IconClock className="size-3.5 shrink-0" />
              {scheduleLabel(rule.schedule)}
            </span>
            {(app || email || telegram) && (
              <span className="hidden items-center gap-1.5 md:flex">
                {app && (
                  <IconBell className="size-3.5" aria-label="У застосунку" />
                )}
                {email && <IconMail className="size-3.5" aria-label="Email" />}
                {telegram && (
                  <IconBrandTelegram
                    className="size-3.5"
                    aria-label="Telegram"
                  />
                )}
              </span>
            )}
          </div>

          <div className={dim}>
            {lastRun ? (
              <button
                type="button"
                onClick={onJournal}
                className="relative z-10 flex items-center gap-1 text-left hover:text-foreground md:flex-col md:items-start md:gap-0"
              >
                <span className="flex items-center gap-1">
                  <IconHistory className="size-3.5 shrink-0 md:hidden" />
                  {dayLabel(lastRun.at)} {timeLabel(lastRun.at)}
                </span>
                <span className="text-[11px]">
                  <span className="md:hidden">· </span>
                  {countLabel(lastRun.count, rule.level)}
                </span>
              </button>
            ) : (
              <span className="hidden md:inline">—</span>
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative z-10 -mt-1 -mr-2 text-muted-foreground md:m-0"
              aria-label="Дії з правилом"
            >
              <IconDotsVertical />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onEdit}>
            <IconPencil />
            Редагувати
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <IconCopy />
            Дублювати
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onJournal}>
            <IconHistory />
            Журнал
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <IconTrash />
            Видалити
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

// budget changes print the amounts instead - see ResultChip
const RESULT: Record<
  Exclude<LogResult["type"], "budget">,
  { label: string; icon: Icon; tone: string }
> = {
  paused: {
    label: "Вимкнено",
    icon: IconPlayerPause,
    tone: actionInfo("pause").tone,
  },
  activated: {
    label: "Увімкнено",
    icon: IconPlayerPlay,
    tone: actionInfo("activate").tone,
  },
  notified: {
    label: "Сповіщення",
    icon: IconBell,
    tone: actionInfo("notify").tone,
  },
}

function ResultChip({
  result,
  className,
}: {
  result: LogResult
  className?: string
}) {
  if (result.type === "budget") {
    const down = result.to < result.from
    const tone = actionInfo(down ? "budgetDown" : "budgetUp").tone
    const TrendIcon = down ? IconTrendingDown : IconTrendingUp
    return (
      <Chip className={cn(tone, className)}>
        <TrendIcon />
        {fmt(result.from, "")} → {fmt(result.to, "₴")}
      </Chip>
    )
  }
  const r = RESULT[result.type]
  return (
    <Chip className={cn(r.tone, className)}>
      <r.icon />
      {r.label}
    </Chip>
  )
}

function JournalRow({ entry }: { entry: RuleLogEntry }) {
  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 px-4 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <span className="pt-px text-xs font-medium text-muted-foreground tabular-nums sm:pt-0">
        {timeLabel(entry.at)}
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <PlatformBadge id={entry.platform} size={14} />
          <span className="truncate text-[13px] font-medium">{entry.name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconBolt className="size-3" />
            {entry.ruleName}
          </span>
          {entry.facts.map((f) => (
            <span key={f.metric} className="tabular-nums">
              · {metricColumn(f.metric).label} {formatMetric(f.metric, f.value)}
            </span>
          ))}
        </div>
      </div>
      <ResultChip
        result={entry.result}
        className="col-start-2 mt-2 justify-self-start sm:col-start-3 sm:mt-0"
      />
    </li>
  )
}

const LOG_PAGE = 20

const RESULT_FILTERS: { id: LogResult["type"]; label: string; icon: Icon }[] = [
  { id: "paused", label: "Вимкнено", icon: IconPlayerPause },
  { id: "activated", label: "Увімкнено", icon: IconPlayerPlay },
  { id: "budget", label: "Бюджет", icon: IconTrendingUp },
  { id: "notified", label: "Сповіщення", icon: IconBell },
]

// What the rules did, newest first, a page at a time - cut by rule and by
// outcome, with the days marked inside the page.
function Journal({
  log,
  filter,
  onFilter,
}: {
  log: RuleLogEntry[]
  /** a rule id, or "all" */
  filter: string
  onFilter: (filter: string) => void
}) {
  const [result, setResult] = useState<LogResult["type"] | "all">("all")
  const [page, setPage] = useState(0)

  // the rules the journal knows about, by the name they fired under last
  const names = new Map<string, string>()
  for (const e of log) if (!names.has(e.ruleId)) names.set(e.ruleId, e.ruleName)

  const ofRule = filter === "all" ? log : log.filter((e) => e.ruleId === filter)
  const entries =
    result === "all" ? ofRule : ofRule.filter((e) => e.result.type === result)
  const paged = pageOf(entries, page, LOG_PAGE)

  const days: { label: string; entries: RuleLogEntry[] }[] = []
  for (const e of paged.items) {
    const label = dayLabel(e.at)
    const day = days[days.length - 1]
    if (day?.label === label) day.entries.push(e)
    else days.push({ label, entries: [e] })
  }

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:p-3.5">
        <Select
          value={filter}
          onValueChange={(v) => {
            onFilter(v as string)
            setPage(0)
          }}
        >
          <SelectTrigger size="sm" className="w-full shrink-0 sm:w-64">
            <IconBolt className="text-muted-foreground" />
            <SelectValue>
              {(v: string) =>
                v === "all" ? "Усі правила" : (names.get(v) ?? "Правило")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Усі правила</SelectItem>
            {Array.from(names, ([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="-mx-3 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <FilterChip
            active={result === "all"}
            onClick={() => {
              setResult("all")
              setPage(0)
            }}
          >
            Усі <ChipCount>{ofRule.length}</ChipCount>
          </FilterChip>
          {RESULT_FILTERS.map((r) => {
            const n = ofRule.filter((e) => e.result.type === r.id).length
            if (n === 0 && result !== r.id) return null
            return (
              <FilterChip
                key={r.id}
                active={result === r.id}
                onClick={() => {
                  setResult(r.id)
                  setPage(0)
                }}
              >
                <r.icon />
                {r.label}
                <ChipCount>{n}</ChipCount>
              </FilterChip>
            )
          })}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Записів немає
        </p>
      ) : (
        <div>
          {days.map((day) => (
            <section key={day.label} className="border-t first:border-t-0">
              <h2 className="border-b bg-muted/40 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:px-5">
                {day.label}
              </h2>
              <ul className="divide-y">
                {day.entries.map((e) => (
                  <JournalRow key={e.id} entry={e} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Pagination
        page={paged.page}
        pageCount={paged.pageCount}
        size={LOG_PAGE}
        total={entries.length}
        onPage={setPage}
      />
    </Card>
  )
}

// "Нове правило" - a blank one or one of the ready-made strategies.
function NewRuleMenu({ onPick }: { onPick: (rule: Rule) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="gap-1.5">
            <IconPlus className="size-4" />
            Нове правило
            <IconChevronDown className="size-4 opacity-70" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => onPick(blankRule())}>
          <IconPlus />
          Порожнє правило
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Шаблони</DropdownMenuLabel>
        {RULE_TEMPLATES.map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => onPick(fromTemplate(t))}>
            <t.icon className="text-muted-foreground" />
            {t.rule.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const RULES_PAGE = 10

type Status = "all" | "on" | "off"

export function RulesPage() {
  const { rules, log, saveRule, removeRule, setEnabled } = useRules()
  const [tab, setTab] = useState<Tab>("rules")
  const [logFilter, setLogFilter] = useState("all")
  const [status, setStatus] = useState<Status>("all")
  const [level, setLevel] = useState<RuleLevel | "all">("all")
  const [action, setAction] = useState<ActionType | "all">("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  // kept while the dialogs animate out
  const [seed, setSeed] = useState<RuleSeed | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [toRemove, setToRemove] = useState<Rule | null>(null)

  // search and filters first, so the status tabs count within what's left
  const q = query.trim().toLowerCase()
  const found = rules.filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q)) &&
      (level === "all" || r.level === level) &&
      (action === "all" || r.action.type === action)
  )
  const onCount = found.filter((r) => r.enabled).length
  const listed = found.filter(
    (r) => status === "all" || r.enabled === (status === "on")
  )
  const paged = pageOf(listed, page, RULES_PAGE)

  function openEditor(rule: Rule, isNew: boolean) {
    setSeed({ rule, isNew })
    setEditorOpen(true)
  }

  function lastRun(rule: Rule) {
    const latest = log.find((e) => e.ruleId === rule.id)
    if (!latest) return null
    const at = latest.at.getTime()
    const count = log.filter(
      (e) => e.ruleId === rule.id && e.at.getTime() === at
    ).length
    return { at: latest.at, count }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">Автоправила</h1>
        <Segmented
          className="order-last w-full sm:order-none sm:w-auto"
          value={tab}
          onChange={setTab}
          options={[
            {
              id: "rules",
              label: (
                <>
                  Правила <Count>{rules.length}</Count>
                </>
              ),
            },
            {
              id: "log",
              label: (
                <>
                  Журнал <Count>{log.length}</Count>
                </>
              ),
            },
          ]}
        />
        <div className="ml-auto">
          <NewRuleMenu onPick={(rule) => openEditor(rule, true)} />
        </div>
      </div>

      {tab === "rules" &&
        (rules.length === 0 ? (
          <Card className="items-center gap-4 px-4 py-10">
            <p className="text-sm text-muted-foreground">Правил немає</p>
            <div className="flex max-w-xl flex-wrap justify-center gap-2">
              {RULE_TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  size="sm"
                  onClick={() => openEditor(fromTemplate(t), true)}
                >
                  <t.icon className="text-muted-foreground" />
                  {t.rule.name}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="gap-0 py-0">
            <div className="flex flex-wrap items-center gap-2 border-b p-3 sm:p-3.5">
              <Segmented
                className="w-full lg:w-auto"
                value={status}
                onChange={(next) => {
                  setStatus(next)
                  setPage(0)
                }}
                options={[
                  {
                    id: "all",
                    label: (
                      <>
                        Усі <Count>{found.length}</Count>
                      </>
                    ),
                  },
                  {
                    id: "on",
                    label: (
                      <>
                        Увімкнені <Count>{onCount}</Count>
                      </>
                    ),
                  },
                  {
                    id: "off",
                    label: (
                      <>
                        Вимкнені <Count>{found.length - onCount}</Count>
                      </>
                    ),
                  },
                ]}
              />
              <Select
                value={level}
                onValueChange={(v) => {
                  setLevel(v as RuleLevel | "all")
                  setPage(0)
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="min-w-0 flex-1 lg:w-44 lg:flex-none"
                >
                  <SelectValue>
                    {(v: string) => {
                      const l = LEVELS.find((x) => x.id === v)
                      if (!l) return "Усі рівні"
                      const LevelIcon = LEVEL_ICON[l.id]
                      return (
                        <>
                          <LevelIcon className="text-muted-foreground" />
                          {l.label}
                        </>
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі рівні</SelectItem>
                  {LEVELS.map((l) => {
                    const LevelIcon = LEVEL_ICON[l.id]
                    return (
                      <SelectItem key={l.id} value={l.id}>
                        <LevelIcon className="text-muted-foreground" />
                        {l.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Select
                value={action}
                onValueChange={(v) => {
                  setAction(v as ActionType | "all")
                  setPage(0)
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="min-w-0 flex-1 lg:w-48 lg:flex-none"
                >
                  <SelectValue>
                    {(v: string) => {
                      if (v === "all") return "Усі дії"
                      const a = actionInfo(v as ActionType)
                      return (
                        <>
                          <a.icon className="text-muted-foreground" />
                          {a.label}
                        </>
                      )
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі дії</SelectItem>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <a.icon className="text-muted-foreground" />
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full lg:ml-auto lg:w-64">
                <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8.5"
                  placeholder="Пошук правила"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(0)
                  }}
                />
              </div>
            </div>

            {listed.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Нічого не знайдено
              </p>
            ) : (
              <RuleHeader />
            )}
            <ul className="divide-y">
              {paged.items.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  lastRun={lastRun(rule)}
                  onToggle={(enabled) => setEnabled(rule.id, enabled)}
                  onEdit={() => openEditor(rule, false)}
                  onDuplicate={() =>
                    openEditor(
                      {
                        ...structuredClone(rule),
                        id: newRuleId(),
                        name: rule.name + " (копія)",
                      },
                      true
                    )
                  }
                  onJournal={() => {
                    setLogFilter(
                      log.some((e) => e.ruleId === rule.id) ? rule.id : "all"
                    )
                    setTab("log")
                  }}
                  onRemove={() => setToRemove(rule)}
                />
              ))}
            </ul>

            <Pagination
              page={paged.page}
              pageCount={paged.pageCount}
              size={RULES_PAGE}
              total={listed.length}
              onPage={setPage}
            />
          </Card>
        ))}

      {tab === "log" && (
        <Journal log={log} filter={logFilter} onFilter={setLogFilter} />
      )}

      <RuleDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        seed={seed}
        onSave={saveRule}
      />

      <Dialog
        open={toRemove !== null}
        onOpenChange={(open) => !open && setToRemove(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Видалити правило?</DialogTitle>
            <DialogDescription>{toRemove?.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setToRemove(null)}>
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (toRemove) removeRule(toRemove.id)
                setToRemove(null)
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
