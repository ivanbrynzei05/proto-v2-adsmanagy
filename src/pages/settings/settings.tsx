import {
  IconAd,
  IconCoins,
  IconCreditCard,
  IconDatabase,
  IconDeviceDesktop,
  IconMoon,
  IconPlugConnected,
  IconSettings,
  IconSun,
  IconUsers,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

import { useIntegrations } from "@/components/integrations-provider"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSubscription } from "@/features/billing/subscription-context"
import { CurrencyControls } from "@/features/currency/currency-controls"
import { ExpensesSection } from "@/features/expenses/expenses-section"
import { TeamSection } from "@/features/team/team-section"
import { AdAccountsStep } from "@/features/integrations/ad-accounts-step"
import { CrmStep } from "@/features/integrations/crm-step"
import { SubscriptionManager } from "@/pages/subscription/subscription"
import { cn } from "@/lib/utils"

type SectionId =
  | "general"
  | "team"
  | "sources"
  | "expenses"
  | "billing"
  | "plans"

const SECTIONS: {
  id: SectionId
  label: string
  icon: Icon
}[] = [
  { id: "general", label: "Загальне", icon: IconSettings },
  { id: "team", label: "Команда", icon: IconUsers },
  { id: "sources", label: "Інтеграції", icon: IconPlugConnected },
  { id: "expenses", label: "Витрати", icon: IconCoins },
  { id: "plans", label: "Підписка", icon: IconCreditCard },
  { id: "billing", label: "Баланс", icon: IconWallet },
]

// Map a `?section=` query value (e.g. from the header billing chip) onto a tab.
// "integrations" is accepted as an alias so links can use the new name while
// older `?section=sources` links keep working.
function sectionFromParam(value: string | null): SectionId {
  if (value === "integrations") return "sources"
  if (value === "users") return "team"
  if (
    value === "sources" ||
    value === "general" ||
    value === "team" ||
    value === "expenses" ||
    value === "billing" ||
    value === "plans"
  ) {
    return value
  }
  return "general"
}

function Row({
  label,
  children,
  /** lets a multi-control right side fold onto its own line on a phone */
  wrap,
}: {
  label: string
  children: React.ReactNode
  wrap?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0",
        wrap && "flex-wrap"
      )}
    >
      <div className="min-w-0 text-sm font-medium">{label}</div>
      <div className={cn("flex justify-end", wrap ? "min-w-0" : "shrink-0")}>
        {children}
      </div>
    </div>
  )
}

const THEME_OPTIONS = [
  { value: "system", icon: IconDeviceDesktop, label: "Системна" },
  { value: "light", icon: IconSun, label: "Світла" },
  { value: "dark", icon: IconMoon, label: "Темна" },
] as const

function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-1 rounded-lg border bg-muted p-1">
      {THEME_OPTIONS.map((option) => {
        const isActive = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors [&>svg]:size-4",
              isActive
                ? "bg-card text-foreground shadow-sm ring-1 ring-ring/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <option.icon />
          </button>
        )
      })}
    </div>
  )
}

const inputClass = "w-full max-w-[260px]"

function GeneralSection() {
  const [name, setName] = useState("Ваньок")
  const [email, setEmail] = useState("noutnoti@gmail.com")
  const [phone, setPhone] = useState("")

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Загальне
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col py-0">
        <Row label="Імʼя та прізвище">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Row>
        <Row label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Row>
        <Row label="Телефон">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380"
            inputMode="tel"
            className={inputClass}
          />
        </Row>
        <Row label="Тема">
          <ThemeSwitch />
        </Row>
        {/* currency, its rate source and the rate itself - one setting, so one
            row, the same way the theme sits on one */}
        <Row wrap label="Валюта">
          <CurrencyControls />
        </Row>
        <div className="flex justify-end py-3">
          <Button className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Зберегти зміни
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Call centres used to live here, but they're a cost line rather than a data
// source - they now sit under Витрати.
type SourceTab = "ads" | "crm"

function SourcesSection() {
  const {
    connectedAccounts,
    setConnectedAccounts,
    connectedCrms,
    setConnectedCrms,
  } = useIntegrations()
  const [tab, setTab] = useState<SourceTab>("ads")

  const tabs: {
    id: SourceTab
    icon: Icon
    title: string
    count: number
  }[] = [
    {
      id: "ads",
      icon: IconAd,
      title: "Рекламні кабінети",
      count: Object.values(connectedAccounts).reduce(
        (sum, accounts) => sum + (accounts?.length ?? 0),
        0
      ),
    },
    {
      id: "crm",
      icon: IconDatabase,
      title: "CRM",
      count: connectedCrms.length,
    },
  ]

  const current = tabs.find((t) => t.id === tab)!

  return (
    <Card>
      <CardHeader className="gap-3 border-b">
        <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          {tabs.map((t) => {
            const isActive = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors [&>svg]:size-4 [&>svg]:shrink-0",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon />
                <span className="hidden sm:inline">{t.title}</span>
                {t.count > 0 && (
                  <Badge
                    variant="outline"
                    className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  >
                    {t.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
        <CardTitle className="text-[15px] font-bold tracking-tight">
          {current.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tab === "ads" && (
          <AdAccountsStep
            connectedAccounts={connectedAccounts}
            setConnectedAccounts={setConnectedAccounts}
            animate={false}
          />
        )}
        {tab === "crm" && (
          <CrmStep
            connectedCrms={connectedCrms}
            setConnectedCrms={setConnectedCrms}
            animate={false}
          />
        )}
      </CardContent>
    </Card>
  )
}

function BalanceCard() {
  const { balance } = useSubscription()
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Баланс
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
            <IconWallet className="size-5 text-muted-foreground" />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight tabular-nums">
              {balance} $
            </span>
            <p className="text-xs text-muted-foreground">Доступно на балансі</p>
          </div>
        </div>
        <Button className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
          Поповнити баланс
        </Button>
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = sectionFromParam(searchParams.get("section"))
  const setActive = (id: SectionId) => {
    setSearchParams(id === "general" ? {} : { section: id }, { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Налаштування</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* section nav sits on its own panel, so the left column reads as part
            of the page furniture rather than loose buttons on the background.
            On desktop it follows the page down; on narrow screens it scrolls
            sideways inside the panel. */}
        <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-xs lg:sticky lg:top-18 lg:flex-col lg:self-start lg:overflow-visible">
          {SECTIONS.map((section) => {
            const isActive = section.id === active
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors [&>svg]:size-4 [&>svg]:shrink-0",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <section.icon />
                {section.label}
              </button>
            )
          })}
        </nav>

        <div className="min-w-0">
          {active === "general" && <GeneralSection />}
          {active === "team" && <TeamSection />}
          {active === "sources" && <SourcesSection />}
          {active === "expenses" && <ExpensesSection />}
          {active === "plans" && <SubscriptionManager />}
          {active === "billing" && <BalanceCard />}
        </div>
      </div>
    </div>
  )
}
