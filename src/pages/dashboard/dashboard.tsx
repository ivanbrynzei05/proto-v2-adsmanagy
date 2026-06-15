import {
  IconArrowDownRight,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendar,
  IconChartPie,
  IconChevronDown,
  IconCircleCheck,
  IconCoin,
  IconCrown,
  IconDatabase,
  IconHeadset,
  IconLock,
  IconTarget,
  IconTrendingUp,
  IconUserPlus,
  IconUsers,
  IconX,
  type Icon,
} from "@tabler/icons-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import sideStepsImage from "@/assets/side_steps.png"
import { useDataSources } from "@/components/data-sources-provider"
import { useIntegrations } from "@/components/integrations-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PLAN_FEATURES, PricingGrid } from "@/features/billing/plans"
import { ONBOARDING_STEPS } from "@/pages/onboarding/onboarding"
import { cn } from "@/lib/utils"
import {
  avatarColor,
  BUYERS,
  CALL_CENTERS,
  fmtMoney,
  fmtNum,
  KPIS,
  LEADS_BY_DAY,
  PRODUCTS,
  type KpiKey,
} from "./data"

const KPI_ICONS: Record<KpiKey, Icon> = {
  leads: IconUsers,
  approves: IconCircleCheck,
  approveRate: IconTarget,
  spend: IconCoin,
  income: IconTrendingUp,
  roi: IconChartPie,
}

function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
        className
      )}
    >
      {up ? (
        <IconArrowUpRight className="size-3.5" />
      ) : (
        <IconArrowDownRight className="size-3.5" />
      )}
      {Math.abs(value)}%
    </span>
  )
}

// shared card-header layout: title on the left, grey description on the right
const headerClass = "!flex flex-row items-center justify-between border-b"
const titleClass = "text-[15px] font-bold tracking-tight"
const descClass = "text-xs font-medium text-muted-foreground"

function RoiBadge({
  value,
  threshold = 0,
}: {
  value: number
  threshold?: number
}) {
  const good = value >= threshold
  return (
    <Badge
      variant="outline"
      className={cn(
        "tabular-nums",
        good
          ? "border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          : "border-transparent bg-destructive/10 text-destructive"
      )}
    >
      {value}%
    </Badge>
  )
}

function NotConnectedState({
  icon: SourceIcon,
  title,
  description,
  className,
  actionLabel = "Підключити",
  actionIcon: ActionIcon = IconArrowRight,
  onAction,
}: {
  icon: Icon
  title: string
  description: string
  className?: string
  actionLabel?: string
  actionIcon?: Icon
  onAction?: () => void
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <SourceIcon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="gap-1.5"
        onClick={onAction}
      >
        <ActionIcon className="size-4" />
        {actionLabel}
      </Button>
    </div>
  )
}

// overlay shown on top of a blurred stat card. when the account has no active
// plan it always wins and asks the user to pick a tariff; otherwise it shows the
// usual "data source not connected" prompt.
function LockedOverlay({
  noPlan,
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  actionOpensPricing = false,
}: {
  noPlan: boolean
  icon: Icon
  title: string
  description: string
  actionLabel?: string
  actionIcon?: Icon
  actionOpensPricing?: boolean
}) {
  const [pricingOpen, setPricingOpen] = useState(false)
  const openPricing = () => setPricingOpen(true)

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-4 dark:bg-black/60">
        {noPlan ? (
          <NotConnectedState
            icon={IconCrown}
            title="Немає активного тарифу"
            description="Підключіть тариф, щоб бачити дані аналітики"
            actionLabel="Підключіть тариф"
            actionIcon={IconCrown}
            onAction={openPricing}
          />
        ) : (
          <NotConnectedState
            icon={icon}
            title={title}
            description={description}
            actionLabel={actionLabel}
            actionIcon={actionIcon}
            onAction={actionOpensPricing ? openPricing : undefined}
          />
        )}
      </div>
      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  )
}

const DATE_PRESETS = ["Сьогодні", "7 днів", "30 днів", "Цей місяць"]

function DateRangePicker() {
  const [dateRange, setDateRange] = useState(DATE_PRESETS[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="secondary" className="gap-1.5">
            <IconCalendar className="size-4 text-muted-foreground" />
            {dateRange}
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={dateRange} onValueChange={setDateRange}>
          {DATE_PRESETS.map((p) => (
            <DropdownMenuRadioItem key={p} value={p} closeOnClick>
              {p}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OnboardingCallout({ onDismiss }: { onDismiss: () => void }) {
  const navigate = useNavigate()
  const { connectedAccounts, connectedCrms, callCenters } = useIntegrations()

  const stepDone = [
    Object.values(connectedAccounts).some((accs) => accs && accs.length > 0),
    connectedCrms.length > 0,
    callCenters.length > 0,
    false,
  ]
  const anyDone = stepDone.some(Boolean)
  const firstIncomplete = stepDone.findIndex((done) => !done)

  return (
    <Card className="relative gap-0 overflow-hidden py-0 [--card-spacing:0px]">
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
        aria-label="Закрити"
        onClick={onDismiss}
      >
        <IconX className="size-4" />
      </Button>
      <CardContent className="grid p-0 md:grid-cols-[1fr_200px]">
        <div className="order-2 hidden items-center justify-center py-5 pr-8 pl-2 md:flex">
          <img
            src={sideStepsImage}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
        <div className="order-1 flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Пройдіть 4 прості кроки для початку
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Підключіть джерела даних - і отримайте повну аналітику ваших
              кампаній в одному місці
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-0 sm:divide-x">
            {ONBOARDING_STEPS.map((s, i) => {
              const done = stepDone[i]
              return (
                <div
                  key={s.title}
                  className="flex items-center gap-2 sm:px-4 sm:first:pl-0"
                >
                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      done
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "border text-muted-foreground"
                    )}
                  >
                    {done ? <IconCircleCheck className="size-3.5" /> : i + 1}
                  </div>
                  <div className="min-w-0 text-xs font-medium">{s.title}</div>
                </div>
              )
            })}
          </div>
          <Button
            className="w-fit gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={() =>
              navigate("/onboarding", {
                state: { step: firstIncomplete === -1 ? 1 : firstIncomplete + 1 },
              })
            }
          >
            <IconArrowRight className="size-4" />
            {anyDone ? "Доналаштувати" : "Почати налаштування"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// shown instead of the onboarding stepper when the account has no active plan.
// unlike the onboarding callout, it cannot be dismissed.
function NoPlanCallout() {
  const [pricingOpen, setPricingOpen] = useState(false)

  return (
    <Card className="relative gap-0 overflow-hidden border-primary/20 py-0 shadow-sm [--card-spacing:0px]">
      {/* subtle theme-tinted gradient backdrop + soft glows (adapts to light/dark) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.12]" />
      <div className="pointer-events-none absolute -top-20 -right-12 size-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 size-56 rounded-full bg-primary/5 blur-3xl" />

      <CardContent className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-500/25 ring-inset dark:text-amber-400">
            <IconLock className="size-3.5" />
            Тариф не активний
          </span>
          <div className="flex items-center gap-2.5">
            <IconCrown className="size-6 text-amber-500" />
            <h2 className="text-xl font-bold tracking-tight">
              Розблокуйте повну аналітику
            </h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Оберіть тариф, щоб бачити ліди, ROI, топ баєрів та колцентрів у
            реальному часі — без обмежень.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {PLAN_FEATURES.map((feature) => (
              <span
                key={feature.key}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card/60 px-2.5 py-1 text-xs font-medium"
              >
                <feature.icon className="size-3.5 text-muted-foreground" />
                {feature.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Button
            size="lg"
            className="gap-1.5 bg-neutral-900 font-semibold text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={() => setPricingOpen(true)}
          >
            <IconCrown className="size-4" />
            Обрати тариф
          </Button>
          <span className="text-xs text-muted-foreground">від $19 / місяць</span>
        </div>
      </CardContent>
      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </Card>
  )
}

const KPI_REQUIRED_SOURCE: Record<KpiKey, "crm" | "adAccounts"> = {
  leads: "crm",
  approves: "crm",
  approveRate: "crm",
  spend: "adAccounts",
  income: "crm",
  roi: "adAccounts",
}

function KpiNoData() {
  return (
    <div className="mt-2 flex items-center gap-3">
      <svg
        width="64"
        height="28"
        viewBox="0 0 64 28"
        fill="none"
        className="shrink-0 text-muted-foreground/40"
      >
        <path
          d="M2 20 L14 10 L26 16 L38 6 L50 14 L62 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-medium text-muted-foreground">
        Очікуємо дані
      </span>
    </div>
  )
}

function KpiNoPlan() {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <IconLock className="size-3.5" />
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        Потрібен тариф
      </span>
    </div>
  )
}

function KpiCards() {
  const { sources, noPlan } = useDataSources()

  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
      {KPIS.map((kpi) => {
        const KpiIcon = KPI_ICONS[kpi.key]
        const connected = !noPlan && sources[KPI_REQUIRED_SOURCE[kpi.key]]
        const m = kpi.value.match(/^([\d\s.,]+)(.*)$/)
        const num = m ? m[1] : kpi.value
        const suffix = m ? m[2] : ""
        return (
          <Card key={kpi.key} className="gap-0 [--card-spacing:16px]">
            <CardContent className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <KpiIcon className="size-3.5" />
                {kpi.label}
              </div>
              {connected ? (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-[26px] font-extrabold tracking-tight tabular-nums md:text-2xl">
                      {num}
                    </span>
                    {suffix && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {suffix}
                      </span>
                    )}
                  </div>
                  <Delta
                    value={kpi.delta}
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-xs",
                      kpi.delta >= 0
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                        : "bg-destructive/10 text-destructive"
                    )}
                  />
                </div>
              ) : noPlan ? (
                <KpiNoPlan />
              ) : (
                <KpiNoData />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const LEADS_BY_DAY_WITH_TOTAL = LEADS_BY_DAY.map((d) => ({
  ...d,
  total: d.approved + d.raw,
}))

const chartConfig = {
  approved: { label: "Апрув", color: "var(--primary)" },
  raw: {
    label: "Необроблені",
    color: "color-mix(in oklab, var(--primary) 15%, var(--card))",
  },
} satisfies ChartConfig

function LeadsChart() {
  const { sources, noPlan } = useDataSources()

  if (noPlan || !sources.crm) {
    return (
      <Card className="relative gap-0 py-3.5 [--card-spacing:18px]">
        <CardHeader className={cn(headerClass, "pb-3.5")}>
          <CardTitle className={titleClass}>Ліди за тиждень</CardTitle>
          <CardDescription className={descClass}>
            Підтверджені та необроблені
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex h-[280px] flex-col pt-4">
          <div className="pointer-events-none opacity-80 blur-sm saturate-75 select-none">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart
                accessibilityLayer
                data={LEADS_BY_DAY_WITH_TOTAL}
                barSize={48}
              >
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  hide
                  domain={[0, (max: number) => Math.ceil(max * 1.25)]}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="approved"
                  stackId="a"
                  fill="var(--color-approved)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="raw"
                  stackId="a"
                  fill="var(--color-raw)"
                  radius={[8, 8, 0, 0]}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    offset={10}
                    className="fill-foreground text-xs font-semibold"
                    formatter={(value) => fmtNum(Number(value))}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
          <LockedOverlay
            noPlan={noPlan}
            icon={IconDatabase}
            title="CRM не підключена"
            description="Підключіть CRM, щоб бачити динаміку лідів"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeader className={cn(headerClass, "pb-3.5")}>
        <CardTitle className={titleClass}>Ліди за тиждень</CardTitle>
        <CardDescription className={descClass}>
          Підтверджені та необроблені
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end pt-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={LEADS_BY_DAY_WITH_TOTAL}
            barSize={48}
          >
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.25)]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="approved"
              stackId="a"
              fill="var(--color-approved)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="raw"
              stackId="a"
              fill="var(--color-raw)"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey="total"
                position="top"
                offset={10}
                className="fill-foreground text-xs font-semibold"
                formatter={(value) => fmtNum(Number(value))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function PricingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Оберіть тариф</DialogTitle>
          <DialogDescription>
            Більше акаунтів, учасників команди та інтеграцій на платних тарифах
          </DialogDescription>
        </DialogHeader>
        <PricingGrid size="sm" />
      </DialogContent>
    </Dialog>
  )
}

function TopBuyers() {
  const { sources, noPlan } = useDataSources()

  if (noPlan || !sources.crm) {
    return (
      <Card className="relative gap-0 py-3.5 [--card-spacing:18px]">
          <CardHeader className={cn(headerClass, "pb-3.5")}>
            <CardTitle className={titleClass}>Топ баєрів</CardTitle>
            <CardDescription className={descClass}>
              ліди · апрув · ROI
            </CardDescription>
          </CardHeader>
          <CardContent className="relative px-0">
            <div className="pointer-events-none opacity-80 blur-sm saturate-75 select-none">
              <ScrollArea className="h-[286px] px-(--card-spacing)">
                <div className="flex flex-col pt-1.5">
                  {BUYERS.map((buyer) => (
                    <div
                      key={buyer.name}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <Avatar className="size-9">
                        <AvatarFallback
                          className="text-xs font-bold text-white"
                          style={{ backgroundColor: avatarColor(buyer.name) }}
                        >
                          {buyer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {buyer.name}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {fmtNum(buyer.leads)} лідів · {fmtNum(buyer.approves)}{" "}
                          апрув
                        </div>
                      </div>
                      <RoiBadge value={buyer.roi} threshold={100} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <LockedOverlay
              noPlan={noPlan}
              icon={IconDatabase}
              title="Користувачів не додано"
              description="Додайте учасників команди, щоб бачити їх рейтинг"
              actionLabel="Додати учасників"
              actionOpensPricing
            />
          </CardContent>
        </Card>
    )
  }

  if (BUYERS.length === 0) {
    return (
      <Card className="gap-0 py-3.5 [--card-spacing:18px]">
        <CardHeader className={cn(headerClass, "pb-3.5")}>
          <CardTitle className={titleClass}>Топ баєрів</CardTitle>
          <CardDescription className={descClass}>
            ліди · апрув · ROI
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[286px] items-center px-0">
          <NotConnectedState
            icon={IconUsers}
            title="Баєрів не додано"
            description="Додайте баєрів, щоб бачити їхній рейтинг за лідами та ROI"
            actionLabel="Додати баєра"
            actionIcon={IconUserPlus}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeader className={cn(headerClass, "pb-3.5")}>
        <CardTitle className={titleClass}>Топ баєрів</CardTitle>
        <CardDescription className={descClass}>
          ліди · апрув · ROI
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[286px] px-(--card-spacing)">
          <div className="flex flex-col pt-1.5">
            {BUYERS.map((buyer) => (
              <div key={buyer.name} className="flex items-center gap-3 py-2.5">
                <Avatar className="size-9">
                  <AvatarFallback
                    className="text-xs font-bold text-white"
                    style={{ backgroundColor: avatarColor(buyer.name) }}
                  >
                    {buyer.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {buyer.name}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {fmtNum(buyer.leads)} лідів · {fmtNum(buyer.approves)} апрув
                  </div>
                </div>
                <RoiBadge value={buyer.roi} threshold={100} />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function TopCallCenters() {
  const { sources, noPlan } = useDataSources()
  const max = Math.max(...CALL_CENTERS.map((c) => c.avgMargin))

  if (noPlan || !sources.callCenter) {
    return (
      <Card className="relative gap-0 py-3.5 [--card-spacing:18px]">
        <CardHeader className={cn(headerClass, "pb-3.5")}>
          <CardTitle className={titleClass}>Топ колцентрів</CardTitle>
          <CardDescription className={descClass}>
            маржа · допрод
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex flex-col gap-3.5 py-4">
          <div className="pointer-events-none opacity-80 blur-sm saturate-75 select-none">
            {CALL_CENTERS.map((cc) => (
              <div key={cc.name} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{cc.name}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {fmtNum(cc.approves)} апрувів
                  </div>
                </div>
                <div className="w-24">
                  <div className="text-right text-sm font-semibold tabular-nums">
                    {fmtMoney(cc.avgMargin)}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(cc.avgMargin / max) * 100}%` }}
                    />
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="w-14 justify-center border-transparent bg-emerald-500/12 text-emerald-600 tabular-nums dark:text-emerald-400"
                >
                  {cc.upsell}%
                </Badge>
              </div>
            ))}
          </div>
          <LockedOverlay
            noPlan={noPlan}
            icon={IconHeadset}
            title="Колцентр не підключений"
            description="Підключіть колцентр, щоб бачити маржу та допродажі"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-3.5 [--card-spacing:18px]">
      <CardHeader className={cn(headerClass, "pb-3.5")}>
        <CardTitle className={titleClass}>Топ колцентрів</CardTitle>
        <CardDescription className={descClass}>маржа · допрод</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 py-4">
        {CALL_CENTERS.map((cc) => (
          <div key={cc.name} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{cc.name}</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {fmtNum(cc.approves)} апрувів
              </div>
            </div>
            <div className="w-24">
              <div className="text-right text-sm font-semibold tabular-nums">
                {fmtMoney(cc.avgMargin)}
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(cc.avgMargin / max) * 100}%` }}
                />
              </div>
            </div>
            <Badge
              variant="outline"
              className="w-14 justify-center border-transparent bg-emerald-500/12 text-emerald-600 tabular-nums dark:text-emerald-400"
            >
              {cc.upsell}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TopProducts() {
  const { sources, noPlan } = useDataSources()

  if (noPlan || !sources.crm) {
    return (
      <Card className="relative gap-0 py-0 [--card-spacing:18px]">
        <CardHeader className={cn(headerClass, "py-3.5")}>
          <CardTitle className={titleClass}>Топ товарів по продажу</CardTitle>
          <CardDescription className={descClass}>
            за обраний період
          </CardDescription>
        </CardHeader>
        <CardContent className="relative px-0">
          <div className="pointer-events-none opacity-80 blur-sm saturate-75 select-none">
            <ScrollArea className="h-[280px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <TableHead className="pl-[18px]">Товар</TableHead>
                    <TableHead className="text-right">Замовл.</TableHead>
                    <TableHead className="text-right">Сума продажу</TableHead>
                    <TableHead className="text-right">% викупу</TableHead>
                    <TableHead className="text-right">Дохід</TableHead>
                    <TableHead className="pr-[18px] text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRODUCTS.map((product, i) => (
                    <TableRow key={product.name}>
                      <TableCell className="pl-[18px]">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtNum(product.orders)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmtMoney(product.sales)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.buyout}%
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          product.income >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        )}
                      >
                        {fmtMoney(product.income)}
                      </TableCell>
                      <TableCell className="pr-[18px] text-right">
                        <RoiBadge value={product.roi} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <LockedOverlay
            noPlan={noPlan}
            icon={IconDatabase}
            title="CRM не підключена"
            description="Підключіть CRM, щоб бачити топ товарів по продажу"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0 [--card-spacing:18px]">
      <CardHeader className={cn(headerClass, "py-3.5")}>
        <CardTitle className={titleClass}>Топ товарів по продажу</CardTitle>
        <CardDescription className={descClass}>
          за обраний період
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[280px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="pl-[18px]">Товар</TableHead>
                <TableHead className="text-right">Замовл.</TableHead>
                <TableHead className="text-right">Сума продажу</TableHead>
                <TableHead className="text-right">% викупу</TableHead>
                <TableHead className="text-right">Дохід</TableHead>
                <TableHead className="pr-[18px] text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUCTS.map((product, i) => (
                <TableRow key={product.name}>
                  <TableCell className="pl-[18px]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtNum(product.orders)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtMoney(product.sales)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.buyout}%
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      product.income >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    )}
                  >
                    {fmtMoney(product.income)}
                  </TableCell>
                  <TableCell className="pr-[18px] text-right">
                    <RoiBadge value={product.roi} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(true)
  const { noPlan } = useDataSources()

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      {noPlan ? (
        <NoPlanCallout />
      ) : (
        showOnboarding && (
          <OnboardingCallout onDismiss={() => setShowOnboarding(false)} />
        )
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Огляд</h1>
        <DateRangePicker />
      </div>
      <KpiCards />
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <LeadsChart />
        <TopBuyers />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <TopCallCenters />
        <TopProducts />
      </div>
    </div>
  )
}
