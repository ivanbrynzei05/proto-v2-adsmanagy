import {
  IconAd,
  IconCreditCard,
  IconDatabase,
  IconDeviceDesktop,
  IconHeadset,
  IconMoon,
  IconPlugConnected,
  IconSettings,
  IconSun,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

import { useIntegrations } from "@/components/integrations-provider"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSubscription } from "@/features/billing/subscription-context"
import { AdAccountsStep } from "@/features/integrations/ad-accounts-step"
import { CallCentersStep } from "@/features/integrations/call-centers-step"
import { CrmStep } from "@/features/integrations/crm-step"
import { SubscriptionManager } from "@/pages/subscription/subscription"
import { cn } from "@/lib/utils"

type SectionId = "general" | "sources" | "billing" | "plans"

const SECTIONS: {
  id: SectionId
  label: string
  icon: Icon
}[] = [
  { id: "general", label: "Загальне", icon: IconSettings },
  { id: "sources", label: "Джерела даних", icon: IconPlugConnected },
  { id: "plans", label: "Підписка", icon: IconCreditCard },
  { id: "billing", label: "Баланс", icon: IconWallet },
]

// Map a `?section=` query value (e.g. from the header billing chip) onto a tab.
function sectionFromParam(value: string | null): SectionId {
  if (
    value === "sources" ||
    value === "general" ||
    value === "billing" ||
    value === "plans"
  ) {
    return value
  }
  return "general"
}

function Row({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="flex shrink-0 justify-end">{children}</div>
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
        <CardDescription className="text-xs">
          Профіль акаунту та налаштування вигляду
        </CardDescription>
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
        <Row label="Тема" description="Світла, темна або системна">
          <ThemeSwitch />
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

type SourceTab = "ads" | "crm" | "callCenters"

function SourcesSection() {
  const {
    connectedAccounts,
    setConnectedAccounts,
    connectedCrms,
    setConnectedCrms,
    callCenters,
    setCallCenters,
  } = useIntegrations()
  const [tab, setTab] = useState<SourceTab>("ads")

  const tabs: {
    id: SourceTab
    icon: Icon
    title: string
    description: string
    count: number
  }[] = [
    {
      id: "ads",
      icon: IconAd,
      title: "Рекламні кабінети",
      description:
        "Підключіть рекламні платформи, щоб бачити витрати та ROI у аналітиці",
      count: Object.values(connectedAccounts).reduce(
        (sum, accounts) => sum + (accounts?.length ?? 0),
        0
      ),
    },
    {
      id: "crm",
      icon: IconDatabase,
      title: "CRM",
      description: "Дані про ліди, апруви та дохід надходять із CRM-системи",
      count: connectedCrms.length,
    },
    {
      id: "callCenters",
      icon: IconHeadset,
      title: "Колцентри",
      description: "Умови оплати колцентрів для розрахунку маржі та допродажів",
      count: callCenters.length,
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
        <div>
          <CardTitle className="text-[15px] font-bold tracking-tight">
            {current.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {current.description}
          </CardDescription>
        </div>
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
        {tab === "callCenters" && (
          <CallCentersStep
            callCenters={callCenters}
            setCallCenters={setCallCenters}
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
        <CardDescription className="text-xs">
          З балансу списуються тариф і додатки — поповнюйте для безперебійної
          роботи аналітики
        </CardDescription>
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
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((section) => {
            const isActive = section.id === active
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-sm transition-colors [&>svg]:size-4 [&>svg]:shrink-0",
                  isActive
                    ? "bg-card font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-card/60"
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
          {active === "sources" && <SourcesSection />}
          {active === "plans" && <SubscriptionManager />}
          {active === "billing" && <BalanceCard />}
        </div>
      </div>
    </div>
  )
}
