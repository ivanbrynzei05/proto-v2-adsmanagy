import {
  IconAdjustmentsHorizontal,
  IconCoins,
  IconCreditCard,
  IconDeviceDesktop,
  IconMoon,
  IconSettings,
  IconSun,
  IconUsers,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SectionNav } from "@/components/ui/section-nav"
import { AdvancedSection } from "@/features/advanced/advanced-section"
import { BalanceSection } from "@/features/billing/balance-section"
import { CurrencyControls } from "@/features/currency/currency-controls"
import { ExpensesSection } from "@/features/expenses/expenses-section"
import { TeamSection } from "@/features/team/team-section"
import { SubscriptionManager } from "@/pages/subscription/subscription"
import { cn } from "@/lib/utils"

type SectionId =
  | "general"
  | "team"
  | "expenses"
  | "advanced"
  | "billing"
  | "plans"

const SECTIONS: {
  id: SectionId
  label: string
  icon: Icon
}[] = [
  { id: "general", label: "Загальне", icon: IconSettings },
  { id: "expenses", label: "Витрати", icon: IconCoins },
  { id: "team", label: "Команда", icon: IconUsers },
  { id: "advanced", label: "Розширені", icon: IconAdjustmentsHorizontal },
  { id: "plans", label: "Підписка", icon: IconCreditCard },
  { id: "billing", label: "Баланс", icon: IconWallet },
]

// Map a `?section=` query value (e.g. from the header billing chip) onto a tab.
function sectionFromParam(value: string | null): SectionId {
  if (value === "users") return "team"
  if (
    value === "general" ||
    value === "team" ||
    value === "expenses" ||
    value === "advanced" ||
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
        <SectionNav items={SECTIONS} value={active} onChange={setActive} />

        <div className="min-w-0">
          {active === "general" && <GeneralSection />}
          {active === "team" && <TeamSection />}
          {active === "expenses" && <ExpensesSection />}
          {active === "advanced" && <AdvancedSection />}
          {active === "plans" && <SubscriptionManager />}
          {active === "billing" && <BalanceSection />}
        </div>
      </div>
    </div>
  )
}
