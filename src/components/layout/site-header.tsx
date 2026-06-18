import {
  IconBell,
  IconChevronDown,
  IconCrown,
  IconExternalLink,
  IconLogout,
  IconMoon,
  IconPlugConnected,
  IconSettings,
  IconSun,
  IconWallet,
} from "@tabler/icons-react"
import { useNavigate } from "react-router-dom"

import {
  useDataSources,
  type DataSource,
} from "@/components/data-sources-provider"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
const BALANCE = "85 $"

function BillingStatus() {
  return (
    <div className="hidden items-center gap-2.5 rounded-md border bg-card px-2.5 py-1 sm:flex">
      <div className="flex items-center gap-1.5">
        <IconCrown className="size-4 text-amber-500" />
        <span className="text-sm font-semibold">{TARIFF}</span>
      </div>
      <Separator orientation="vertical" className="h-4!" />
      <div className="flex items-center gap-1.5">
        <IconWallet className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold tabular-nums">{BALANCE}</span>
      </div>
    </div>
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
