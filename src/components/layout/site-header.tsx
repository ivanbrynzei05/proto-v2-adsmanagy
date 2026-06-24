import {
  IconAd,
  IconBell,
  IconCalendarEvent,
  IconChevronDown,
  IconCrown,
  IconDatabase,
  IconExternalLink,
  IconHeadset,
  IconLock,
  IconLogout,
  IconMoon,
  IconPlugConnected,
  IconSettings,
  IconSun,
  IconUsers,
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

const TARIFF = "Pro"
const TARIFF_PRICE = "$29 / міс"
const BALANCE = "85 $"
const RENEWAL = "12 липня 2026"

// Static prototype usage for the hover card. `limit` = plan limit + add-ons.
type UsageRow = {
  icon: Icon
  label: string
  used?: number
  limit?: number
  locked?: boolean
}

const PLAN_USAGE_ROWS: UsageRow[] = [
  { icon: IconAd, label: "Рекламні акаунти", used: 22, limit: 35 },
  { icon: IconUsers, label: "Учасники команди", locked: true },
  { icon: IconDatabase, label: "CRM", used: 1, limit: 2 },
  { icon: IconHeadset, label: "Колцентри", used: 1, limit: 2 },
]

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

function BillingStatus() {
  return (
    <TooltipPrimitive.Provider delay={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger
          render={
            <div className="hidden cursor-default items-center gap-2.5 rounded-md border bg-card px-2.5 py-1 sm:flex">
              <div className="flex items-center gap-1.5">
                <IconCrown className="size-4 text-amber-500" />
                <span className="text-sm font-semibold">{TARIFF}</span>
              </div>
              <Separator orientation="vertical" className="h-4!" />
              <div className="flex items-center gap-1.5">
                <IconWallet className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold tabular-nums">
                  {BALANCE}
                </span>
              </div>
            </div>
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
                <div className="flex items-center gap-1.5">
                  <IconCrown className="size-4 text-amber-500" />
                  <span className="text-sm font-bold">{TARIFF}</span>
                  <Badge
                    variant="outline"
                    className="border-transparent bg-emerald-500/12 text-[11px] text-emerald-600 dark:text-emerald-400"
                  >
                    Активний
                  </Badge>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {TARIFF_PRICE}
                </span>
              </div>

              {/* Usage */}
              <div className="flex flex-col gap-2.5 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Використання тарифу
                </p>
                {PLAN_USAGE_ROWS.map((row) => (
                  <UsageBar key={row.label} row={row} />
                ))}
              </div>

              {/* Renewal */}
              <div className="flex items-center justify-between gap-2 border-t p-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <IconCalendarEvent className="size-3.5" />
                  Наступна оплата
                </span>
                <span className="font-medium">{RENEWAL}</span>
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
