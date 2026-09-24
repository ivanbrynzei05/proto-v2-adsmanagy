import {
  IconBell,
  IconBox,
  IconCash,
  IconLayoutGrid,
  IconMoon,
  IconPlayerPause,
  IconPlayerPlay,
  IconShieldX,
  IconSpeakerphone,
  IconSun,
  IconTrendingDown,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react"

import {
  AD_GROUPS,
  ADS,
  CAMPAIGNS,
  COLUMNS,
  fmt,
  parseProductId,
  plural,
  type Column,
  type MetricKey,
  type PlatformId,
  type Row,
} from "@/pages/campaigns/data"
import { UA_WEEKDAYS } from "@/pages/campaigns/date-utils"

// Automated rules, the way Ads Manager and Bïrch shape them: which objects,
// which conditions over which period, what to do, how often to check. The
// prototype only demonstrates the flow - nothing here talks to an ad platform.

// ---- what a rule acts on ----

export type RuleLevel = "campaign" | "adset" | "ad"

export const LEVELS: {
  id: RuleLevel
  label: string
  short: string
  /** 1 кампанія / 2 кампанії / 5 кампаній */
  forms: [string, string, string]
  /** the empty preview line */
  none: string
}[] = [
  {
    id: "campaign",
    label: "Кампанії",
    short: "Кампанії",
    forms: ["кампанія", "кампанії", "кампаній"],
    none: "Жодної кампанії",
  },
  {
    id: "adset",
    label: "Групи оголошень",
    short: "Групи",
    forms: ["група оголошень", "групи оголошень", "груп оголошень"],
    none: "Жодної групи",
  },
  {
    id: "ad",
    label: "Оголошення",
    short: "Оголошення",
    forms: ["оголошення", "оголошення", "оголошень"],
    none: "Жодного оголошення",
  },
]

// the same icons the campaigns table tabs its levels with
export const LEVEL_ICON: Record<RuleLevel, Icon> = {
  campaign: IconSpeakerphone,
  adset: IconLayoutGrid,
  ad: IconBox,
}

export function levelInfo(level: RuleLevel) {
  return LEVELS.find((l) => l.id === level) ?? LEVELS[0]
}

export function levelRows(level: RuleLevel): Row[] {
  if (level === "adset") return AD_GROUPS
  if (level === "ad") return ADS
  return CAMPAIGNS
}

export function countLabel(n: number, level: RuleLevel) {
  const [one, few, many] = levelInfo(level).forms
  return n + " " + plural(n, one, few, many)
}

// ---- conditions ----

// The first group is what the ad platform reports on its own. The second only
// exists once orders come back from the CRM - the part native Ads Manager rules
// can't see, so it is kept apart in the picker.
export const RULE_METRICS: { group: string; keys: MetricKey[] }[] = [
  {
    group: "Реклама",
    keys: ["spend", "leads", "costPerLead", "cpm", "cpc", "ctr"],
  },
  {
    group: "CRM",
    keys: [
      "approves",
      "approveRate",
      "costPerApprove",
      "buyoutRate",
      "roi",
      "romi",
    ],
  },
]

export function metricColumn(key: MetricKey): Column {
  return COLUMNS.find((c) => c.key === key) ?? COLUMNS[0]
}

export type Operator = ">" | "<" | "="

export const OPERATORS: { id: Operator; label: string }[] = [
  { id: ">", label: "більше ніж" },
  { id: "<", label: "менше ніж" },
  { id: "=", label: "дорівнює" },
]

export type Condition = { metric: MetricKey; op: Operator; value: number }

// One period for the whole rule, as in Ads Manager.
export type TimeRange = "today" | "yesterday" | "3d" | "7d" | "14d" | "30d"

export const RANGES: { id: TimeRange; label: string; days: number }[] = [
  // the day isn't over yet, so it holds a bit over half a day's worth
  { id: "today", label: "за сьогодні", days: 0.6 },
  { id: "yesterday", label: "за вчора", days: 1 },
  { id: "3d", label: "за 3 дні", days: 3 },
  { id: "7d", label: "за 7 днів", days: 7 },
  { id: "14d", label: "за 14 днів", days: 14 },
  { id: "30d", label: "за 30 днів", days: 30 },
]

export function rangeInfo(range: TimeRange) {
  return RANGES.find((r) => r.id === range) ?? RANGES[0]
}

// ---- actions ----

export type ActionType =
  | "pause"
  | "activate"
  | "budgetUp"
  | "budgetDown"
  | "notify"

export type RuleAction = {
  type: ActionType
  /** budget actions only - the step, in % */
  percent: number
  /** budget actions only - the ceiling (up) or the floor (down), ₴ a day */
  limit: number
}

export const ACTIONS: {
  id: ActionType
  label: string
  icon: Icon
  /** chip tint in the rule list and the journal */
  tone: string
}[] = [
  {
    id: "pause",
    label: "Вимкнути",
    icon: IconPlayerPause,
    tone: "bg-destructive/10 text-destructive",
  },
  {
    id: "activate",
    label: "Увімкнути",
    icon: IconPlayerPlay,
    tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "budgetUp",
    label: "Збільшити бюджет",
    icon: IconTrendingUp,
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "budgetDown",
    label: "Зменшити бюджет",
    icon: IconTrendingDown,
    tone: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  },
  {
    id: "notify",
    label: "Лише сповістити",
    icon: IconBell,
    tone: "bg-muted text-muted-foreground",
  },
]

export function actionInfo(type: ActionType) {
  return ACTIONS.find((a) => a.id === type) ?? ACTIONS[0]
}

export function isBudget(type: ActionType) {
  return type === "budgetUp" || type === "budgetDown"
}

// ---- schedule + notifications ----

export type Every = "15m" | "30m" | "1h" | "3h" | "daily"

export type Schedule = {
  every: Every
  /** daily only - "23:00" */
  time: string
  /** daily only - 0 = Пн … 6 = Нд */
  days: number[]
}

export const EVERY_OPTIONS: { id: Every; label: string }[] = [
  { id: "15m", label: "Кожні 15 хв" },
  { id: "30m", label: "Кожні 30 хв" },
  { id: "1h", label: "Щогодини" },
  { id: "3h", label: "Кожні 3 год" },
  { id: "daily", label: "За розкладом" },
]

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

export type Channels = { app: boolean; email: boolean; telegram: boolean }

// ---- the rule ----

export type Rule = {
  id: string
  name: string
  enabled: boolean
  level: RuleLevel
  /** dataset indices; null = every active object on the level (every paused
   *  one when the action turns things on) */
  targets: number[] | null
  conditions: Condition[]
  range: TimeRange
  action: RuleAction
  schedule: Schedule
  notify: Channels
}

// ---- preview ----

// The table holds the last 7 days, so counts and money scale with the period;
// rates stay what they are.
const ADDITIVE = new Set<MetricKey>(["spend", "leads", "approves"])

export function metricValue(row: Row, metric: MetricKey, range: TimeRange) {
  const v = row[metric]
  if (!ADDITIVE.has(metric)) return v
  return Math.round((v * rangeInfo(range).days) / 7)
}

function passes(v: number, c: Condition) {
  if (c.op === ">") return v > c.value
  if (c.op === "<") return v < c.value
  return Math.round(v) === c.value
}

// What the rule would act on right now - the editor's live preview.
export function matchingRows(
  rule: Pick<Rule, "level" | "targets" | "conditions" | "range" | "action">
): { row: Row; index: number }[] {
  const wantActive = rule.action.type !== "activate"
  return levelRows(rule.level)
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row, index }) =>
        (rule.targets === null || rule.targets.includes(index)) &&
        row.active === wantActive &&
        rule.conditions.every((c) =>
          passes(metricValue(row, c.metric, rule.range), c)
        )
    )
}

// ---- labels ----

export function formatMetric(metric: MetricKey, value: number) {
  return fmt(value, metricColumn(metric).unit)
}

export function conditionLabel(c: Condition) {
  return (
    metricColumn(c.metric).label +
    " " +
    c.op +
    " " +
    formatMetric(c.metric, c.value)
  )
}

export function scopeLabel(rule: Pick<Rule, "level" | "targets" | "action">) {
  if (rule.targets !== null) return countLabel(rule.targets.length, rule.level)
  const noun = levelInfo(rule.level).label.toLowerCase()
  return (
    (rule.action.type === "activate" ? "Усі вимкнені " : "Усі активні ") + noun
  )
}

export function actionLabel(action: RuleAction) {
  if (action.type === "budgetUp")
    return `Бюджет +${action.percent}% · макс. ${fmt(action.limit, "₴")}`
  if (action.type === "budgetDown")
    return `Бюджет −${action.percent}% · мін. ${fmt(action.limit, "₴")}`
  if (action.type === "notify") return "Сповістити"
  return actionInfo(action.type).label
}

// "Щодня о 23:00", "Пн–Пт о 10:00", "Пн, Ср, Пт о 10:00"
export function scheduleLabel(s: Schedule) {
  if (s.every !== "daily")
    return EVERY_OPTIONS.find((o) => o.id === s.every)?.label ?? ""
  const days = [...s.days].sort((a, b) => a - b)
  const key = days.join("")
  const when =
    key === "0123456"
      ? "Щодня"
      : key === "01234"
        ? "Пн–Пт"
        : days.map((d) => UA_WEEKDAYS[d]).join(", ")
  return when + " о " + s.time
}

// ---- starting points ----

const EVERYDAY: Schedule = { every: "daily", time: "10:00", days: ALL_DAYS }
const NO_BUDGET = { percent: 20, limit: 0 }

export function blankRule(level: RuleLevel = "campaign"): Rule {
  return {
    id: newRuleId(),
    name: "",
    enabled: true,
    level,
    targets: null,
    conditions: [{ metric: "costPerLead", op: ">", value: 60 }],
    range: "today",
    action: { type: "pause", ...NO_BUDGET },
    schedule: { every: "30m", time: "10:00", days: ALL_DAYS },
    notify: { app: true, email: false, telegram: false },
  }
}

export function newRuleId() {
  return "rule-" + Math.random().toString(36).slice(2, 9)
}

export type RuleTemplate = {
  id: string
  icon: Icon
  rule: Omit<Rule, "id" | "enabled">
}

// The demo account's rules start from these; only some are offered as
// templates for a new rule.
const PRESETS: RuleTemplate[] = [
  {
    id: "stop-loss",
    icon: IconShieldX,
    rule: {
      name: "Стоп-лосс по ціні ліда",
      level: "campaign",
      targets: null,
      conditions: [
        { metric: "costPerLead", op: ">", value: 75 },
        { metric: "spend", op: ">", value: 2000 },
      ],
      range: "today",
      action: { type: "pause", ...NO_BUDGET },
      schedule: { every: "30m", time: "10:00", days: ALL_DAYS },
      notify: { app: true, email: false, telegram: true },
    },
  },
  {
    id: "no-leads",
    icon: IconCash,
    rule: {
      name: "Витрати без лідів",
      level: "ad",
      targets: null,
      conditions: [
        { metric: "spend", op: ">", value: 400 },
        { metric: "leads", op: "=", value: 0 },
      ],
      range: "today",
      action: { type: "pause", ...NO_BUDGET },
      schedule: { every: "15m", time: "10:00", days: ALL_DAYS },
      notify: { app: true, email: false, telegram: true },
    },
  },
  {
    id: "romi-loss",
    icon: IconTrendingDown,
    rule: {
      name: "Збиткові за ROMI",
      level: "campaign",
      targets: null,
      conditions: [
        { metric: "romi", op: "<", value: 0 },
        { metric: "approves", op: ">", value: 30 },
      ],
      range: "7d",
      action: { type: "pause", ...NO_BUDGET },
      schedule: EVERYDAY,
      notify: { app: true, email: true, telegram: false },
    },
  },
  {
    id: "scale",
    icon: IconTrendingUp,
    rule: {
      name: "Масштабування прибуткових",
      level: "campaign",
      targets: null,
      conditions: [
        { metric: "roi", op: ">", value: 100 },
        { metric: "approves", op: ">", value: 40 },
      ],
      range: "3d",
      action: { type: "budgetUp", percent: 20, limit: 8000 },
      schedule: EVERYDAY,
      notify: { app: true, email: false, telegram: true },
    },
  },
  {
    id: "night-off",
    icon: IconMoon,
    rule: {
      name: "Нічна пауза",
      level: "campaign",
      targets: null,
      conditions: [],
      range: "today",
      action: { type: "pause", ...NO_BUDGET },
      schedule: { every: "daily", time: "23:00", days: ALL_DAYS },
      notify: { app: false, email: false, telegram: false },
    },
  },
  {
    id: "morning-on",
    icon: IconSun,
    rule: {
      name: "Ранковий старт",
      level: "campaign",
      targets: null,
      conditions: [],
      range: "today",
      action: { type: "activate", ...NO_BUDGET },
      schedule: { every: "daily", time: "07:00", days: ALL_DAYS },
      notify: { app: false, email: false, telegram: false },
    },
  },
  {
    id: "costly-approve",
    icon: IconBell,
    rule: {
      name: "Дорогий апрув",
      level: "campaign",
      targets: null,
      conditions: [{ metric: "costPerApprove", op: ">", value: 180 }],
      range: "3d",
      action: { type: "notify", ...NO_BUDGET },
      schedule: { every: "1h", time: "10:00", days: ALL_DAYS },
      notify: { app: true, email: false, telegram: true },
    },
  },
]

export function fromTemplate(t: RuleTemplate, enabled = true): Rule {
  return { ...structuredClone(t.rule), id: newRuleId(), enabled }
}

function template(id: string) {
  return PRESETS.find((t) => t.id === id)!
}

export const RULE_TEMPLATES: RuleTemplate[] = [template("no-leads")]

// the campaigns the night pause switches off and the morning brings back
const NIGHT_CAMPAIGNS = [0, 5, 7]

// A stop-loss kept next to every campaign, the way buyers run them - each
// ceiling a notch above the campaign's own cost per lead, so the table as it
// stands trips none of them.
const CAMPAIGN_STOPS: Rule[] = CAMPAIGNS.map(
  (row, i): Rule => ({
    ...blankRule("campaign"),
    id: "demo-stop-" + i,
    name: "Стоп-лосс · " + parseProductId(row.name).rest,
    enabled: i % 4 !== 3,
    targets: [i],
    conditions: [
      {
        metric: "costPerLead",
        op: ">",
        value: Math.round(row.costPerLead * 1.35),
      },
      {
        metric: "spend",
        op: ">",
        value: Math.max(500, Math.round(row.spend / 14 / 100) * 100),
      },
    ],
    notify: { app: true, email: false, telegram: true },
  })
)

// What the account opens with - calibrated against the mock table, so an
// enabled rule that switches things off has nothing left to catch right now.
export const DEMO_RULES: Rule[] = [
  { ...fromTemplate(template("stop-loss")), id: "demo-stop-loss" },
  { ...fromTemplate(template("no-leads")), id: "demo-no-leads" },
  { ...fromTemplate(template("scale")), id: "demo-scale" },
  {
    ...fromTemplate(template("night-off")),
    id: "demo-night",
    targets: NIGHT_CAMPAIGNS,
  },
  {
    ...fromTemplate(template("morning-on")),
    id: "demo-morning",
    targets: NIGHT_CAMPAIGNS,
  },
  { ...fromTemplate(template("costly-approve")), id: "demo-approve" },
  {
    ...blankRule("adset"),
    id: "demo-approve-rate",
    name: "Низький % апруву",
    enabled: false,
    conditions: [
      { metric: "approveRate", op: "<", value: 25 },
      { metric: "leads", op: ">", value: 100 },
    ],
    range: "7d",
    schedule: { every: "1h", time: "10:00", days: ALL_DAYS },
  },
  ...CAMPAIGN_STOPS,
]

// ---- journal ----

export type LogResult =
  | { type: "paused" }
  | { type: "activated" }
  | { type: "budget"; from: number; to: number }
  | { type: "notified" }

export type RuleLogEntry = {
  id: string
  ruleId: string
  /** as it was called when it fired */
  ruleName: string
  at: Date
  level: RuleLevel
  name: string
  /** the campaign a group / an ad belongs to */
  campaign?: string
  platform: PlatformId
  result: LogResult
  /** the numbers that made it fire */
  facts: { metric: MetricKey; value: number }[]
}

// hh:mm on the day `daysBack` days ago
function dayAt(daysBack: number, hh: number, mm = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  d.setHours(hh, mm, 0, 0)
  return d
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step
}

// a daily budget that matches the week of spend in the table
function dailyBudget(row: Row) {
  return roundTo(row.spend / 7, 50)
}

const LOG_DAYS = 14

// Two weeks of the demo rules at work, kept in step with the table: whatever
// they switched off for good is switched off there now.
export function demoLog(): RuleLogEntry[] {
  const entries: RuleLogEntry[] = []
  const now = Date.now()
  function push(
    ruleId: string,
    at: Date,
    level: RuleLevel,
    index: number,
    result: LogResult,
    facts: RuleLogEntry["facts"] = []
  ) {
    // nothing has fired later than now
    if (at.getTime() > now) return
    const rule = DEMO_RULES.find((r) => r.id === ruleId)!
    const row = levelRows(level)[index]
    entries.push({
      id: "log-" + entries.length,
      ruleId,
      ruleName: rule.name,
      at,
      level,
      name: row.name,
      campaign: row.campaign,
      platform: row.platform,
      result,
      facts,
    })
  }

  for (let d = 0; d < LOG_DAYS; d++) {
    // the night pause and the morning start that undoes it
    for (const i of NIGHT_CAMPAIGNS) {
      push("demo-night", dayAt(d + 1, 23), "campaign", i, { type: "paused" })
      push("demo-morning", dayAt(d, 7), "campaign", i, { type: "activated" })
    }
    // costly approves - once a day per campaign, most days
    ;[3, 4, 8, 13].forEach((i, k) => {
      if ((d + k) % 3 === 2) return
      const cpa = CAMPAIGNS[i].costPerApprove
      push(
        "demo-approve",
        dayAt(d, 9 + ((d * 5 + k * 3) % 11)),
        "campaign",
        i,
        { type: "notified" },
        [
          {
            metric: "costPerApprove",
            value: Math.round(cpa * (0.94 + ((d + k) % 5) * 0.03) * 10) / 10,
          },
        ]
      )
    })
  }

  // five mornings of scaling on the three campaigns that keep it up - each
  // step starts where the one before it ended
  for (const i of [5, 6, 11]) {
    const row = CAMPAIGNS[i]
    for (let d = 0; d < 5; d++) {
      const from = roundTo(dailyBudget(row) / 1.2 ** d, 10)
      push(
        "demo-scale",
        dayAt(d, 10),
        "campaign",
        i,
        { type: "budget", from, to: roundTo(from * 1.2, 10) },
        [
          { metric: "roi", value: row.roi },
          { metric: "approves", value: metricValue(row, "approves", "3d") },
        ]
      )
    }
  }

  // stop-losses, on the campaigns that are switched off in the table now
  push("demo-stop-loss", dayAt(1, 16, 30), "campaign", 14, { type: "paused" }, [
    { metric: "costPerLead", value: 82.4 },
    { metric: "spend", value: 2390 },
  ])
  push("demo-stop-loss", dayAt(2, 13), "campaign", 2, { type: "paused" }, [
    { metric: "costPerLead", value: 79.1 },
    { metric: "spend", value: 2140 },
  ])
  push("demo-stop-10", dayAt(4, 12, 30), "campaign", 10, { type: "paused" }, [
    { metric: "costPerLead", value: 38.2 },
    { metric: "spend", value: 910 },
  ])

  // ads that spent without a lead - before their campaigns went off
  const idle: [ad: number, daysBack: number][] = [
    [10, 3],
    [11, 5],
    [12, 6],
    [13, 8],
    [50, 5],
    [51, 7],
    [52, 9],
    [53, 11],
  ]
  idle.forEach(([ad, daysBack], k) => {
    push(
      "demo-no-leads",
      dayAt(daysBack, 9 + ((k * 7) % 10), 15),
      "ad",
      ad,
      { type: "paused" },
      [
        { metric: "spend", value: 410 + ((k * 37) % 180) },
        { metric: "leads", value: 0 },
      ]
    )
  })

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime())
}

// "сьогодні 10:00", "вчора 23:00", "22 вер 16:30"
export function dayLabel(d: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - day.getTime()) / 86400_000)
  if (diff === 0) return "Сьогодні"
  if (diff === 1) return "Вчора"
  return d.toLocaleDateString("uk", { day: "numeric", month: "long" })
}

export function timeLabel(d: Date) {
  return d.toLocaleTimeString("uk", { hour: "2-digit", minute: "2-digit" })
}
