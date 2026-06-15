/* eslint-disable react-refresh/only-export-components */
import {
  IconAd,
  IconBolt,
  IconCrown,
  IconDatabase,
  IconDiscount2,
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
  glow?: string
}

// Soft gradient tints per plan; the "popular" plan gets the lime hero treatment
// and "max" gets a premium gold treatment — both get a glow + badge.
const PLAN_THEMES: Record<string, PlanTheme> = {
  free: {
    card: "border-border bg-gradient-to-b from-muted/40 to-card",
    iconBox:
      "bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-600 dark:from-neutral-700 dark:to-neutral-800 dark:text-neutral-300",
    value: "",
    // empty → falls back to the default secondary (grey) button styling
    button: "",
  },
  solo: {
    card: "border-emerald-200/70 bg-gradient-to-b from-emerald-50 to-card dark:border-emerald-400/20 dark:from-emerald-950/30 dark:to-card",
    iconBox:
      "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm shadow-emerald-500/30",
    value: "text-emerald-700 dark:text-emerald-300",
    button:
      "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
    glow: "bg-emerald-300/30",
  },
  pro: {
    card: "border-2 border-lime-300 bg-gradient-to-b from-lime-50 to-card shadow-[0_12px_40px_-15px_rgba(132,204,22,0.45)] dark:border-lime-400/40 dark:from-lime-950/30 dark:to-card dark:shadow-[0_12px_40px_-15px_rgba(132,204,22,0.2)]",
    iconBox:
      "bg-gradient-to-br from-lime-400 to-lime-600 text-white shadow-sm shadow-lime-500/30",
    value: "text-lime-700 dark:text-lime-300",
    button:
      "bg-lime-500 text-white shadow-sm shadow-lime-500/30 hover:bg-lime-600 dark:bg-lime-500 dark:text-white dark:hover:bg-lime-600",
    badge: "bg-lime-500 text-white",
    badgeLabel: "Популярний",
    glow: "bg-lime-300/40",
  },
  max: {
    card: "border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-card shadow-[0_12px_40px_-15px_rgba(245,158,11,0.4)] dark:border-amber-400/30 dark:from-amber-950/30 dark:to-card dark:shadow-[0_12px_40px_-15px_rgba(245,158,11,0.2)]",
    iconBox:
      "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-500/30",
    value: "text-amber-700 dark:text-amber-300",
    button:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700",
    badge: "bg-gradient-to-r from-amber-400 to-amber-600 text-white",
    badgeLabel: "Преміум",
    glow: "bg-amber-300/40",
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
    priceYearly: "$190",
    period: "місяць",
    note: "Можна розширити",
    limits: { adAccounts: 5, members: 0, crm: 1, callCenters: 1 },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Для невеликої команди",
    icon: IconSparkles,
    price: "$29",
    originalPrice: "$39",
    discountPercent: 26,
    priceYearly: "$290",
    period: "місяць",
    note: "Можна розширити",
    limits: { adAccounts: 30, members: 3, crm: 2, callCenters: 2 },
  },
  {
    id: "max",
    name: "Maximum",
    tagline: "Для великої команди",
    icon: IconCrown,
    price: "$79",
    priceYearly: "$790",
    period: "місяць",
    note: "Можна розширити",
    limits: { adAccounts: 70, members: 10, crm: 5, callCenters: 5 },
  },
] satisfies {
  id: string
  name: string
  tagline: string
  icon: Icon
  price: string
  originalPrice?: string
  discountPercent?: number
  priceYearly?: string
  period: string
  note?: string
  limits: Record<PlanFeatureKey, number>
}[]

export function PricingGrid({
  currentPlanId = "free",
  className,
  allowSelectCurrent = false,
  onSelect,
  billingPeriod = "monthly",
  size = "default",
  freeCurrentLabel = "Поточний тариф",
}: {
  currentPlanId?: string
  className?: string
  allowSelectCurrent?: boolean
  onSelect?: (planId: string) => void
  billingPeriod?: "monthly" | "yearly"
  size?: "default" | "sm"
  freeCurrentLabel?: string
}) {
  const compact = size === "sm"
  return (
    <div
      className={cn(
        "grid sm:grid-cols-2 xl:grid-cols-4",
        compact ? "gap-3" : "gap-4",
        className
      )}
    >
      {PRICING_PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlanId
        const theme = PLAN_THEMES[plan.id]
        const displayPrice =
          plan.id === "free"
            ? plan.price
            : billingPeriod === "yearly"
              ? // prefer explicit yearly price, fallback to monthly
                (plan.priceYearly ?? plan.price)
              : plan.price
        const displayPeriod =
          plan.id === "free"
            ? plan.period
            : billingPeriod === "yearly"
              ? "рік"
              : plan.period
        const parsePrice = (s?: string) => {
          if (!s || typeof s !== "string") return { symbol: "", value: 0 }
          const m = s.match(/^([^0-9]*)([0-9.,]+)/)
          if (!m) return { symbol: "", value: 0 }
          const symbol = m[1] ?? ""
          const num = parseFloat(m[2].replace(/,/g, ""))
          return { symbol, value: Number.isFinite(num) ? num : 0 }
        }

        // Unified discount descriptor: yearly billing shows the savings versus
        // paying month-to-month for a year; monthly billing shows an explicit
        // launch discount when a plan defines one.
        let discount: { original: string; percent: number } | null = null
        if (plan.id !== "free") {
          if (billingPeriod === "yearly") {
            const monthly = parsePrice(plan.price)
            const yearly = parsePrice(displayPrice)
            if (monthly.value > 0 && yearly.value > 0) {
              const baseline = monthly.value * 12
              const saved = Math.round(baseline - yearly.value)
              if (saved > 0) {
                discount = {
                  original: `${monthly.symbol}${baseline}`,
                  percent: Math.round((saved / baseline) * 100),
                }
              }
            }
          } else if (plan.originalPrice && plan.discountPercent) {
            discount = {
              original: plan.originalPrice,
              percent: plan.discountPercent,
            }
          }
        }

        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
              compact ? "gap-3 p-4" : "gap-4 p-5",
              theme.card
            )}
          >
            {theme.glow && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-3xl",
                  theme.glow
                )}
              />
            )}
            {theme.badge && (
              <Badge
                className={cn(
                  "absolute top-3 right-3 z-10 gap-1 border-transparent font-semibold shadow-sm",
                  theme.badge
                )}
              >
                <plan.icon className="size-3" />
                {theme.badgeLabel}
              </Badge>
            )}
            <div className="relative flex items-center gap-2.5">
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 dark:ring-white/10",
                  compact ? "size-9" : "size-10",
                  theme.iconBox
                )}
              >
                <plan.icon className={compact ? "size-4" : "size-5"} />
              </div>
              <div>
                <p className="text-sm font-bold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </div>
            </div>
            <div className="relative flex flex-col gap-1.5">
              <div className="flex items-end gap-1.5">
                <span
                  className={cn(
                    "font-extrabold tracking-tighter",
                    compact ? "text-2xl" : "text-4xl"
                  )}
                >
                  {displayPrice}
                </span>
                <span className="pb-1 text-xs font-medium text-muted-foreground">
                  / {displayPeriod}
                </span>
              </div>
              {/* reserve a row so price blocks stay aligned across plans */}
              <div className="flex h-5 items-center gap-2">
                {discount && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {discount.original}
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/12 py-0.5 pr-2 pl-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <IconDiscount2 className="size-3.5" />
                      Знижка {discount.percent}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <div
              className={cn(
                "relative flex flex-col border-t border-border/60",
                compact ? "gap-2 pt-3" : "gap-3 pt-4"
              )}
            >
              {PLAN_FEATURES.map((feature) => {
                const value = plan.limits[feature.key]
                const available = value > 0
                return (
                  <div key={feature.key} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-full",
                        compact ? "size-6" : "size-7",
                        available
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <feature.icon className={compact ? "size-3.5" : "size-4"} />
                    </span>
                    <span
                      className={cn(
                        "flex-1",
                        compact ? "text-xs" : "text-sm"
                      )}
                    >
                      {feature.label}
                    </span>
                    {available ? (
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          compact ? "text-xs" : "text-sm",
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
                <p className="text-xs text-muted-foreground">{plan.note}</p>
              )}
            </div>
            <Button
              variant="secondary"
              disabled={
                plan.id === "free" ? false : !allowSelectCurrent && isCurrent
              }
              onClick={() => onSelect?.(plan.id)}
              className={cn(
                "relative mt-auto w-full gap-1.5 rounded-xl font-semibold",
                compact ? "h-9 text-xs" : "h-11",
                theme.button
              )}
            >
              {isCurrent ? (
                plan.id === "free" ? (
                  freeCurrentLabel
                ) : (
                  "Поточний тариф"
                )
              ) : (
                <>
                  <plan.icon className={compact ? "size-3.5" : "size-4"} />
                  {plan.id === "free"
                    ? "Залишитись на безкоштовному"
                    : `Оформити ${plan.name}`}
                </>
              )}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
