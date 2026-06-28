import {
  IconAlertTriangle,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarEvent,
  IconChevronDown,
  IconCircleCheckFilled,
  IconClock,
  IconFlask,
  IconLock,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconRosetteDiscountCheck,
  IconSparkles,
} from "@tabler/icons-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { BillingPeriodToggle } from "@/components/ui/billing-period-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPlanDate, type Subscription } from "@/features/billing/checkout-sheet"
import {
  PLAN_ADDONS,
  PLAN_FEATURES,
  PricingGrid,
  YEARLY_MULTIPLIER,
  type PlanFeatureKey,
} from "@/features/billing/plans"
import { useSubscription } from "@/features/billing/subscription-context"
import {
  cycleTotal,
  daysUntil,
  hasAccess,
  hasPaidPlan,
  monthlyTotal,
  planById,
  remainingFraction,
  SCENARIOS,
  type Period,
  type Scenario,
  type ScenarioTone,
  type SubState,
} from "@/features/billing/subscription-state"
import { cn } from "@/lib/utils"

function money(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

// ----------------------------------------------------------------- big ring
// Large period-progress ring used in the status hero. The arc shows how much
// of the current period has elapsed; the centre holds days-left / a glyph.
function BigRing({
  pct,
  ringClass,
  children,
}: {
  pct: number
  ringClass: string
  children: React.ReactNode
}) {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100)
  return (
    <div className="relative grid size-24 shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="size-24 -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="5"
          className="stroke-black/[0.06] dark:stroke-white/10"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className={cn("transition-all", ringClass)}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        {children}
      </div>
    </div>
  )
}

// ------------------------------------------------- floating demo switcher
const SCENARIO_TONES: Record<ScenarioTone, { node: string; text: string }> = {
  sky: { node: "border-sky-500 bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
  emerald: {
    node: "border-emerald-500 bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    node: "border-violet-500 bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    node: "border-amber-500 bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  red: { node: "border-destructive bg-destructive", text: "text-destructive" },
}

// A vertical lifecycle "journey": scenarios are nodes on a connected rail,
// colour-coded by state. Pinned bottom-right, semi-transparent, collapsible.
function FloatingScenarioSwitcher({
  active,
  onPick,
}: {
  active: Scenario["id"]
  onPick: (s: Scenario) => void
}) {
  const [open, setOpen] = useState(true)
  const current = SCENARIOS.find((s) => s.id === active)

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-72 flex-col items-end gap-2">
      {open && (
        <div className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:bg-card/75">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <IconFlask className="size-3.5 text-lime-500" />
              Життєвий цикл
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Згорнути"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconChevronDown className="size-4" />
            </button>
          </div>
          <div className="relative max-h-[68vh] overflow-y-auto px-2 py-2">
            {/* connecting rail behind the nodes */}
            <div className="pointer-events-none absolute top-7 bottom-7 left-[1.875rem] w-px bg-border/70" />
            {SCENARIOS.map((scenario) => {
              const isActive = scenario.id === active
              const tone = SCENARIO_TONES[scenario.tone]
              const Icon = scenario.icon
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onPick(scenario)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors",
                    isActive ? "bg-muted/70" : "hover:bg-muted/40"
                  )}
                >
                  <span
                    className={cn(
                      "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isActive
                        ? cn(tone.node, "text-white shadow-sm")
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-[13px] leading-tight font-semibold",
                        isActive ? tone.text : "text-foreground"
                      )}
                    >
                      {scenario.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {scenario.hint}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3.5 py-2 text-sm font-semibold shadow-xl ring-1 ring-black/5 backdrop-blur-md transition-colors hover:bg-card dark:bg-card/75"
      >
        <IconFlask className="size-4 text-lime-500" />
        {open ? "Демо-сценарії" : (current?.label ?? "Сценарії")}
      </button>
    </div>
  )
}

// ----------------------------------------------------------------- hero
type HeroTone = "base" | "primary" | "destructive"

// Colours come from design tokens only (base / primary / destructive). The
// panel stays a neutral card; accent lives in the icon chip and progress ring.
const HERO_TONE: Record<HeroTone, { iconBox: string; ring: string }> = {
  base: {
    iconBox: "bg-foreground/[0.06] text-foreground",
    ring: "stroke-muted-foreground/50",
  },
  primary: {
    iconBox: "bg-primary/10 text-primary",
    ring: "stroke-primary",
  },
  destructive: {
    iconBox: "bg-destructive/10 text-destructive",
    ring: "stroke-destructive/80",
  },
}

function NoticeStrip({
  icon: Icon,
  text,
  action,
}: {
  icon: typeof IconClock
  text: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 p-3 backdrop-blur-sm sm:flex-row sm:items-center">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">{text}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// State-driven hero: the whole panel (tint, icon, headline, ring metric and the
// primary action) reflects the current subscription state.
function SubscriptionHero({
  state,
  onTopUp,
  onResume,
  onCancelScheduled,
  onToggleAutoRenew,
  onSwitchYearly,
  onManageAddons,
}: {
  state: SubState
  onTopUp: () => void
  onResume: () => void
  onCancelScheduled: () => void
  onToggleAutoRenew: (v: boolean) => void
  onSwitchYearly: () => void
  onManageAddons: () => void
}) {
  const plan = planById(state.planId)
  const total = cycleTotal(state.planId, state.period, state.addons)
  const periodLabel = state.period === "yearly" ? "рік" : "місяць"
  const scheduled = state.scheduledPlanId
    ? planById(state.scheduledPlanId)
    : undefined

  let tone: HeroTone
  let HeroIcon: typeof IconClock
  let kicker: string
  let title: string
  let subtitle: string
  let ringDays = 0
  let ringCaption = ""
  let ringPct: number
  let lock = false
  let primary: { label: string; onClick: () => void } | null = null

  if (state.status === "trialing") {
    const d = daysUntil(state.trialEndsAt ?? state.renewalDate)
    tone = "base"
    HeroIcon = IconClock
    kicker = "Пробний період"
    title = "Безкоштовний доступ"
    subtitle = `Повний доступ до ${formatPlanDate(state.trialEndsAt ?? state.renewalDate)}`
    ringDays = d
    ringCaption = d === 1 ? "день" : "днів"
    ringPct = ((7 - d) / 7) * 100
  } else if (state.status === "past_due") {
    const d = daysUntil(state.graceUntil ?? state.renewalDate)
    tone = "destructive"
    HeroIcon = IconAlertTriangle
    kicker = "Потрібна оплата"
    title = "Оплата не пройшла"
    subtitle = `Поповніть до ${formatPlanDate(state.graceUntil ?? state.renewalDate)} — доступ поки активний`
    ringDays = d
    ringCaption = "у запасі"
    ringPct = ((3 - d) / 3) * 100
    primary = { label: "Поповнити баланс", onClick: onTopUp }
  } else if (state.status === "expired") {
    tone = "destructive"
    HeroIcon = IconLock
    lock = true
    kicker = "Підписка завершена"
    title = "Доступ закрито"
    subtitle = "Оформіть тариф, щоб відновити доступ до аналітики"
    ringPct = 100
  } else {
    const d = daysUntil(state.renewalDate)
    tone = "primary"
    HeroIcon = plan?.icon ?? IconCircleCheckFilled
    kicker = "Поточний тариф"
    title = plan?.name ?? ""
    subtitle = `$${money(total)} / ${periodLabel} · ${state.autoRenew ? "продовження" : "завершиться"} ${formatPlanDate(state.renewalDate)}`
    ringDays = d
    ringCaption = "до оплати"
    ringPct = (1 - remainingFraction(state.period, state.renewalDate)) * 100
  }

  const t = HERO_TONE[tone]

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                t.iconBox
              )}
            >
              <HeroIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {kicker}
                </span>
                {state.status !== "trialing" && <StatusBadge state={state} />}
              </div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <BigRing pct={ringPct} ringClass={t.ring}>
            {lock ? (
              <IconLock className="size-6 text-muted-foreground" />
            ) : (
              <>
                <span className="text-2xl font-extrabold tabular-nums">
                  {ringDays}
                </span>
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {ringCaption}
                </span>
              </>
            )}
          </BigRing>
        </div>

        {state.status === "active" && scheduled && (
          <NoticeStrip
            icon={IconCalendarEvent}
            text={`З ${formatPlanDate(state.renewalDate)} тариф зміниться на ${scheduled.name}. Списань зараз немає.`}
            action={
              <Button size="sm" variant="outline" onClick={onCancelScheduled}>
                Скасувати зміну
              </Button>
            }
          />
        )}
        {state.status === "active" && !state.autoRenew && (
          <NoticeStrip
            icon={IconCalendarEvent}
            text={`Автопродовження вимкнено — підписка завершиться ${formatPlanDate(state.renewalDate)}.`}
            action={
              <Button size="sm" onClick={onResume} className="gap-1.5">
                <IconRefresh className="size-4" />
                Увімкнути
              </Button>
            }
          />
        )}

        {state.status === "active" ? (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2.5">
              <Switch
                checked={state.autoRenew}
                onCheckedChange={onToggleAutoRenew}
              />
              <span className="text-sm text-muted-foreground">
                Автопродовження
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {state.period === "monthly" && (
                <Button
                  variant="secondary"
                  className="gap-1.5"
                  onClick={onSwitchYearly}
                >
                  <IconRosetteDiscountCheck className="size-4 text-emerald-500" />
                  Оформити на рік
                </Button>
              )}
              <Button
                variant="secondary"
                className="gap-1.5"
                onClick={onManageAddons}
              >
                <IconSparkles className="size-4 text-lime-500" />
                Додатки
              </Button>
            </div>
          </div>
        ) : (
          primary && (
            <div className="border-t border-border/60 pt-4">
              <Button onClick={primary.onClick} className="gap-1.5 font-semibold">
                {primary.label}
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function StatusBadge({ state }: { state: SubState }) {
  const map = {
    active: { label: "Активний", cls: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
    trialing: { label: "Тріал", cls: "bg-muted text-muted-foreground" },
    past_due: { label: "Прострочено", cls: "bg-destructive/10 text-destructive" },
    expired: { label: "Завершено", cls: "bg-destructive/10 text-destructive" },
  }[state.status]
  return (
    <Badge variant="outline" className={cn("border-transparent", map.cls)}>
      {map.label}
    </Badge>
  )
}

// ---------------------------------------------------------- current plan (active)
function UsageRing({ pct }: { pct: number }) {
  const r = 7
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, pct) / 100)
  const tone =
    pct >= 100
      ? "stroke-destructive"
      : pct >= 80
        ? "stroke-amber-500"
        : "stroke-foreground"
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 -rotate-90">
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="2.5" className="stroke-muted" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={tone}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

function UsageTable({ state }: { state: SubState }) {
  const plan = planById(state.planId)
  if (!plan) return null
  return (
    <Card size="sm" className="p-2">
      <Table>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 rounded-l-lg bg-muted/60 px-3 text-muted-foreground">
              Ресурс
            </TableHead>
            <TableHead className="h-10 rounded-r-lg bg-muted/60 px-3 text-right text-muted-foreground">
              Використання
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PLAN_FEATURES.map((feature) => {
            const limit = plan.limits[feature.key] + (state.addons[feature.key] ?? 0)
            const used = state.usage[feature.key]
            const unavailable = limit <= 0
            const pct = limit > 0 ? (used / limit) * 100 : 0
            return (
              <TableRow
                key={feature.key}
                className={cn("hover:bg-transparent", unavailable && "opacity-50")}
              >
                <TableCell className="px-3 py-3">
                  <span className="flex items-center gap-2.5 font-medium">
                    {unavailable ? (
                      <span className="flex size-5 shrink-0 items-center justify-center">
                        <IconLock className="size-4 text-muted-foreground" />
                      </span>
                    ) : (
                      <UsageRing pct={pct} />
                    )}
                    {feature.label}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                  {unavailable ? "Недоступно" : `${used} / ${limit}`}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

function CurrentPlanCard({
  state,
  onToggleAutoRenew,
  onSwitchYearly,
  onManageAddons,
}: {
  state: SubState
  onToggleAutoRenew: (v: boolean) => void
  onSwitchYearly: () => void
  onManageAddons: () => void
}) {
  const plan = planById(state.planId)
  if (!plan) return null
  const total = cycleTotal(state.planId, state.period, state.addons)
  const periodLabel = state.period === "yearly" ? "рік" : "місяць"
  const access = hasAccess(state)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Поточний тариф
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
              <plan.icon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{plan.name}</span>
                <StatusBadge state={state} />
                <Badge
                  variant="outline"
                  className="border-transparent bg-background/70 text-[11px] text-muted-foreground"
                >
                  {state.period === "yearly" ? "річний" : "місячний"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {access ? "Доступ до продукту активний" : "Доступ призупинено"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.period === "monthly" && state.status === "active" && (
              <Button variant="secondary" className="gap-1.5" onClick={onSwitchYearly}>
                <IconRosetteDiscountCheck className="size-4 text-emerald-500" />
                Оформити на рік
              </Button>
            )}
            <Button variant="secondary" className="gap-1.5" onClick={onManageAddons}>
              <IconSparkles className="size-4 text-lime-500" />
              Додатки
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              {state.status === "past_due" ? "Прострочена оплата" : "Наступна оплата"}
            </span>
            <span className="font-medium">{formatPlanDate(state.renewalDate)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Сума за період</span>
            <span className="font-semibold tabular-nums">
              ${money(total)}{" "}
              <span className="font-normal text-muted-foreground">/ {periodLabel}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Автопродовження</div>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  state.autoRenew
                    ? "text-muted-foreground"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {!state.autoRenew && (
                  <IconAlertTriangle className="size-3.5 shrink-0" />
                )}
                {state.autoRenew
                  ? "Тариф продовжиться автоматично"
                  : `Вимкнено — завершиться ${formatPlanDate(state.renewalDate)}`}
              </div>
            </div>
            <Switch checked={state.autoRenew} onCheckedChange={onToggleAutoRenew} />
          </div>
        </div>

        <UsageTable state={state} />
      </CardContent>
    </Card>
  )
}

// --------------------------------------------------------- switch-to-yearly
function SwitchYearlyDialog({
  state,
  open,
  onOpenChange,
  onConfirm,
}: {
  state: SubState
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
}) {
  const yearly = cycleTotal(state.planId, "yearly", state.addons)
  const monthly = monthlyTotal(state.planId, state.addons)
  const credit = monthly * remainingFraction(state.period, state.renewalDate)
  const chargeNow = Math.max(0, yearly - credit)
  const saved = monthly * 12 - yearly

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <IconRosetteDiscountCheck className="size-5 text-emerald-500" />
            Перехід на річну оплату
          </DialogTitle>
          <DialogDescription className="text-xs">
            Діє одразу. Економія ${money(saved)} на рік порівняно з помісячною оплатою.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 p-5">
          <Line label="Річна вартість" value={`$${money(yearly)}`} />
          <Line
            label="Зараховуємо залишок місяця"
            value={`−$${money(credit)}`}
            muted
          />
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Доплата зараз</span>
            <span className="text-2xl font-extrabold tracking-tight tabular-nums">
              ${money(chargeNow)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Далі — ${money(yearly)} / рік. Зворотний перехід на місячну оплату
            недоступний до кінця оплаченого року.
          </p>
          <div className="mt-1 flex flex-col gap-2">
            <Button
              className="h-11 gap-1.5 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
              onClick={onConfirm}
            >
              <IconArrowUpRight className="size-4" />
              Оформити за ${money(chargeNow)}
            </Button>
            <Button
              variant="ghost"
              className="h-9 rounded-xl text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Скасувати
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------- manage addons
function ManageAddonsDialog({
  state,
  open,
  onOpenChange,
  onConfirm,
}: {
  state: SubState
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (next: Partial<Record<PlanFeatureKey, number>>) => void
}) {
  const plan = planById(state.planId)
  const [draft, setDraft] = useState<Partial<Record<PlanFeatureKey, number>>>(
    state.addons
  )
  // Reset the draft whenever the dialog is (re)opened for a state.
  const [seen, setSeen] = useState(open)
  if (open !== seen) {
    setSeen(open)
    if (open) setDraft(state.addons)
  }
  if (!plan) return null

  const mult = state.period === "yearly" ? YEARLY_MULTIPLIER : 1
  const fraction = remainingFraction(state.period, state.renewalDate)
  const periodLabel = state.period === "yearly" ? "рік" : "місяць"

  let increaseNow = 0
  let hasDecrease = false
  for (const f of PLAN_FEATURES) {
    const before = state.addons[f.key] ?? 0
    const after = draft[f.key] ?? 0
    const unit = PLAN_ADDONS[f.key].pricePerUnit * mult
    if (after > before) increaseNow += (after - before) * unit * fraction
    if (after < before) hasDecrease = true
  }

  const setQty = (key: PlanFeatureKey, next: number) => {
    const max = PLAN_ADDONS[key].max
    setDraft((prev) => ({ ...prev, [key]: Math.max(0, Math.min(max, next)) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <IconSparkles className="size-5 text-lime-500" />
            Додатки до тарифу {plan.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Збільшення — одразу з пропорційною доплатою. Зменшення — з наступного
            періоду, без повернень.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 p-5">
          {PLAN_FEATURES.map((feature) => {
            const config = PLAN_ADDONS[feature.key]
            const qty = draft[feature.key] ?? 0
            const baseLimit = plan.limits[feature.key]
            return (
              <div
                key={feature.key}
                className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <feature.icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{feature.label}</div>
                  <div className="text-xs text-muted-foreground">
                    +${money(config.pricePerUnit * mult)} / {periodLabel}
                    {qty > 0 && (
                      <>
                        {" · разом "}
                        <span className="font-semibold text-foreground">
                          {baseLimit + qty}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={qty === 0}
                    onClick={() => setQty(feature.key, qty - 1)}
                    aria-label="Зменшити"
                  >
                    <IconMinus className="size-4" />
                  </Button>
                  <span className="w-5 text-center text-sm font-bold tabular-nums">
                    {qty}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={qty >= config.max}
                    onClick={() => setQty(feature.key, qty + 1)}
                    aria-label="Збільшити"
                  >
                    <IconPlus className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}

          <Separator className="my-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Доплата зараз</span>
            <span className="text-lg font-extrabold tabular-nums">
              ${money(increaseNow)}
            </span>
          </div>
          {hasDecrease && (
            <p className="text-xs text-muted-foreground">
              Зменшення набуде чинності {formatPlanDate(state.renewalDate)} — зараз
              нічого не повертаємо.
            </p>
          )}
          <div className="mt-1 flex flex-col gap-2">
            <Button
              className="h-11 gap-1.5 rounded-xl font-semibold"
              onClick={() => onConfirm(draft)}
            >
              {increaseNow > 0 ? `Підтвердити за $${money(increaseNow)}` : "Зберегти"}
            </Button>
            <Button
              variant="ghost"
              className="h-9 rounded-xl text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Скасувати
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Line({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", muted ? "text-muted-foreground" : "font-semibold")}>
        {value}
      </span>
    </div>
  )
}

// ----------------------------------------------------- cancel scheduled downgrade
function CancelDowngradeDialog({
  open,
  onOpenChange,
  currentPlan,
  scheduled,
  renewalLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentPlan: ReturnType<typeof planById>
  scheduled: ReturnType<typeof planById>
  renewalLabel: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCalendarEvent className="size-5 text-muted-foreground" />
            Скасувати заплановану зміну?
          </DialogTitle>
          <DialogDescription>
            {scheduled
              ? `Перехід на ${scheduled.name} (${renewalLabel}) буде скасовано. Тариф ${currentPlan?.name ?? ""} залишиться активним і продовжиться як зазвичай.`
              : "Запланований перехід буде скасовано."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Залишити зміну
          </Button>
          <Button onClick={onConfirm}>Так, скасувати</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------- subscription
// Embedded in the Settings → Підписка section. The floating scenario switcher
// is fixed-positioned, so it floats regardless of where this is mounted.
export function SubscriptionManager() {
  const { scenarioId, state, setState, pickScenario } = useSubscription()
  const [billingPeriod, setBillingPeriod] = useState<Period>("monthly")
  const [yearlyOpen, setYearlyOpen] = useState(false)
  const [addonsOpen, setAddonsOpen] = useState(false)
  const [cancelDowngradeOpen, setCancelDowngradeOpen] = useState(false)

  const paid = hasPaidPlan(state)
  const scheduled = state.scheduledPlanId
    ? planById(state.scheduledPlanId)
    : undefined
  const subscription: Subscription | undefined = paid
    ? {
        planId: state.planId,
        period: state.period,
        renewalDate: state.renewalDate,
        usage: state.usage,
        addons: state.addons,
      }
    : undefined

  const changeTitle =
    state.status === "trialing"
      ? "Оберіть тариф"
      : state.status === "expired"
        ? "Відновіть доступ"
        : "Змінити тариф"

  return (
    <div className="flex flex-col gap-4">
      {state.status === "active" ? (
        <>
          {scheduled && (
            <NoticeStrip
              icon={IconCalendarEvent}
              text={`З ${formatPlanDate(state.renewalDate)} тариф зміниться на ${scheduled.name}. Списань зараз немає.`}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelDowngradeOpen(true)}
                >
                  Скасувати зміну
                </Button>
              }
            />
          )}
          <CurrentPlanCard
            state={state}
            onToggleAutoRenew={(v) => setState((s) => ({ ...s, autoRenew: v }))}
            onSwitchYearly={() => setYearlyOpen(true)}
            onManageAddons={() => setAddonsOpen(true)}
          />
        </>
      ) : (
        <>
          <SubscriptionHero
            state={state}
            onResume={() => setState((s) => ({ ...s, autoRenew: true }))}
            onTopUp={() =>
              setState((s) => ({
                ...s,
                status: "active",
                graceUntil: undefined,
                renewalDate: new Date(Date.now() + 30 * 86_400_000),
              }))
            }
            onCancelScheduled={() =>
              setState((s) => ({ ...s, scheduledPlanId: undefined }))
            }
            onToggleAutoRenew={(v) => setState((s) => ({ ...s, autoRenew: v }))}
            onSwitchYearly={() => setYearlyOpen(true)}
            onManageAddons={() => setAddonsOpen(true)}
          />
          {state.status === "past_due" && <UsageTable state={state} />}
        </>
      )}

      <Card className="scroll-mt-4">
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            {changeTitle}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {paid
              ? "Дорожчий тариф — одразу з доплатою; дешевший — з наступного періоду"
              : "Більше акаунтів, учасників команди та інтеграцій на платних тарифах"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-center">
            <BillingPeriodToggle
              value={billingPeriod}
              onChange={setBillingPeriod}
            />
          </div>
          <PricingGrid
            currentPlanId={paid ? state.planId : "free"}
            subscription={subscription}
            usage={state.usage}
            allowFreeCheckout={!paid}
            billingPeriod={billingPeriod}
            size="sm"
          />
        </CardContent>
      </Card>

      <CancelDowngradeDialog
        open={cancelDowngradeOpen}
        onOpenChange={setCancelDowngradeOpen}
        currentPlan={planById(state.planId)}
        scheduled={scheduled}
        renewalLabel={formatPlanDate(state.renewalDate)}
        onConfirm={() => {
          setState((s) => ({ ...s, scheduledPlanId: undefined }))
          setCancelDowngradeOpen(false)
        }}
      />

      <SwitchYearlyDialog
        state={state}
        open={yearlyOpen}
        onOpenChange={setYearlyOpen}
        onConfirm={() => {
          setState((s) => ({
            ...s,
            period: "yearly",
            renewalDate: new Date(Date.now() + 365 * 86_400_000),
          }))
          setYearlyOpen(false)
        }}
      />
      <ManageAddonsDialog
        state={state}
        open={addonsOpen}
        onOpenChange={setAddonsOpen}
        onConfirm={(next) => {
          setState((s) => ({ ...s, addons: next }))
          setAddonsOpen(false)
        }}
      />

      <FloatingScenarioSwitcher active={scenarioId} onPick={pickScenario} />
    </div>
  )
}
