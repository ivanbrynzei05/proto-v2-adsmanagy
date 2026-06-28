import {
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconCalendarEvent,
  IconChevronDown,
  IconCircleCheckFilled,
  IconClock,
  IconExternalLink,
  IconLock,
  IconLogout,
  IconMoon,
  IconPlugConnected,
  IconSettings,
  IconSun,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { useNavigate } from "react-router-dom"

import {
  useDataSources,
  type DataSource,
} from "@/components/data-sources-provider"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/features/billing/subscription-context"
import { formatPlanDate } from "@/features/billing/checkout-sheet"
import { PLAN_FEATURES } from "@/features/billing/plans"
import {
  cycleTotal,
  daysUntil,
  planById,
  type SubState,
} from "@/features/billing/subscription-state"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { CONNECT_ADS_DEMO_STATES } from "@/pages/connect/demo-states"

const DATA_SOURCE_OPTIONS: { value: DataSource; label: string }[] = [
  { value: "crm", label: "CRM" },
  { value: "callCenter", label: "Колцентр" },
  { value: "adAccounts", label: "Рекламні кабінети" },
]

function DataSourcesMenu() {
  const { sources, toggleSource, noPlan, toggleNoPlan } = useDataSources()
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="secondary" className="gap-1.5">
            <IconPlugConnected className="size-4 text-muted-foreground" />
            Джерела даних
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Підключені джерела</DropdownMenuLabel>
          {DATA_SOURCE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={sources[option.value]}
              onCheckedChange={() => toggleSource(option.value)}
              closeOnClick={false}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Стан акаунту</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={noPlan}
            onCheckedChange={toggleNoPlan}
            closeOnClick={false}
          >
            Без тарифа
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Сторінка підключення (демо)</DropdownMenuLabel>
          {CONNECT_ADS_DEMO_STATES.map((state) => (
            <DropdownMenuItem
              key={state.label}
              onClick={() => navigate(state.to)}
            >
              <IconExternalLink className="text-muted-foreground" />
              {state.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Usage row for the hover card. `limit` = plan limit + add-ons.
type UsageRow = {
  icon: Icon
  label: string
  used?: number
  limit?: number
  locked?: boolean
}

function UsageBar({ row }: { row: UsageRow }) {
  const pct =
    row.limit && row.used !== undefined
      ? Math.round((row.used / row.limit) * 100)
      : 0
  const tone =
    pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"

  return (
    <div className={cn(row.locked && "opacity-50")}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <row.icon className="size-3.5 text-muted-foreground" />
          {row.label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {row.locked ? (
            <span className="flex items-center gap-1">
              <IconLock className="size-3" />
              Недоступно
            </span>
          ) : (
            `${row.used} / ${row.limit}`
          )}
        </span>
      </div>
      {!row.locked && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", tone)}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function money(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

type ChipTone = "ok" | "info" | "danger"

// Everything the chip + tooltip need, derived from the live subscription state.
function describeBilling(state: SubState) {
  const plan = planById(state.planId)
  const periodLabel = state.period === "yearly" ? "рік" : "місяць"
  const price = `$${money(cycleTotal(state.planId, state.period, state.addons))} / ${periodLabel}`

  if (state.status === "trialing") {
    const d = daysUntil(state.trialEndsAt ?? state.renewalDate)
    return {
      tone: "info" as ChipTone,
      icon: IconClock,
      chipLabel: "Тріал",
      title: "Пробний період",
      badge: { label: "Тріал", cls: "bg-muted text-muted-foreground" },
      meta: `${d} дн.`,
      footerIcon: IconClock,
      footerLabel: "Доступ до",
      footerValue: formatPlanDate(state.trialEndsAt ?? state.renewalDate),
      showUsage: true,
    }
  }
  if (state.status === "past_due") {
    return {
      tone: "danger" as ChipTone,
      icon: IconAlertTriangle,
      chipLabel: "Прострочено",
      title: "Оплата не пройшла",
      badge: {
        label: "Прострочено",
        cls: "bg-destructive/10 text-destructive",
      },
      meta: price,
      footerIcon: IconAlertTriangle,
      footerLabel: "Поповніть до",
      footerValue: formatPlanDate(state.graceUntil ?? state.renewalDate),
      showUsage: true,
    }
  }
  if (state.status === "expired") {
    return {
      tone: "danger" as ChipTone,
      icon: IconLock,
      chipLabel: "Без тарифу",
      title: "Доступ закрито",
      badge: { label: "Завершено", cls: "bg-destructive/10 text-destructive" },
      meta: "",
      footerIcon: IconArrowRight,
      footerLabel: "Оформіть тариф, щоб відновити доступ",
      footerValue: "",
      showUsage: false,
    }
  }
  return {
    tone: "ok" as ChipTone,
    icon: plan?.icon ?? IconCircleCheckFilled,
    chipLabel: plan?.name ?? "Тариф",
    title: plan?.name ?? "Тариф",
    badge: {
      label: "Активний",
      cls: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    },
    meta: price,
    footerIcon: IconCalendarEvent,
    footerLabel: state.autoRenew ? "Наступна оплата" : "Завершиться",
    footerValue: formatPlanDate(state.renewalDate),
    showUsage: true,
  }
}

const CHIP_TONE: Record<ChipTone, { icon: string; ring: string }> = {
  ok: { icon: "text-foreground", ring: "" },
  info: { icon: "text-sky-500", ring: "border-sky-500/40 bg-sky-500/5" },
  danger: {
    icon: "text-destructive",
    ring: "border-destructive/40 bg-destructive/5",
  },
}

function BillingStatus() {
  const { state, balance } = useSubscription()
  const navigate = useNavigate()
  const d = describeBilling(state)
  const Icon = d.icon
  const FooterIcon = d.footerIcon
  const tone = CHIP_TONE[d.tone]
  const plan = planById(state.planId)

  const usageRows: UsageRow[] = PLAN_FEATURES.map((feature) => {
    const limit =
      (plan?.limits[feature.key] ?? 0) + (state.addons[feature.key] ?? 0)
    return {
      icon: feature.icon,
      label: feature.label,
      used: state.usage[feature.key],
      limit,
      locked: limit <= 0,
    }
  })

  return (
    <TooltipPrimitive.Provider delay={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger
          render={
            <button
              type="button"
              onClick={() => navigate("/settings?section=plans")}
              aria-label="Керувати підпискою"
              className={cn(
                "hidden cursor-pointer items-center gap-2.5 rounded-md border bg-card px-2.5 py-1 transition-colors hover:bg-muted/60 sm:flex",
                tone.ring
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn("size-4", tone.icon)} />
                <span className="text-sm font-semibold">{d.chipLabel}</span>
              </div>
              <Separator orientation="vertical" className="h-4!" />
              <div className="flex items-center gap-1.5">
                <IconWallet className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold tabular-nums">
                  {balance} $
                </span>
              </div>
            </button>
          }
        />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner
            side="bottom"
            sideOffset={8}
            align="end"
            className="isolate z-50"
          >
            <TooltipPrimitive.Popup className="z-50 w-72 origin-(--transform-origin) overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              {/* Plan header */}
              <div className="flex items-center justify-between gap-2 border-b p-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Icon className={cn("size-4 shrink-0", tone.icon)} />
                  <span className="truncate text-sm font-bold">{d.title}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 border-transparent text-[11px]",
                      d.badge.cls
                    )}
                  >
                    {d.badge.label}
                  </Badge>
                </div>
                {d.meta && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {d.meta}
                  </span>
                )}
              </div>

              {/* Usage */}
              {d.showUsage && (
                <div className="flex flex-col gap-2.5 p-3">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Використання тарифу
                  </p>
                  {usageRows.map((row) => (
                    <UsageBar key={row.label} row={row} />
                  ))}
                </div>
              )}

              {/* State-specific footer */}
              <div className="flex items-center justify-between gap-2 border-t p-3 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <FooterIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{d.footerLabel}</span>
                </span>
                {d.footerValue && (
                  <span className="shrink-0 font-medium">{d.footerValue}</span>
                )}
              </div>

              {/* Manage hint — the whole chip is clickable */}
              <div className="flex items-center justify-end gap-1 border-t bg-muted/30 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                Керувати підпискою
                <IconArrowRight className="size-3" />
              </div>

              <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border-t border-l bg-popover data-[side=bottom]:top-1" />
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-5!" />

      <div className="ml-auto flex items-center gap-2">
        <BillingStatus />
        <DataSourcesMenu />

        <Button
          variant="secondary"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Перемкнути тему"
        >
          {isDark ? <IconSun /> : <IconMoon />}
        </Button>

        <Button variant="secondary" size="icon" aria-label="Сповіщення">
          <IconBell />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="gap-1.5 px-1.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    ОВ
                  </AvatarFallback>
                </Avatar>
                <IconChevronDown className="size-4 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <IconSettings />
              Налаштування
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <IconLogout />
              Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
