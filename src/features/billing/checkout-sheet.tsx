/* eslint-disable react-refresh/only-export-components */
import {
  IconAlertTriangle,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarEvent,
  IconCheck,
  IconCircleCheckFilled,
  IconClock,
  IconDiscount2,
  IconInfoCircle,
  IconMinus,
  IconPlus,
  IconSparkles,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  getPlanPrice,
  PLAN_ADDONS,
  PLAN_FEATURES,
  PLAN_THEMES,
  PRICING_PLANS,
  YEARLY_DISCOUNT_PERCENT,
  YEARLY_MULTIPLIER,
  type PlanFeatureKey,
} from "@/features/billing/plans"
import { cn } from "@/lib/utils"

// Account balance the plan + add-ons are charged against. Mirrors the value the
// header/billing section show in this prototype.
const BALANCE = 85

type Plan = (typeof PRICING_PLANS)[number]
type Period = "monthly" | "yearly"

// The user's active subscription, supplied by whoever opens the checkout (e.g.
// the settings page). Absent → the visitor has no paid plan yet, so every
// purchase is a fresh "new" subscription.
export type Subscription = {
  planId: string
  period: Period
  // Date the current period ends / next charge happens.
  renewalDate: Date
  // How much of each limit is currently in use (drives downgrade fit checks).
  usage: Record<PlanFeatureKey, number>
  // Per-feature add-ons already bought on top of the plan.
  addons: Partial<Record<PlanFeatureKey, number>>
}

type CheckoutMode = "new" | "upgrade" | "downgrade"

type AddonQty = Record<PlanFeatureKey, number>

const EMPTY_ADDONS: AddonQty = {
  adAccounts: 0,
  members: 0,
  crm: 0,
  callCenters: 0,
}

const MS_PER_DAY = 86_400_000

const MONTHS_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
]

export function formatPlanDate(date: Date) {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`
}

function formatMoney(value: number) {
  // Whole numbers stay clean; fractional values keep two decimals.
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

// How far into the current cycle we are: cycle length, days still unused and
// the unused fraction we prorate an upgrade against.
function getProration(period: Period, renewalDate: Date) {
  const now = new Date()
  const periodStart = new Date(renewalDate)
  if (period === "yearly") {
    periodStart.setFullYear(periodStart.getFullYear() - 1)
  } else {
    periodStart.setMonth(periodStart.getMonth() - 1)
  }
  const cycleDays = Math.max(
    1,
    Math.round((renewalDate.getTime() - periodStart.getTime()) / MS_PER_DAY)
  )
  const remainingDays = Math.min(
    cycleDays,
    Math.max(0, Math.ceil((renewalDate.getTime() - now.getTime()) / MS_PER_DAY))
  )
  return { cycleDays, remainingDays, fraction: remainingDays / cycleDays }
}

// new (no paid plan / same plan) | upgrade (pricier) | downgrade (cheaper or equal).
export function getCheckoutMode(
  plan: Plan,
  subscription?: Subscription
): CheckoutMode {
  const current =
    subscription && subscription.planId !== "free"
      ? PRICING_PLANS.find((p) => p.id === subscription.planId)
      : undefined
  if (!current || current.id === plan.id) return "new"
  return getPlanPrice(plan, "monthly") > getPlanPrice(current, "monthly")
    ? "upgrade"
    : "downgrade"
}

export function CheckoutSheet({
  planId,
  subscription,
  onOpenChange,
  onComplete,
}: {
  // null → closed. A non-null paid plan id opens the panel.
  planId: string | null
  subscription?: Subscription
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}) {
  // Retain the plan while the sheet animates closed (planId goes null first).
  // Adjusting during render is the React-recommended alternative to an effect.
  const [activePlanId, setActivePlanId] = useState(planId)
  if (planId !== null && planId !== activePlanId) {
    setActivePlanId(planId)
  }

  const plan = PRICING_PLANS.find((p) => p.id === activePlanId)
  const open = planId !== null && !!plan
  // Free is always shown as a plain "оформлення" (demo) rather than a downgrade.
  const mode = plan
    ? plan.id === "free"
      ? "new"
      : getCheckoutMode(plan, subscription)
    : "new"

  const title =
    mode === "upgrade"
      ? `Підвищення тарифу до ${plan?.name}`
      : mode === "downgrade"
        ? `Перехід на тариф ${plan?.name}`
        : `Оформлення тарифу ${plan?.name}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] max-w-3xl gap-0 overflow-hidden p-0",
          // Clean fade only - stay centered (no slide) so the motion isn't jittery.
          "data-ending-style:translate-y-[-50%] data-starting-style:translate-y-[-50%]"
        )}
      >
        {plan && (
          <>
            <DialogHeader className="border-b p-5">
              <div className="flex items-center gap-3 pr-8">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 dark:ring-white/10",
                    PLAN_THEMES[plan.id]?.iconBox
                  )}
                >
                  <plan.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold tracking-tight">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {plan.tagline}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Keyed by plan so the form (period, add-ons, paid) resets per open. */}
            <CheckoutBody
              key={plan.id}
              plan={plan}
              mode={mode}
              subscription={subscription}
              onOpenChange={onOpenChange}
              onComplete={onComplete}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CheckoutBody({
  plan,
  mode,
  subscription,
  onOpenChange,
  onComplete,
}: {
  plan: Plan
  mode: CheckoutMode
  subscription?: Subscription
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}) {
  const currentPlan =
    subscription && mode !== "new"
      ? PRICING_PLANS.find((p) => p.id === subscription.planId)
      : undefined

  // For an existing subscription we stay on its cycle; only a brand-new
  // subscription lets the user pick monthly vs yearly here.
  const [billingPeriod, setBillingPeriod] = useState<Period>(
    mode === "new" ? "monthly" : (subscription?.period ?? "monthly")
  )
  const [addons, setAddons] = useState<AddonQty>(EMPTY_ADDONS)
  const [done, setDone] = useState(false)

  const theme = PLAN_THEMES[plan.id]
  const periodMultiplier = billingPeriod === "yearly" ? YEARLY_MULTIPLIER : 1
  const periodLabel = billingPeriod === "yearly" ? "рік" : "місяць"
  const basePrice = getPlanPrice(plan, billingPeriod)

  // "Was" price to strike through: yearly shows the month-to-month cost over a
  // year; monthly shows the plan's explicit launch original price (if any).
  const parseNum = (s?: string) => {
    const m = s?.match(/([0-9.,]+)/)
    return m ? parseFloat(m[1].replace(/,/g, "")) : 0
  }
  const originalPrice =
    billingPeriod === "yearly"
      ? getPlanPrice(plan, "monthly") * 12
      : parseNum(plan.originalPrice)
  const hasDiscount = originalPrice > basePrice

  const addonLines = PLAN_FEATURES.map((feature) => {
    const qty = addons[feature.key]
    const config = PLAN_ADDONS[feature.key]
    const unitPrice = config.pricePerUnit * periodMultiplier
    return {
      key: feature.key,
      label: feature.label,
      icon: feature.icon,
      qty,
      unitPrice,
      total: qty * unitPrice,
      config,
      baseLimit: plan.limits[feature.key],
    }
  })

  const addonsTotal = addonLines.reduce((sum, line) => sum + line.total, 0)
  const fullTotal = basePrice + addonsTotal

  // --- Upgrade proration -------------------------------------------------
  const proration =
    subscription && (mode === "upgrade" || mode === "downgrade")
      ? getProration(subscription.period, subscription.renewalDate)
      : null
  const renewalLabel = subscription
    ? formatPlanDate(subscription.renewalDate)
    : ""

  const oldCycle = currentPlan ? getPlanPrice(currentPlan, billingPeriod) : 0
  const planDiff = basePrice - oldCycle
  // Pay only for the slice of the cycle that remains, for the plan jump plus any
  // newly added add-ons.
  const upgradeDueNow = proration
    ? (planDiff + addonsTotal) * proration.fraction
    : 0
  // What the next full invoice (on the unchanged renewal date) will look like.
  const newRecurring = basePrice + addonsTotal

  // --- Downgrade fit check ----------------------------------------------
  // Current usage must fit inside the cheaper plan's included limits.
  const fitIssues =
    mode === "downgrade" && subscription
      ? PLAN_FEATURES.flatMap((feature) => {
          const used = subscription.usage[feature.key] ?? 0
          const limit = plan.limits[feature.key]
          return used > limit
            ? [{ key: feature.key, label: feature.label, used, limit }]
            : []
        })
      : []
  const blocked = fitIssues.length > 0

  // --- Money charged right now ------------------------------------------
  const chargeNow =
    mode === "downgrade" ? 0 : mode === "upgrade" ? upgradeDueNow : fullTotal
  const insufficient = chargeNow > BALANCE
  const remaining = insufficient ? 0 : BALANCE - chargeNow

  const setQty = (key: PlanFeatureKey, next: number) => {
    const max = PLAN_ADDONS[key].max
    setAddons((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(max, next)),
    }))
  }

  const visibleAddons = addonLines.filter((l) => l.qty > 0)

  if (done) {
    return (
      <SuccessBody
        mode={mode}
        plan={plan}
        currentPlan={currentPlan}
        periodLabel={periodLabel}
        chargeNow={chargeNow}
        remaining={remaining}
        newRecurring={newRecurring}
        remainingDays={proration?.remainingDays ?? 0}
        renewalLabel={renewalLabel}
        addonLines={visibleAddons}
        onDone={() => {
          onOpenChange(false)
          onComplete?.()
        }}
      />
    )
  }

  return (
    <div className="grid flex-1 sm:grid-cols-[1fr_19rem]">
      {/* Configure: change banner, period, plan, add-ons */}
      <div className="flex flex-col gap-6 p-5">
        {mode === "upgrade" && currentPlan && (
          <ChangeBanner
            tone="upgrade"
            icon={IconTrendingUp}
            title={`Підвищення з ${currentPlan.name} до ${plan.name}`}
            text="Діє одразу."
          />
        )}
        {mode === "downgrade" && currentPlan && (
          <ChangeBanner
            tone="downgrade"
            icon={IconCalendarEvent}
            title={`Перехід з ${currentPlan.name} на ${plan.name}`}
            text={`Запланується на ${renewalLabel}. До цієї дати працює ${currentPlan.name}, зараз нічого не списуємо.`}
          />
        )}

        {/* Billing period - only when starting a fresh subscription */}
        {mode === "new" && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Період оплати
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(["monthly", "yearly"] as const).map((period) => {
                const active = billingPeriod === period
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setBillingPeriod(period)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {period === "monthly" ? "На місяць" : "На рік"}
                    {period === "yearly" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <IconDiscount2 className="size-3" />
                        до {YEARLY_DISCOUNT_PERCENT}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* What the plan includes */}
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Що входить
          </p>
          <div className="flex flex-col divide-y divide-border/60 rounded-xl border bg-card px-4 shadow-sm">
            {PLAN_FEATURES.map((feature) => {
              const value = plan.limits[feature.key]
              const available = value > 0
              const used = subscription?.usage[feature.key]
              const overLimit =
                mode === "downgrade" && used !== undefined && used > value
              return (
                <div
                  key={feature.key}
                  className="flex items-center gap-2.5 py-2.5 text-sm"
                >
                  <feature.icon
                    className={cn("size-4 shrink-0", theme?.value)}
                  />
                  <span className="flex-1 text-muted-foreground">
                    {feature.label}
                  </span>
                  {/* On a downgrade, flag resources the user already exceeds. */}
                  {overLimit && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-destructive/10 text-[11px] text-destructive"
                    >
                      зараз {used}
                    </Badge>
                  )}
                  {available ? (
                    <span className="font-bold tabular-nums">{value}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Add-ons - not offered while scheduling a downgrade */}
        {mode !== "downgrade" && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <IconSparkles className="size-3.5 text-lime-500" />
              Додатки
            </p>
            <div className="flex flex-col gap-2">
              {addonLines.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <line.icon className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{line.label}</div>
                    <div className="text-xs text-muted-foreground">
                      +${formatMoney(line.unitPrice)} / {line.config.unit}
                      {line.qty > 0 && (
                        <>
                          {" · разом "}
                          <span className="font-semibold text-foreground">
                            {line.baseLimit + line.qty}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={line.qty === 0}
                      onClick={() => setQty(line.key, line.qty - 1)}
                      aria-label="Зменшити"
                    >
                      <IconMinus className="size-4" />
                    </Button>
                    <span className="w-5 text-center text-sm font-bold tabular-nums">
                      {line.qty}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={line.qty >= line.config.max}
                      onClick={() => setQty(line.key, line.qty + 1)}
                      aria-label="Збільшити"
                    >
                      <IconPlus className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order summary sidebar + CTA */}
      <div className="flex flex-col gap-3 border-t bg-muted/40 p-5 sm:border-t-0 sm:border-l">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {mode === "downgrade" ? "Підсумок" : "Замовлення"}
        </p>

        {/* Plan line - common to all modes */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            Тариф {plan.name}
            <Badge
              variant="outline"
              className="border-transparent bg-background/70 text-[11px] text-muted-foreground"
            >
              {periodLabel === "рік" ? "річний" : "місячний"}
            </Badge>
          </span>
          <span className="flex items-baseline gap-1.5">
            {hasDiscount && mode === "new" && (
              <span className="text-xs text-muted-foreground tabular-nums line-through">
                ${formatMoney(originalPrice)}
              </span>
            )}
            <span className="font-semibold tabular-nums">
              ${formatMoney(basePrice)}
            </span>
          </span>
        </div>

        {/* Add-ons (new + upgrade) */}
        {mode !== "downgrade" &&
          visibleAddons.map((line) => (
            <div
              key={line.key}
              className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <line.icon className="size-3.5" />
                {line.label} × {line.qty}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                $
                {formatMoney(
                  mode === "upgrade" && proration
                    ? line.total * proration.fraction
                    : line.total
                )}
              </span>
            </div>
          ))}

        <Separator className="bg-border/70" />

        {/* ---- NEW: pay the full price now ---- */}
        {mode === "new" && (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">До сплати</span>
              <div>
                <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                  ${formatMoney(fullTotal)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  / {periodLabel}
                </span>
              </div>
            </div>
            <Separator className="bg-border/70" />
            <BalanceRow />
            {insufficient && <TopUpNote amount={chargeNow - BALANCE} />}
            <CtaBlock onCancel={() => onOpenChange(false)}>
              <Button
                className={cn(
                  "h-11 w-full gap-1.5 rounded-xl font-semibold",
                  !insufficient &&
                    "bg-lime-500 text-white shadow-sm shadow-lime-500/30 hover:bg-lime-600 dark:bg-lime-500 dark:hover:bg-lime-600"
                )}
                onClick={() => setDone(true)}
              >
                {insufficient ? (
                  <>
                    <IconWallet className="size-4" />
                    Поповнити та оформити
                  </>
                ) : (
                  <>
                    Оформити за ${formatMoney(fullTotal)}
                    <IconArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </CtaBlock>
          </>
        )}

        {/* ---- UPGRADE: prorated top-up now, date unchanged ---- */}
        {mode === "upgrade" && proration && (
          <>
            <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Доплата зараз
                </span>
                <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                  ${formatMoney(chargeNow)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Повна ціна з {renewalLabel}</span>
              <span className="tabular-nums">
                ${formatMoney(newRecurring)} / {periodLabel}
              </span>
            </div>

            <Separator className="bg-border/70" />
            <BalanceRow />
            {insufficient && <TopUpNote amount={chargeNow - BALANCE} />}
            <CtaBlock onCancel={() => onOpenChange(false)}>
              <Button
                className={cn(
                  "h-11 w-full gap-1.5 rounded-xl font-semibold",
                  !insufficient &&
                    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700"
                )}
                onClick={() => setDone(true)}
              >
                {insufficient ? (
                  <>
                    <IconWallet className="size-4" />
                    Поповнити та підвищити
                  </>
                ) : (
                  <>
                    <IconArrowUpRight className="size-4" />
                    Підвищити за ${formatMoney(chargeNow)}
                  </>
                )}
              </Button>
            </CtaBlock>
          </>
        )}

        {/* ---- DOWNGRADE: scheduled, no charge, may be blocked ---- */}
        {mode === "downgrade" && currentPlan && (
          <>
            {blocked ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                  <IconAlertTriangle className="size-4 shrink-0" />
                  Ви не можете оформити тариф {plan.name}
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {fitIssues.map((issue) => (
                    <li
                      key={issue.key}
                      className="flex items-center justify-between gap-2 text-xs text-destructive"
                    >
                      <span>{issue.label}</span>
                      <span className="tabular-nums">
                        {issue.used} / ліміт {issue.limit}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-destructive/80">
                  Зменшіть використання або оберіть тариф вище.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <IconClock className="size-4 shrink-0" />
                    Зараз нічого не списуємо
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Перехід на {plan.name} (${formatMoney(basePrice)} /{" "}
                    {periodLabel}) активується {renewalLabel}.
                  </p>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <IconCalendarEvent className="mt-px size-3.5 shrink-0" />
                  До {renewalLabel} працює {currentPlan.name} з усіма поточними
                  можливостями.
                </div>
              </>
            )}

            <CtaBlock onCancel={() => onOpenChange(false)}>
              <Button
                disabled={blocked}
                className="h-11 w-full gap-1.5 rounded-xl font-semibold"
                onClick={() => setDone(true)}
              >
                {blocked ? (
                  "Перехід недоступний"
                ) : (
                  <>
                    <IconCalendarEvent className="size-4" />
                    Запланувати перехід
                  </>
                )}
              </Button>
            </CtaBlock>
          </>
        )}
      </div>
    </div>
  )
}

function BalanceRow() {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <IconWallet className="size-4" />
        Баланс
      </span>
      <span className="font-semibold tabular-nums">
        ${formatMoney(BALANCE)}
      </span>
    </div>
  )
}

function TopUpNote({ amount }: { amount: number }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
      <IconInfoCircle className="mt-px size-3.5 shrink-0" />
      Поповнимо баланс на ${formatMoney(amount)} і одразу спишемо.
    </p>
  )
}

function CtaBlock({
  children,
  onCancel,
}: {
  children: React.ReactNode
  onCancel: () => void
}) {
  return (
    <div className="mt-auto flex flex-col gap-2 pt-2">
      {children}
      <Button
        variant="ghost"
        className="h-9 w-full rounded-xl font-medium text-muted-foreground"
        onClick={onCancel}
      >
        Відмінити
      </Button>
    </div>
  )
}

function ChangeBanner({
  tone,
  icon: Icon,
  title,
  text,
}: {
  tone: "upgrade" | "downgrade"
  icon: (typeof PLAN_FEATURES)[number]["icon"]
  title: string
  text: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",
        tone === "upgrade"
          ? "border-amber-300/60 bg-amber-500/10"
          : "border-border bg-muted/40"
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone === "upgrade"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function SuccessBody({
  mode,
  plan,
  currentPlan,
  periodLabel,
  chargeNow,
  remaining,
  newRecurring,
  remainingDays,
  renewalLabel,
  addonLines,
  onDone,
}: {
  mode: CheckoutMode
  plan: Plan
  currentPlan?: Plan
  periodLabel: string
  chargeNow: number
  remaining: number
  newRecurring: number
  remainingDays: number
  renewalLabel: string
  addonLines: {
    key: string
    label: string
    qty: number
    icon: (typeof PLAN_FEATURES)[number]["icon"]
  }[]
  onDone: () => void
}) {
  const isDowngrade = mode === "downgrade"

  const heading = isDowngrade
    ? "Перехід заплановано"
    : mode === "upgrade"
      ? `Тариф підвищено до ${plan.name}`
      : `Тариф ${plan.name} оформлено`

  const subheading = isDowngrade
    ? `${currentPlan?.name} працює до ${renewalLabel}, далі активується ${plan.name}.`
    : mode === "upgrade"
      ? `$${formatMoney(chargeNow)} доплачено за ${remainingDays} дн. Тариф уже активний.`
      : `$${formatMoney(chargeNow)} списано з балансу. Підписка активна, дані почнуть оновлюватись одразу.`

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto p-4 pt-8 text-center">
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl",
            isDowngrade
              ? "bg-muted text-muted-foreground"
              : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {isDowngrade ? (
            <IconCalendarEvent className="size-9" />
          ) : (
            <IconCircleCheckFilled className="size-9" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
        </div>

        <div className="w-full rounded-xl border bg-muted/30 p-3 text-left">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <IconCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              Тариф {plan.name}
            </span>
            <span className="text-muted-foreground">/ {periodLabel}</span>
          </div>
          {!isDowngrade &&
            addonLines.map((line) => (
              <div
                key={line.key}
                className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <line.icon className="size-4" />
                {line.label} × {line.qty}
              </div>
            ))}
          <Separator className="my-3" />

          {isDowngrade ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <IconCalendarEvent className="size-4" />
                Активується
              </span>
              <span className="font-semibold">{renewalLabel}</span>
            </div>
          ) : (
            <>
              {mode === "upgrade" && (
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <IconCalendarEvent className="size-4" />
                    Наступна оплата
                  </span>
                  <span className="font-medium">
                    {renewalLabel} · ${formatMoney(newRecurring)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <IconWallet className="size-4" />
                  Залишок на балансі
                </span>
                <span className="font-semibold tabular-nums">
                  ${formatMoney(remaining)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto border-t p-4">
        <Button
          className="h-11 w-full gap-1.5 rounded-xl font-semibold"
          onClick={onDone}
        >
          Готово
          <IconCheck className="size-4" />
        </Button>
      </div>
    </div>
  )
}
