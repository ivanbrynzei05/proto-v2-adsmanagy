import {
  IconAd,
  IconCreditCard,
  IconDatabase,
  IconDeviceDesktop,
  IconHeadset,
  IconLock,
  IconMoon,
  IconPlugConnected,
  IconSettings,
  IconSun,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"
import { useState } from "react"

import { useIntegrations } from "@/components/integrations-provider"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { BillingPeriodToggle } from "@/components/ui/billing-period-toggle"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPlanDate } from "@/features/billing/checkout-sheet"
import {
  getPlanPrice,
  PLAN_ADDONS,
  PLAN_FEATURES,
  PRICING_PLANS,
  PricingGrid,
  type PlanFeatureKey,
} from "@/features/billing/plans"
import { AdAccountsStep } from "@/features/integrations/ad-accounts-step"
import { CallCentersStep } from "@/features/integrations/call-centers-step"
import { CrmStep } from "@/features/integrations/crm-step"
import { cn } from "@/lib/utils"

type SectionId = "general" | "sources" | "billing" | "plans"

const SECTIONS: {
  id: SectionId
  label: string
  icon: Icon
}[] = [
  { id: "general", label: "Загальне", icon: IconSettings },
  { id: "sources", label: "Джерела даних", icon: IconPlugConnected },
  { id: "billing", label: "Оплата", icon: IconWallet },
  { id: "plans", label: "Тарифи", icon: IconCreditCard },
]

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

function BillingSection() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            Баланс
          </CardTitle>
          <CardDescription className="text-xs">
            Поповнюйте баланс для безперебійної роботи аналітики
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              <IconWallet className="size-5 text-muted-foreground" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                85 $
              </span>
              <p className="text-xs text-muted-foreground">
                Доступно на балансі
              </p>
            </div>
          </div>
          <Button className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Поповнити баланс
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Prototype data for the active subscription: which plan, how much of each
// limit is in use, and which per-feature add-ons were bought on top.
const CURRENT_PLAN_ID = "pro"

// Billing cycle of the active plan and the date the current period ends. The
// checkout panel uses these to prorate upgrades and schedule downgrades.
const CURRENT_PERIOD = "monthly" as const
const RENEWAL_DATE = new Date(2026, 6, 12) // 12 липня 2026
const RENEWAL_LABEL = formatPlanDate(RENEWAL_DATE)

const PLAN_USAGE: Record<PlanFeatureKey, number> = {
  adAccounts: 22,
  members: 2,
  crm: 1,
  callCenters: 1,
}

const ACTIVE_ADDONS: Partial<Record<PlanFeatureKey, number>> = {
  adAccounts: 5,
  members: 1,
}

// Thin SVG usage ring (no fill, just an arc) - like the indicators in the ref.
function UsageRing({ pct }: { pct: number }) {
  const r = 7
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, pct) / 100)
  const tone =
    pct >= 100
      ? "stroke-destructive"
      : pct >= 80
        ? "stroke-amber-500"
        : "stroke-foreground"
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 -rotate-90">
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        className="stroke-muted"
      />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={tone}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

function CurrentPlanCard() {
  const plan = PRICING_PLANS.find((p) => p.id === CURRENT_PLAN_ID)!
  const basePrice = getPlanPrice(plan, "monthly")
  const addonsTotal = PLAN_FEATURES.reduce(
    (sum, f) =>
      sum + (ACTIVE_ADDONS[f.key] ?? 0) * PLAN_ADDONS[f.key].pricePerUnit,
    0
  )
  const total = basePrice + addonsTotal
  const [autoRenew, setAutoRenew] = useState(true)

  return (
    <>
      {/* Plan summary */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            Поточний тариф
          </CardTitle>
          <CardDescription className="text-xs">
            Ваш активний тариф і дата наступної оплати
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                <plan.icon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{plan.name}</span>
                  <Badge
                    variant="outline"
                    className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  >
                    Активний
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {plan.tagline}
                </p>
              </div>
            </div>
            <Button variant="secondary">Редагувати тариф</Button>
          </div>

          {/* Date, price and auto-renew - all in one place */}
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Наступна оплата</span>
              <span className="font-medium">{RENEWAL_LABEL}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Сума</span>
              <span className="font-semibold tabular-nums">
                ${total.toFixed(2)}{" "}
                <span className="font-normal text-muted-foreground">
                  / місяць
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">Автопродовження</div>
                <div className="text-xs text-muted-foreground">
                  {autoRenew
                    ? "Тариф продовжиться автоматично"
                    : `Тариф завершиться ${RENEWAL_LABEL}`}
                </div>
              </div>
              <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limit usage */}
      <Card size="sm" className="p-2">
        <Table>
          <TableHeader className="[&_tr]:border-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 rounded-l-lg bg-muted/60 px-3 text-muted-foreground">
                Ресурс
              </TableHead>
              <TableHead className="h-10 rounded-r-lg bg-muted/60 px-3 text-right text-muted-foreground">
                Використання
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLAN_FEATURES.map((feature) => {
              const disabled = feature.key === "members"
              const limit =
                plan.limits[feature.key] + (ACTIVE_ADDONS[feature.key] ?? 0)
              const used = PLAN_USAGE[feature.key]
              const pct = limit > 0 ? (used / limit) * 100 : 0
              return (
                <TableRow
                  key={feature.key}
                  className={cn(
                    "hover:bg-transparent",
                    disabled && "opacity-50"
                  )}
                >
                  <TableCell className="px-3 py-3">
                    <span className="flex items-center gap-2.5 font-medium">
                      {disabled ? (
                        <span className="flex size-5 shrink-0 items-center justify-center">
                          <IconLock className="size-4 text-muted-foreground" />
                        </span>
                      ) : (
                        <UsageRing pct={pct} />
                      )}
                      {feature.label}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                    {disabled ? "Недоступно" : `${used} / ${limit}`}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

function PlansSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  )
  return (
    <div className="flex flex-col gap-4">
      <CurrentPlanCard />
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            Змінити тариф
          </CardTitle>
          <CardDescription className="text-xs">
            Більше акаунтів, учасників команди та інтеграцій на платних тарифах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-center">
            <BillingPeriodToggle
              value={billingPeriod}
              onChange={setBillingPeriod}
            />
          </div>
          <PricingGrid
            currentPlanId={CURRENT_PLAN_ID}
            subscription={{
              planId: CURRENT_PLAN_ID,
              period: CURRENT_PERIOD,
              renewalDate: RENEWAL_DATE,
              usage: PLAN_USAGE,
              addons: ACTIVE_ADDONS,
            }}
            allowFreeCheckout
            billingPeriod={billingPeriod}
            size="sm"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  const [active, setActive] = useState<SectionId>("general")

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
          {active === "billing" && <BillingSection />}
          {active === "plans" && <PlansSection />}
        </div>
      </div>
    </div>
  )
}
