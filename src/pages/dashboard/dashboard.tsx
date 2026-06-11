import {
  IconAd,
  IconArrowDownRight,
  IconArrowRight,
  IconArrowUpRight,
  IconBolt,
  IconCalendar,
  IconChartPie,
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconCoin,
  IconCopy,
  IconCrown,
  IconDatabase,
  IconHeadset,
  IconInfoCircle,
  IconRocket,
  IconShieldLock,
  IconSparkles,
  IconTarget,
  IconTrash,
  IconTrendingUp,
  IconUserPlus,
  IconUsers,
  IconX,
  type Icon,
} from "@tabler/icons-react"
import { useState, type Dispatch, type SetStateAction } from "react"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import sideStepsImage from "@/assets/side_steps.png"
import { useDataSources } from "@/components/data-sources-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  DialogFooter,
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const ONBOARDING_STEPS = [
  { title: "Додайте рекламний кабінет" },
  { title: "Підключіть CRM" },
  { title: "Додайте колцентри" },
] as const

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"
      />
    </svg>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.7-.2-2.5H12v4.6h6.5a5.5 5.5 0 01-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  )
}

function TiktokLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#000"
        d="M19.6 6.7a4.8 4.8 0 01-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 01-5.2 1.7 2.9 2.9 0 013.2-4.5v-3.5a6.3 6.3 0 105.4 10.7V8.7a8.2 8.2 0 004.8 1.5V6.8a4.8 4.8 0 01-1-.1z"
      />
      <path
        fill="#25F4EE"
        d="M5.6 16.4a2.9 2.9 0 013.2-4.5V8.4a6.3 6.3 0 00-5.4 10.7 6.3 6.3 0 012.2-2.7z"
      />
      <path
        fill="#FE2C55"
        d="M20.6 6.8v-.1a4.8 4.8 0 01-2.8-.9 4.8 4.8 0 002.8 1z"
      />
    </svg>
  )
}

const AD_PLATFORMS = [
  { name: "Facebook Ads", icon: FacebookLogo },
  { name: "TikTok Ads", icon: TiktokLogo },
  { name: "Google Ads", icon: GoogleLogo },
] as const

type AdPlatform = (typeof AD_PLATFORMS)[number]

type AdAccount = {
  name: string
  manager: string
  accountId: string
  spend: string
}

const MOCK_AD_ACCOUNTS: Record<AdPlatform["name"], AdAccount[]> = {
  "Facebook Ads": [
    {
      name: "Brand Awareness",
      manager: "Business Manager",
      accountId: "act_9910048227761803",
      spend: "₴ 31 000 / міс",
    },
    {
      name: "Retargeting",
      manager: "Business Manager",
      accountId: "act_9910048227761921",
      spend: "₴ 12 400 / міс",
    },
    {
      name: "Lookalike Audience",
      manager: "Business Manager",
      accountId: "act_9910048227762045",
      spend: "₴ 8 900 / міс",
    },
  ],
  "TikTok Ads": [
    {
      name: "Performance Max",
      manager: "TikTok Business Center",
      accountId: "act_5523109872341205",
      spend: "₴ 18 500 / міс",
    },
    {
      name: "Spark Ads",
      manager: "TikTok Business Center",
      accountId: "act_5523109872341378",
      spend: "₴ 9 200 / міс",
    },
  ],
  "Google Ads": [
    {
      name: "Search Campaign",
      manager: "Google Ads Manager",
      accountId: "act_7741098234561987",
      spend: "₴ 24 200 / міс",
    },
    {
      name: "Performance Max",
      manager: "Google Ads Manager",
      accountId: "act_7741098234562104",
      spend: "₴ 11 700 / міс",
    },
  ],
}

function pluralizeKabinet(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "кабінет"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "кабінети"
  return "кабінетів"
}

function pluralizeIntegration(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "інтеграція"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "інтеграції"
  return "інтеграцій"
}

const CRM_TYPES = ["LP CRM", "Sales Drive"] as const
type CrmType = (typeof CRM_TYPES)[number]

type ConnectedCrm = {
  type: CrmType
  label: string
}

const CRM_LOGO_COLORS: Record<CrmType, string> = {
  "LP CRM": "#6366F1",
  "Sales Drive": "#F97316",
}

const CRM_LOGO_LETTERS: Record<CrmType, string> = {
  "LP CRM": "LP",
  "Sales Drive": "SD",
}

function CrmLogo({ type, className }: { type: CrmType; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md font-bold text-white",
        className
      )}
      style={{ backgroundColor: CRM_LOGO_COLORS[type] }}
    >
      {CRM_LOGO_LETTERS[type]}
    </div>
  )
}

function AddCrmDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (crm: ConnectedCrm) => void
}) {
  const [selected, setSelected] = useState<CrmType | null>(null)
  const [subdomain, setSubdomain] = useState("")
  const [apiKey, setApiKey] = useState("")

  const reset = () => {
    setSelected(null)
    setSubdomain("")
    setApiKey("")
  }

  const canSubmit =
    selected === "LP CRM"
      ? subdomain.trim() !== "" && apiKey.trim() !== ""
      : selected !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        <DialogHeader>
          <DialogTitle>Підключення CRM</DialogTitle>
          <DialogDescription>
            Оберіть CRM-систему та заповніть дані для підключення
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5">
          {CRM_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(type)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3.5 text-sm font-semibold transition-colors",
                selected === type
                  ? "border-neutral-900 dark:border-neutral-400"
                  : "hover:bg-muted"
              )}
            >
              <CrmLogo type={type} className="size-9 text-sm" />
              {type}
            </button>
          ))}
        </div>
        {selected === "LP CRM" && (
          <div className="flex animate-in flex-col gap-3 duration-300 fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Вихідний ключ API
              </label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Введіть API ключ"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Адреса акаунту
              </label>
              <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30">
                <span className="flex shrink-0 items-center bg-muted pr-1.5 pl-2.5 text-sm text-muted-foreground">
                  https://
                </span>
                <Input
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(e.target.value.replace(/\s+/g, ""))
                  }
                  placeholder="myaccount"
                  className="h-full min-w-0 flex-1 rounded-none border-0 px-1.5 shadow-none focus-visible:ring-0"
                />
                <span className="flex shrink-0 items-center bg-muted pr-2.5 pl-1.5 text-sm text-muted-foreground">
                  .lp-crm.com
                </span>
              </div>
            </div>
          </div>
        )}
        {selected === "Sales Drive" && (
          <Alert
            variant="info"
            className="animate-in duration-300 fade-in slide-in-from-bottom-2"
          >
            <IconInfoCircle />
            <AlertDescription>
              Підключення Sales Drive буде доступне найближчим часом
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter className="sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            disabled={!canSubmit}
            className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={() => {
              if (!selected) return
              onAdd({
                type: selected,
                label:
                  selected === "LP CRM"
                    ? `https://${subdomain}.lp-crm.com`
                    : "Підключено",
              })
              onOpenChange(false)
            }}
          >
            Підключити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CrmStep({
  connectedCrms,
  setConnectedCrms,
}: {
  connectedCrms: ConnectedCrm[]
  setConnectedCrms: Dispatch<SetStateAction<ConnectedCrm[]>>
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [crmToDelete, setCrmToDelete] = useState<number | null>(null)
  const hasCrms = connectedCrms.length > 0

  return (
    <div className="flex flex-col gap-3">
      <Alert
        variant="info"
        className="animate-in duration-300 fade-in slide-in-from-right-8"
      >
        <IconInfoCircle />
        <AlertDescription>
          Підключіть CRM-систему, щоб бачити ліди, апруви та дохід в аналітиці
        </AlertDescription>
      </Alert>
      <div
        className="animate-in rounded-lg border p-3.5 duration-300 fade-in slide-in-from-right-8"
        style={{ animationDelay: "75ms", animationFillMode: "both" }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            hasCrms && "border-b pb-3"
          )}
        >
          <div className="flex items-center gap-3">
            <IconDatabase className="size-7 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">CRM-система</span>
              {hasCrms ? (
                <Badge
                  variant="outline"
                  className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                >
                  {connectedCrms.length}{" "}
                  {pluralizeIntegration(connectedCrms.length)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Не підключено
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            className="gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <IconDatabase className="size-4" />
            {hasCrms ? "Додати ще" : "Додати CRM"}
          </Button>
        </div>
        {hasCrms && (
          <div className="mt-3 flex flex-col gap-2">
            {connectedCrms.map((crm, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
              >
                <div className="flex items-center gap-3">
                  <CrmLogo type={crm.type} className="size-9 text-xs" />
                  <div>
                    <p className="text-sm font-semibold">{crm.type}</p>
                    <p className="text-xs text-muted-foreground">{crm.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1 border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  >
                    <IconCheck className="size-3.5" />
                    Активний
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => setCrmToDelete(i)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddCrmDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(crm) => setConnectedCrms((prev) => [...prev, crm])}
      />
      <Dialog
        open={crmToDelete !== null}
        onOpenChange={(open) => !open && setCrmToDelete(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Видалити CRM?</DialogTitle>
            <DialogDescription>
              {crmToDelete !== null &&
                `${connectedCrms[crmToDelete]?.type} буде відключено від аналітики`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setCrmToDelete(null)}>
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (crmToDelete === null) return
                setConnectedCrms((prev) =>
                  prev.filter((_, i) => i !== crmToDelete)
                )
                setCrmToDelete(null)
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function pluralizeCallCenter(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "колцентр"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "колцентри"
  return "колцентрів"
}

const UPSELL_FEE_TYPES = [
  { value: "sum", label: "% від суми допродажу" },
  { value: "margin", label: "% від маржі допродажу" },
] as const

type UpsellFeeType = (typeof UPSELL_FEE_TYPES)[number]["value"]

type CallCenter = {
  name: string
  office: string
  confirmedOrderPrice: string
  upsellFeeType: UpsellFeeType
  upsellFeePercent: string
}

function AddCallCenterDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (callCenter: CallCenter) => void
}) {
  const [name, setName] = useState("")
  const [office, setOffice] = useState("")
  const [confirmedOrderPrice, setConfirmedOrderPrice] = useState("")
  const [upsellFeeType, setUpsellFeeType] = useState<UpsellFeeType>("sum")
  const [upsellFeePercent, setUpsellFeePercent] = useState("")

  const reset = () => {
    setName("")
    setOffice("")
    setConfirmedOrderPrice("")
    setUpsellFeeType("sum")
    setUpsellFeePercent("")
  }

  const canSubmit =
    name.trim() !== "" &&
    office.trim() !== "" &&
    confirmedOrderPrice.trim() !== "" &&
    upsellFeePercent.trim() !== ""

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        <DialogHeader>
          <DialogTitle>Додавання колцентру</DialogTitle>
          <DialogDescription>
            Вкажіть назву колцентру та умови оплати
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Назва колцентру
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Наприклад, Контакт-центр №1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Офіс
            </label>
            <Input
              value={office}
              onChange={(e) => setOffice(e.target.value.replace(/\D/g, ""))}
              placeholder="Номер офісу"
              inputMode="numeric"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Ціна за підтверджений заказ
            </label>
            <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30">
              <Input
                value={confirmedOrderPrice}
                onChange={(e) =>
                  setConfirmedOrderPrice(e.target.value.replace(/[^\d.,]/g, ""))
                }
                placeholder="0"
                inputMode="decimal"
                className="h-full min-w-0 flex-1 rounded-none border-0 px-2.5 shadow-none focus-visible:ring-0"
              />
              <span className="flex shrink-0 items-center bg-muted pr-2.5 pl-1.5 text-sm text-muted-foreground">
                ₴
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Оплата допродажу
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {UPSELL_FEE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setUpsellFeeType(type.value)}
                  className={cn(
                    "rounded-lg border p-2.5 text-center text-xs font-semibold transition-colors",
                    upsellFeeType === type.value
                      ? "border-neutral-900 dark:border-neutral-400"
                      : "hover:bg-muted"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {UPSELL_FEE_TYPES.find((t) => t.value === upsellFeeType)?.label}
            </label>
            <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30">
              <Input
                value={upsellFeePercent}
                onChange={(e) =>
                  setUpsellFeePercent(e.target.value.replace(/[^\d.,]/g, ""))
                }
                placeholder="0"
                inputMode="decimal"
                className="h-full min-w-0 flex-1 rounded-none border-0 px-2.5 shadow-none focus-visible:ring-0"
              />
              <span className="flex shrink-0 items-center bg-muted pr-2.5 pl-1.5 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            disabled={!canSubmit}
            className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={() => {
              onAdd({
                name: name.trim(),
                office: office.trim(),
                confirmedOrderPrice: confirmedOrderPrice.trim(),
                upsellFeeType,
                upsellFeePercent: upsellFeePercent.trim(),
              })
              onOpenChange(false)
            }}
          >
            Додати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CallCentersStep({
  callCenters,
  setCallCenters,
}: {
  callCenters: CallCenter[]
  setCallCenters: Dispatch<SetStateAction<CallCenter[]>>
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [centerToDelete, setCenterToDelete] = useState<number | null>(null)
  const hasCenters = callCenters.length > 0

  return (
    <div className="flex flex-col gap-3">
      <Alert
        variant="info"
        className="animate-in duration-300 fade-in slide-in-from-right-8"
      >
        <IconInfoCircle />
        <AlertDescription>
          Додайте колцентри та умови оплати, щоб бачити маржу та допродажі в
          аналітиці
        </AlertDescription>
      </Alert>
      <div
        className="animate-in rounded-lg border p-3.5 duration-300 fade-in slide-in-from-right-8"
        style={{ animationDelay: "75ms", animationFillMode: "both" }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            hasCenters && "border-b pb-3"
          )}
        >
          <div className="flex items-center gap-3">
            <IconHeadset className="size-7 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Колцентри</span>
              {hasCenters ? (
                <Badge
                  variant="outline"
                  className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                >
                  {callCenters.length} {pluralizeCallCenter(callCenters.length)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Не додано
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            className="gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <IconHeadset className="size-4" />
            {hasCenters ? "Додати ще" : "Додати колцентр"}
          </Button>
        </div>
        {hasCenters && (
          <div className="mt-3 flex flex-col gap-2">
            {callCenters.map((cc, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    <IconHeadset className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{cc.name}</p>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Офіс {cc.office}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ₴{cc.confirmedOrderPrice} за заказ · {cc.upsellFeePercent}
                      %{" "}
                      {cc.upsellFeeType === "sum"
                        ? "від суми допродажу"
                        : "від маржі допродажу"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="gap-1 border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  >
                    <IconCheck className="size-3.5" />
                    Активний
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => setCenterToDelete(i)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddCallCenterDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(cc) => setCallCenters((prev) => [...prev, cc])}
      />
      <Dialog
        open={centerToDelete !== null}
        onOpenChange={(open) => !open && setCenterToDelete(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Видалити колцентр?</DialogTitle>
            <DialogDescription>
              {centerToDelete !== null &&
                `${callCenters[centerToDelete]?.name} буде видалено зі списку`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setCenterToDelete(null)}>
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (centerToDelete === null) return
                setCallCenters((prev) =>
                  prev.filter((_, i) => i !== centerToDelete)
                )
                setCenterToDelete(null)
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConnectPlatformDialog({
  platform,
  onOpenChange,
  onConnect,
}: {
  platform: AdPlatform | null
  onOpenChange: (open: boolean) => void
  onConnect: (platform: AdPlatform) => void
}) {
  const [copied, setCopied] = useState(false)
  const [lastPlatform, setLastPlatform] = useState<AdPlatform | null>(null)

  if (platform && platform !== lastPlatform) {
    setLastPlatform(platform)
  }

  const display = platform ?? lastPlatform
  const link = display
    ? `https://app.adsmetry.io/connect/${display.name.toLowerCase().replace(/\s+/g, "-")}`
    : ""

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog
      open={!!platform}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setCopied(false)
      }}
    >
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        {display && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <display.icon className="size-5" />
                Підключення {display.name}
              </DialogTitle>
              <DialogDescription>
                Авторизуйтесь натиснувши кнопку або перейдіть по посиланню
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-1.5"
              onClick={() => onConnect(display)}
            >
              <display.icon className="size-4" />
              Підключити {display.name}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <IconShieldLock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Захищено OAuth 2.0 - ми не бачимо ваш пароль
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                Посилання також можна надіслати людині, після підключення акаунт
                людини буде доступний у вас
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={link} className="text-xs" />
                <Button variant="secondary" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AdAccountsStep({
  connectedAccounts,
  setConnectedAccounts,
}: {
  connectedAccounts: Partial<Record<AdPlatform["name"], AdAccount[]>>
  setConnectedAccounts: Dispatch<
    SetStateAction<Partial<Record<AdPlatform["name"], AdAccount[]>>>
  >
}) {
  const [connectPlatform, setConnectPlatform] = useState<AdPlatform | null>(
    null
  )
  const [accountToDelete, setAccountToDelete] = useState<{
    platform: AdPlatform
    index: number
  } | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Alert
        variant="info"
        className="animate-in duration-300 fade-in slide-in-from-right-8"
      >
        <IconInfoCircle />
        <AlertDescription>
          Підключіть рекламні кабінети, вас перенаправить на платформу, на якій
          потрібно підтвердити інтеграцію
        </AlertDescription>
      </Alert>
      {AD_PLATFORMS.map((platform, i) => {
        const accounts = connectedAccounts[platform.name] ?? []
        const hasAccounts = accounts.length > 0
        return (
          <div
            key={platform.name}
            className="animate-in rounded-lg border p-3.5 duration-300 fade-in slide-in-from-right-8"
            style={{
              animationDelay: `${(i + 1) * 75}ms`,
              animationFillMode: "both",
            }}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3",
                hasAccounts && "border-b pb-3"
              )}
            >
              <div className="flex items-center gap-3">
                <platform.icon className="size-7" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{platform.name}</span>
                  {hasAccounts ? (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                    >
                      {accounts.length} {pluralizeKabinet(accounts.length)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Не підключено
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="secondary"
                className="gap-1.5"
                onClick={() => setConnectPlatform(platform)}
              >
                <platform.icon className="size-4" />
                {hasAccounts ? "Додати ще" : "Підключити"}
              </Button>
            </div>
            {hasAccounts && (
              <div className="mt-3 flex flex-col gap-2">
                {accounts.map((account, accountIndex) => (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.manager} · {account.accountId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="gap-1 border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      >
                        <IconCheck className="size-3.5" />
                        Активний
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        onClick={() =>
                          setAccountToDelete({ platform, index: accountIndex })
                        }
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <ConnectPlatformDialog
        platform={connectPlatform}
        onOpenChange={(open) => !open && setConnectPlatform(null)}
        onConnect={(platform) => {
          setConnectedAccounts((prev) => {
            const existing = prev[platform.name] ?? []
            const pool = MOCK_AD_ACCOUNTS[platform.name]
            const next = pool[existing.length % pool.length]
            return {
              ...prev,
              [platform.name]: [...existing, next],
            }
          })
          setConnectPlatform(null)
        }}
      />
      <Dialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Видалити рекламний кабінет?</DialogTitle>
            <DialogDescription>
              {accountToDelete &&
                (() => {
                  const account =
                    connectedAccounts[accountToDelete.platform.name]?.[
                      accountToDelete.index
                    ]
                  return `Кабінет ${account?.name} (${accountToDelete.platform.name}) буде відключено від аналітики`
                })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setAccountToDelete(null)}
            >
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!accountToDelete) return
                setConnectedAccounts((prev) => {
                  const existing = prev[accountToDelete.platform.name] ?? []
                  const next = existing.filter(
                    (_, i) => i !== accountToDelete.index
                  )
                  const updated = { ...prev }
                  if (next.length > 0) {
                    updated[accountToDelete.platform.name] = next
                  } else {
                    delete updated[accountToDelete.platform.name]
                  }
                  return updated
                })
                setAccountToDelete(null)
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SetupStepper({ step }: { step: number }) {
  return (
    <div className="flex items-center py-7">
      {ONBOARDING_STEPS.map((s, i) => {
        const index = i + 1
        const done = index < step
        const active = index === step
        return (
          <div
            key={s.title}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  done &&
                    "scale-100 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                  active &&
                    "scale-110 border-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white",
                  !done && !active && "scale-100 border text-muted-foreground"
                )}
              >
                {done ? (
                  <IconCircleCheck className="size-4 animate-in duration-300 zoom-in-50" />
                ) : (
                  index
                )}
              </div>
              <div
                className={cn(
                  "hidden text-sm font-medium transition-colors duration-300 sm:block",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
              </div>
            </div>
            {index < ONBOARDING_STEPS.length && (
              <div className="mx-3 h-px flex-1 overflow-hidden bg-border">
                <div
                  className={cn(
                    "h-full bg-neutral-900 transition-transform duration-500 ease-out dark:bg-white",
                    done ? "translate-x-0" : "-translate-x-full"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function OnboardingCallout({ onDismiss }: { onDismiss: () => void }) {
  const [setupOpen, setSetupOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [connectedAccounts, setConnectedAccounts] = useState<
    Partial<Record<AdPlatform["name"], AdAccount[]>>
  >({})
  const [connectedCrms, setConnectedCrms] = useState<ConnectedCrm[]>([])
  const [callCenters, setCallCenters] = useState<CallCenter[]>([])

  const goToStep = (next: number) => {
    setDirection(next > step ? "forward" : "back")
    setStep(next)
  }

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
              Пройдіть 3 прості кроки для початку
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Підключіть джерела даних - і отримайте повну аналітику ваших
              кампаній в одному місці
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-0 sm:divide-x">
            {ONBOARDING_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex items-center gap-2 sm:px-4 sm:first:pl-0"
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0 text-xs font-medium">{step.title}</div>
              </div>
            ))}
          </div>
          <Button
            className="w-fit gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={() => setSetupOpen(true)}
          >
            <IconArrowRight className="size-4" />
            Почати налаштування
          </Button>
        </div>
      </CardContent>
      <Dialog
        open={setupOpen}
        onOpenChange={(open) => {
          setSetupOpen(open)
          if (!open) {
            setStep(1)
            setDirection("forward")
            setConnectedAccounts({})
            setConnectedCrms([])
            setCallCenters([])
          }
        }}
        disablePointerDismissal
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Налаштування за 3 кроки</DialogTitle>
            <DialogDescription>
              Підключіть джерела даних, щоб бачити повну аналітику кампаній
            </DialogDescription>
          </DialogHeader>
          <SetupStepper step={step} />
          <div className="mt-2 min-h-[280px] overflow-hidden">
            <div
              key={step}
              className={cn(
                "animate-in delay-150 duration-300 fill-mode-backwards fade-in",
                direction === "forward"
                  ? "slide-in-from-right-8"
                  : "slide-in-from-left-8"
              )}
            >
              {step === 1 && (
                <AdAccountsStep
                  connectedAccounts={connectedAccounts}
                  setConnectedAccounts={setConnectedAccounts}
                />
              )}
              {step === 2 && (
                <CrmStep
                  connectedCrms={connectedCrms}
                  setConnectedCrms={setConnectedCrms}
                />
              )}
              {step === 3 && (
                <CallCentersStep
                  callCenters={callCenters}
                  setCallCenters={setCallCenters}
                />
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                if (step < ONBOARDING_STEPS.length) {
                  goToStep(step + 1)
                } else {
                  setSetupOpen(false)
                }
              }}
            >
              Пропустити
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="secondary" onClick={() => goToStep(step - 1)}>
                  Назад
                </Button>
              )}
              <Button
                className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={() => {
                  if (step < ONBOARDING_STEPS.length) {
                    goToStep(step + 1)
                  } else {
                    setSetupOpen(false)
                  }
                }}
              >
                Далі
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function KpiCards() {
  const { sources } = useDataSources()

  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
      {KPIS.map((kpi) => {
        const KpiIcon = KPI_ICONS[kpi.key]
        const connected = sources[KPI_REQUIRED_SOURCE[kpi.key]]
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
  const { sources } = useDataSources()

  if (!sources.crm) {
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
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-4 dark:bg-black/60">
            <NotConnectedState
              icon={IconDatabase}
              title="CRM не підключена"
              description="Підключіть CRM, щоб бачити динаміку лідів"
            />
          </div>
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

const PLAN_FEATURES = [
  { key: "adAccounts", label: "Рекламні акаунти", icon: IconAd },
  { key: "members", label: "Учасники команди", icon: IconUsers },
  { key: "crm", label: "CRM", icon: IconDatabase },
  { key: "callCenters", label: "Колцентри", icon: IconHeadset },
] as const

type PlanFeatureKey = (typeof PLAN_FEATURES)[number]["key"]

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

const PRICING_PLANS = [
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
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = plan.id === "free"
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
                    <p className="text-xs text-muted-foreground">
                      {plan.tagline}
                    </p>
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
                      <div
                        key={feature.key}
                        className="flex items-center gap-2.5"
                      >
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
                    "Поточний тариф"
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
      </DialogContent>
    </Dialog>
  )
}

function TopBuyers() {
  const { sources } = useDataSources()
  const [pricingOpen, setPricingOpen] = useState(false)

  if (!sources.crm) {
    return (
      <>
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
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-4 dark:bg-black/60">
              <NotConnectedState
                icon={IconDatabase}
                title="Користувачів не додано"
                description="Додайте учасників команди, щоб бачити їх рейтинг"
                actionLabel="Додати учасників"
                onAction={() => setPricingOpen(true)}
              />
            </div>
          </CardContent>
        </Card>
        <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
      </>
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
  const { sources } = useDataSources()
  const max = Math.max(...CALL_CENTERS.map((c) => c.avgMargin))

  if (!sources.callCenter) {
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
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-4 dark:bg-black/60">
            <NotConnectedState
              icon={IconHeadset}
              title="Колцентр не підключений"
              description="Підключіть колцентр, щоб бачити маржу та допродажі"
            />
          </div>
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
  const { sources } = useDataSources()

  if (!sources.crm) {
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
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-4 dark:bg-black/60">
            <NotConnectedState
              icon={IconDatabase}
              title="CRM не підключена"
              description="Підключіть CRM, щоб бачити топ товарів по продажу"
            />
          </div>
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

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      {showOnboarding && (
        <OnboardingCallout onDismiss={() => setShowOnboarding(false)} />
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
