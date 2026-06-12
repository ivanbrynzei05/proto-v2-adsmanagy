/* eslint-disable react-refresh/only-export-components */
import {
  IconAd,
  IconArrowUpRight,
  IconBolt,
  IconCheck,
  IconCrown,
  IconDatabase,
  IconHeadset,
  IconRocket,
  IconSparkles,
  IconUsers,
  IconX,
  type Icon,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const PLAN_FEATURES = [
  { key: "adAccounts", label: "Рекламні акаунти", icon: IconAd },
  { key: "members", label: "Учасники команди", icon: IconUsers },
  { key: "crm", label: "CRM", icon: IconDatabase },
  { key: "callCenters", label: "Колцентри", icon: IconHeadset },
] as const

export type PlanFeatureKey = (typeof PLAN_FEATURES)[number]["key"]

type PlanTheme = {
  card: string
  iconBox: string
  value: string
  button: string
  badge?: string
  badgeLabel?: string
}

// visual rank: plain free → cool blue → violet → premium gold
const PLAN_THEMES: Record<string, PlanTheme> = {
  free: {
    card: "bg-card",
    iconBox: "bg-muted text-muted-foreground",
    value: "",
    button: "",
  },
  solo: {
    card: "border-sky-300/70 bg-gradient-to-b from-sky-50 to-card dark:border-sky-400/30 dark:from-sky-950/40 dark:to-card",
    iconBox: "bg-sky-500 text-white",
    value: "text-sky-700 dark:text-sky-300",
    button: "bg-sky-600 text-white hover:bg-sky-600/90",
  },
  pro: {
    card: "border-violet-400/70 bg-gradient-to-b from-violet-50 to-card shadow-sm dark:border-violet-400/40 dark:from-violet-950/40 dark:to-card",
    iconBox: "bg-violet-600 text-white",
    value: "text-violet-700 dark:text-violet-300",
    button: "bg-violet-600 text-white hover:bg-violet-600/90",
    badge: "bg-violet-600 text-white",
    badgeLabel: "Популярний",
  },
  max: {
    card: "border-amber-400/80 bg-gradient-to-b from-amber-50 to-card shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_12px_36px_-14px_rgba(245,158,11,0.55)] dark:border-amber-400/50 dark:from-amber-950/40 dark:to-card",
    iconBox: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    value: "text-amber-700 dark:text-amber-300",
    button:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-500/90 hover:to-amber-600/90",
    badge: "bg-gradient-to-r from-amber-400 to-amber-600 text-white",
    badgeLabel: "Максимум",
  },
}

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Щоб спробувати аналітику",
    icon: IconRocket,
    price: "Free",
    period: "7 днів",
    limits: { adAccounts: 1, members: 0, crm: 1, callCenters: 1 },
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "Для соло баєра",
    icon: IconBolt,
    price: "$19",
    period: "місяць",
    note: "Можна розширити кількість акаунтів",
    limits: { adAccounts: 5, members: 0, crm: 1, callCenters: 1 },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Для невеликої команди",
    icon: IconSparkles,
    price: "$39",
    period: "місяць",
    limits: { adAccounts: 30, members: 3, crm: 2, callCenters: 2 },
  },
  {
    id: "max",
    name: "Maximum",
    tagline: "Для великої команди",
    icon: IconCrown,
    price: "$79",
    period: "місяць",
    limits: { adAccounts: 70, members: 10, crm: 5, callCenters: 5 },
  },
] satisfies {
  id: string
  name: string
  tagline: string
  icon: Icon
  price: string
  period: string
  note?: string
  limits: Record<PlanFeatureKey, number>
}[]

export function PricingGrid({
  currentPlanId = "free",
  className,
}: {
  currentPlanId?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {PRICING_PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlanId
        const theme = PLAN_THEMES[plan.id]
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col gap-4 rounded-xl border p-4",
              theme.card
            )}
          >
            {theme.badge && (
              <Badge
                className={cn(
                  "absolute -top-2.5 right-4 gap-1 border-transparent",
                  theme.badge
                )}
              >
                <plan.icon className="size-3" />
                {theme.badgeLabel}
              </Badge>
            )}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  theme.iconBox
                )}
              >
                <plan.icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </div>
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight">
                {plan.price}
              </span>
              <span className="pb-1 text-xs font-medium text-muted-foreground">
                / {plan.period}
              </span>
            </div>
            <div className="flex flex-col gap-3 border-t pt-4">
              {PLAN_FEATURES.map((feature) => {
                const value = plan.limits[feature.key]
                const available = value > 0
                return (
                  <div key={feature.key} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        available
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <feature.icon className="size-4" />
                    </span>
                    <span className="flex-1 text-sm">{feature.label}</span>
                    {available ? (
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          theme.value
                        )}
                      >
                        {value}
                      </span>
                    ) : (
                      <IconX className="size-4 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
              {plan.note && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <IconArrowUpRight className="mt-px size-3.5 shrink-0" />
                  {plan.note}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              disabled={isCurrent}
              className={cn("mt-auto w-full gap-1.5", theme.button)}
            >
              {isCurrent ? (
                <>
                  <IconCheck className="size-4" />
                  Поточний тариф
                </>
              ) : (
                <>
                  <plan.icon className="size-4" />
                  Обрати {plan.name}
                </>
              )}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
