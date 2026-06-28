// Demo state model for the subscription lifecycle. Mirrors the backend's
// subscription concepts (status, billing cycle, auto-renew, grace, scheduled
// downgrade) so the prototype can demonstrate every scenario without a server.

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconHourglassHigh,
  IconLock,
  IconPlayerPause,
  IconRosetteDiscountCheck,
  IconTrendingDown,
  type Icon,
} from "@tabler/icons-react"

import {
  getPlanPrice,
  PLAN_ADDONS,
  PLAN_FEATURES,
  PRICING_PLANS,
  YEARLY_MULTIPLIER,
  type PlanFeatureKey,
} from "@/features/billing/plans"

export type Period = "monthly" | "yearly"

// trialing / active / past_due / expired — same states the backend tracks.
export type SubStatus = "trialing" | "active" | "past_due" | "expired"

export type SubState = {
  status: SubStatus
  planId: string
  period: Period
  autoRenew: boolean
  // End of the current period / next charge date.
  renewalDate: Date
  // Trial-only: when the free trial runs out.
  trialEndsAt?: Date
  // past_due-only: access stays until this date while we retry the charge.
  graceUntil?: Date
  // Scheduled downgrade target applied at the next renewal.
  scheduledPlanId?: string
  usage: Record<PlanFeatureKey, number>
  addons: Partial<Record<PlanFeatureKey, number>>
}

const MS_PER_DAY = 86_400_000

export function addDays(days: number): Date {
  return new Date(Date.now() + days * MS_PER_DAY)
}

export function planById(id: string) {
  return PRICING_PLANS.find((p) => p.id === id)
}

// Whether the product is accessible (matches backend has_access semantics).
export function hasAccess(state: SubState): boolean {
  if (state.status === "expired") return false
  if (state.status === "past_due") {
    return !!state.graceUntil && state.graceUntil.getTime() >= Date.now()
  }
  return true // trialing (within trial) or active
}

export function hasPaidPlan(state: SubState): boolean {
  return state.status === "active" || state.status === "past_due"
}

// Monthly cost of a plan together with its add-ons.
export function monthlyTotal(
  planId: string,
  addons: Partial<Record<PlanFeatureKey, number>>
): number {
  const plan = planById(planId)
  if (!plan) return 0
  const base = getPlanPrice(plan, "monthly")
  const extra = PLAN_FEATURES.reduce(
    (sum, f) => sum + (addons[f.key] ?? 0) * PLAN_ADDONS[f.key].pricePerUnit,
    0
  )
  return base + extra
}

// Cost for one billing cycle (yearly applies the ×10 "2 months free" multiplier
// to both the plan and its add-ons).
export function cycleTotal(
  planId: string,
  period: Period,
  addons: Partial<Record<PlanFeatureKey, number>>
): number {
  const plan = planById(planId)
  if (!plan) return 0
  const mult = period === "yearly" ? YEARLY_MULTIPLIER : 1
  const base = getPlanPrice(plan, period)
  const extra = PLAN_FEATURES.reduce(
    (sum, f) =>
      sum + (addons[f.key] ?? 0) * PLAN_ADDONS[f.key].pricePerUnit * mult,
    0
  )
  return base + extra
}

// Fraction of the current period still unused — drives prorated charges.
export function remainingFraction(period: Period, renewalDate: Date): number {
  const start = new Date(renewalDate)
  if (period === "yearly") start.setFullYear(start.getFullYear() - 1)
  else start.setMonth(start.getMonth() - 1)
  const cycleDays = Math.max(
    1,
    Math.round((renewalDate.getTime() - start.getTime()) / MS_PER_DAY)
  )
  const remainingDays = Math.min(
    cycleDays,
    Math.max(0, Math.ceil((renewalDate.getTime() - Date.now()) / MS_PER_DAY))
  )
  return remainingDays / cycleDays
}

export function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / MS_PER_DAY))
}

// Trial mirrors the top plan's limits; nothing is charged.
const TRIAL_USAGE: Record<PlanFeatureKey, number> = {
  adAccounts: 3,
  members: 0,
  crm: 1,
  callCenters: 0,
}

const PRO_USAGE: Record<PlanFeatureKey, number> = {
  adAccounts: 22,
  members: 2,
  crm: 1,
  callCenters: 1,
}

const PRO_ADDONS: Partial<Record<PlanFeatureKey, number>> = {
  adAccounts: 5,
  members: 1,
}

export type ScenarioId =
  | "trialing"
  | "trial-ending"
  | "active-monthly"
  | "active-yearly"
  | "auto-renew-off"
  | "scheduled-downgrade"
  | "past-due"
  | "expired"

export type ScenarioTone = "sky" | "emerald" | "violet" | "amber" | "red"

export type Scenario = {
  id: ScenarioId
  label: string
  hint: string
  icon: Icon
  tone: ScenarioTone
  make: () => SubState
}

// Every lifecycle state the demo can showcase. `make` returns a fresh state so
// switching back to a scenario resets any interactive changes.
export const SCENARIOS: Scenario[] = [
  {
    id: "trialing",
    label: "Пробний період",
    hint: "7 днів безкоштовно, ліміти топового тарифу",
    icon: IconClock,
    tone: "sky",
    make: () => ({
      status: "trialing",
      planId: "free",
      period: "monthly",
      autoRenew: false,
      renewalDate: addDays(5),
      trialEndsAt: addDays(5),
      usage: TRIAL_USAGE,
      addons: {},
    }),
  },
  {
    id: "trial-ending",
    label: "Тріал спливає",
    hint: "Залишився 1 день — час обрати тариф",
    icon: IconHourglassHigh,
    tone: "sky",
    make: () => ({
      status: "trialing",
      planId: "free",
      period: "monthly",
      autoRenew: false,
      renewalDate: addDays(1),
      trialEndsAt: addDays(1),
      usage: TRIAL_USAGE,
      addons: {},
    }),
  },
  {
    id: "active-monthly",
    label: "Активна (місячна)",
    hint: "Pro, автопродовження, є додатки",
    icon: IconCircleCheck,
    tone: "emerald",
    make: () => ({
      status: "active",
      planId: "pro",
      period: "monthly",
      autoRenew: true,
      renewalDate: addDays(18),
      usage: PRO_USAGE,
      addons: PRO_ADDONS,
    }),
  },
  {
    id: "active-yearly",
    label: "Активна (річна)",
    hint: "Pro на рік зі знижкою",
    icon: IconRosetteDiscountCheck,
    tone: "emerald",
    make: () => ({
      status: "active",
      planId: "pro",
      period: "yearly",
      autoRenew: true,
      renewalDate: addDays(280),
      usage: PRO_USAGE,
      addons: PRO_ADDONS,
    }),
  },
  {
    id: "auto-renew-off",
    label: "Автопродовження вимкнено",
    hint: "Тариф догуляє період і завершиться",
    icon: IconPlayerPause,
    tone: "violet",
    make: () => ({
      status: "active",
      planId: "pro",
      period: "monthly",
      autoRenew: false,
      renewalDate: addDays(12),
      usage: PRO_USAGE,
      addons: PRO_ADDONS,
    }),
  },
  {
    id: "scheduled-downgrade",
    label: "Запланований даунгрейд",
    hint: "З наступного періоду — Solo",
    icon: IconTrendingDown,
    tone: "violet",
    make: () => ({
      status: "active",
      planId: "pro",
      period: "monthly",
      autoRenew: true,
      renewalDate: addDays(9),
      scheduledPlanId: "solo",
      usage: { adAccounts: 4, members: 0, crm: 1, callCenters: 1 },
      addons: {},
    }),
  },
  {
    id: "past-due",
    label: "Прострочено",
    hint: "Списання не пройшло, діє grace-період",
    icon: IconAlertTriangle,
    tone: "amber",
    make: () => ({
      status: "past_due",
      planId: "pro",
      period: "monthly",
      autoRenew: true,
      renewalDate: addDays(-1),
      graceUntil: addDays(2),
      usage: PRO_USAGE,
      addons: PRO_ADDONS,
    }),
  },
  {
    id: "expired",
    label: "Доступ закрито",
    hint: "Підписка завершилась — paywall",
    icon: IconLock,
    tone: "red",
    make: () => ({
      status: "expired",
      planId: "pro",
      period: "monthly",
      autoRenew: false,
      renewalDate: addDays(-6),
      usage: PRO_USAGE,
      addons: PRO_ADDONS,
    }),
  },
]
