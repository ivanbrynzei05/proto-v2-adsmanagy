import {
  IconBell,
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconArrowRight,
  IconChecks,
  IconInfoCircleFilled,
} from "@tabler/icons-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  CAMPAIGNS,
  parseProductId,
  plural,
  PRODUCTS,
  type Row,
} from "@/pages/campaigns/data"

// Campaigns the last sync tied to a product on its own, from the id their name
// starts with - grouped per product, in the order the table lists them.
type LinkedProduct = { id: string; name: string; campaigns: Row[] }

function autoLinkedProducts(): LinkedProduct[] {
  const map = new Map<string, Row[]>()
  for (const c of CAMPAIGNS) {
    const { id } = parseProductId(c.name)
    if (!id) continue
    const list = map.get(id)
    if (list) list.push(c)
    else map.set(id, [c])
  }
  return Array.from(map, ([id, campaigns]) => ({
    id,
    name: PRODUCTS[id] ?? "Товар " + id,
    campaigns,
  }))
}

// The icon says how much the event matters, never what it is about - so one
// glance down the list finds what needs attention first.
type Importance = "info" | "warning" | "critical"

const IMPORTANCE: Record<
  Importance,
  { icon: typeof IconInfoCircleFilled; cls: string; label: string }
> = {
  info: {
    icon: IconInfoCircleFilled,
    cls: "text-muted-foreground/70",
    label: "Інформація",
  },
  warning: {
    icon: IconAlertTriangleFilled,
    cls: "text-amber-500",
    label: "Попередження",
  },
  critical: {
    icon: IconAlertCircleFilled,
    cls: "text-destructive",
    label: "Важливо",
  },
}

// The detail view is text, not a bespoke screen: a notification carries a short
// document built from these blocks, and one dialog renders any of them.
// Inline **bold** is allowed inside every string.
type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "note"; text: string }
  | { type: "hr" }

type NotificationAction = { label: string; to: string }

type Notification = {
  id: string
  /** where it came from - the same short word for every event of that kind */
  source: string
  importance: Importance
  title: string
  body?: string
  time: string
  unread: boolean
  /** the full text - when present the list offers "Переглянути" */
  details?: Block[]
  /** where the event leads; sits in the dialog footer when there are details */
  action?: NotificationAction
}

function autoLinkedDetails(products: LinkedProduct[]): Block[] {
  const count = products.reduce((n, p) => n + p.campaigns.length, 0)
  return [
    {
      type: "p",
      text:
        "Під час синхронізації **" +
        count +
        " " +
        plural(count, "кампанія", "кампанії", "кампаній") +
        "** " +
        plural(count, "отримала", "отримали", "отримали") +
        " товар автоматично - ID товару стоїть на початку їхньої назви.",
    },
    ...products.flatMap((p): Block[] => [
      { type: "h", text: "#" + p.id + " · " + p.name },
      {
        type: "ul",
        items: p.campaigns.map((c) => c.name + (c.active ? "" : " (вимкнена)")),
      },
    ]),
    {
      type: "note",
      text: "Якщо товар визначено неправильно, змініть його в таблиці кампаній - ручна прив'язка має пріоритет над назвою.",
    },
  ]
}

function initialNotifications(products: LinkedProduct[]): Notification[] {
  const linkedCampaigns = products.reduce((n, p) => n + p.campaigns.length, 0)
  return [
    {
      id: "autolinked",
      source: "Кампанії",
      importance: "info",
      title:
        linkedCampaigns +
        " " +
        plural(linkedCampaigns, "кампанія", "кампанії", "кампаній") +
        " автоматично " +
        plural(
          linkedCampaigns,
          "прив'язалась",
          "прив'язались",
          "прив'язались"
        ) +
        (products.length === 1 ? " до товару" : " до товарів"),
      body: "За ID товару в назві кампанії",
      time: "5 хв тому",
      unread: true,
      details: autoLinkedDetails(products),
      action: { label: "До кампаній", to: "/campaigns" },
    },
    {
      id: "ad-account-token",
      source: "Інтеграції",
      importance: "critical",
      title: "Кабінет «Neo Ads · Facebook 2» відключився",
      body: "Токен доступу прострочено - витрати не оновлюються",
      time: "1 год тому",
      unread: true,
      details: [
        {
          type: "p",
          text: "Facebook відкликав токен доступу до кабінету **Neo Ads · Facebook 2**. Поки кабінет не перепідключено:",
        },
        {
          type: "ul",
          items: [
            "витрати, покази й кліки не оновлюються",
            "ціна ліда, ROI і ROMI рахуються за неповними даними",
            "нові кампанії з цього кабінету не з'являться в таблиці",
          ],
        },
        { type: "h", text: "Як перепідключити" },
        {
          type: "ol",
          items: [
            "Відкрийте **Інтеграції**",
            "Натисніть **Перепідключити** біля кабінету",
            "Увійдіть у Facebook акаунтом власника кабінету",
          ],
        },
      ],
      action: { label: "Перепідключити", to: "/integrations" },
    },
    {
      id: "low-balance",
      source: "Баланс",
      importance: "warning",
      title: "Балансу вистачить на 3 дні",
      time: "3 год тому",
      unread: true,
      details: [
        {
          type: "p",
          text: "На балансі **$12.30**, середня витрата за останні 7 днів - **$4.10 на день**.",
        },
        { type: "hr" },
        {
          type: "p",
          text: "Коли баланс закінчиться, статистика перестане оновлюватись, а дашборд і таблиця кампаній покажуть дані на момент зупинки.",
        },
      ],
      action: { label: "Поповнити", to: "/settings?section=billing" },
    },
    {
      id: "team-joined",
      source: "Команда",
      importance: "info",
      title: "Олег Кравець прийняв запрошення до команди",
      time: "Вчора",
      unread: false,
      action: { label: "Відкрити", to: "/settings?section=team" },
    },
    {
      id: "crm-sync",
      source: "CRM",
      importance: "info",
      title: "Підтягнуто 1 284 замовлення з LP CRM за тиждень",
      time: "2 дн тому",
      unread: false,
    },
  ]
}

function NotificationItem({
  n,
  onAction,
}: {
  n: Notification
  onAction: (n: Notification) => void
}) {
  const level = IMPORTANCE[n.importance]
  return (
    <li
      className={cn(
        "relative flex gap-2.5 px-3 py-3",
        n.unread && "bg-primary/[0.035]"
      )}
    >
      <level.icon
        aria-label={level.label}
        className={cn("mt-px size-4 shrink-0", level.cls)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={cn(
            "pr-4 text-[13px] leading-snug",
            n.unread ? "font-semibold" : "font-medium"
          )}
        >
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs leading-snug text-muted-foreground">{n.body}</p>
        )}
        <div className="mt-0.5 flex min-h-6 items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {n.source} · {n.time}
          </span>
          {(n.details || n.action) && (
            <Button variant="outline" size="xs" onClick={() => onAction(n)}>
              {n.details ? "Переглянути" : n.action?.label}
            </Button>
          )}
        </div>
      </div>
      {n.unread && (
        <span
          aria-label="Непрочитане"
          className="absolute top-4 right-3 size-2 rounded-full bg-primary"
        />
      )}
    </li>
  )
}

// **bold** → <strong>; everything else stays plain text
function Inline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <Inline text={block.text} />
        </p>
      )
    case "h":
      return (
        <h3 className="pt-2 text-sm font-semibold text-foreground">
          <Inline text={block.text} />
        </h3>
      )
    case "ul":
    case "ol": {
      const List = block.type
      return (
        <List
          className={cn(
            "flex flex-col gap-1 pl-5",
            block.type === "ul"
              ? "list-disc marker:text-muted-foreground/60"
              : "list-decimal marker:text-muted-foreground"
          )}
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-0.5">
              <Inline text={item} />
            </li>
          ))}
        </List>
      )
    }
    case "note":
      return (
        <p className="border-l-2 pl-3 text-muted-foreground">
          <Inline text={block.text} />
        </p>
      )
    case "hr":
      return <hr className="my-1" />
  }
}

function NotificationDialog({
  n,
  open,
  onOpenChange,
}: {
  n: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  if (!n) return null
  const level = IMPORTANCE[n.importance]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="gap-1 px-5 pt-5 pr-12 pb-3">
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <level.icon
              aria-label={level.label}
              className={cn("size-3.5 shrink-0", level.cls)}
            />
            {n.source} · {n.time}
          </DialogDescription>
          <DialogTitle className="text-base leading-snug">
            {n.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5 text-sm leading-relaxed text-foreground/85">
          {n.details?.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>

        <DialogFooter className="border-t px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрити
          </Button>
          {n.action && (
            <Button
              onClick={() => {
                onOpenChange(false)
                navigate(n.action!.to)
              }}
            >
              {n.action.label}
              <IconArrowRight />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const LINKED_PRODUCTS = autoLinkedProducts()

export function NotificationsMenu() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() =>
    initialNotifications(LINKED_PRODUCTS)
  )
  const [open, setOpen] = useState(false)
  // kept after closing so the dialog can animate out with its content
  const [viewing, setViewing] = useState<Notification | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const unread = items.filter((n) => n.unread).length

  function markRead(id: string) {
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }
  function markAllRead() {
    setItems((list) => list.map((n) => ({ ...n, unread: false })))
  }
  function runAction(n: Notification) {
    markRead(n.id)
    setOpen(false)
    if (n.details) {
      setViewing(n)
      setViewOpen(true)
    } else if (n.action) navigate(n.action.to)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="secondary"
              size="icon"
              className="relative"
              aria-label={
                unread ? `Сповіщення: ${unread} непрочитаних` : "Сповіщення"
              }
            >
              <IconBell />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-none font-bold text-white tabular-nums ring-2 ring-background">
                  {unread}
                </span>
              )}
            </Button>
          }
        />
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl p-0"
        >
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Сповіщення</span>
              {unread > 0 && (
                <Badge className="h-5 px-1.5 tabular-nums">{unread}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={markAllRead}
              disabled={unread === 0}
              className="text-muted-foreground"
            >
              <IconChecks />
              Прочитати всі
            </Button>
          </div>
          <ul className="max-h-[min(480px,calc(100vh-8rem))] divide-y overflow-y-auto">
            {items.map((n) => (
              <NotificationItem key={n.id} n={n} onAction={runAction} />
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <NotificationDialog
        n={viewing}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
    </>
  )
}
