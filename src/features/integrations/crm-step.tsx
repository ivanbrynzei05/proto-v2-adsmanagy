import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconDatabase,
  IconInfoCircle,
  IconKey,
  IconListCheck,
  IconLoader2,
  IconPencil,
  IconSearch,
  IconTrash,
  IconWand,
  IconX,
} from "@tabler/icons-react"
import {
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CrmLogo } from "./logos"
import {
  autoMatchStatus,
  CRM_STATUS_CATEGORIES,
  CRM_TYPES,
  MOCK_CRM_STATUSES,
  pluralizeIntegration,
  type ConnectedCrm,
  type CrmStatusBucket,
  type CrmStatusMapping,
  type CrmStatusOption,
  type CrmType,
} from "./types"

// The analytics categories a CRM status can land in. Every status ends up in
// one of them - there is no "don't count it" bucket - and the mapping starts
// out empty, so the list is the work the user came here to do.
type StatusBucket = {
  key: CrmStatusBucket
  label: string
  short: string
  hint: string
  dot: string
  tint: string
  required?: boolean
}

const STATUS_BUCKETS: StatusBucket[] = CRM_STATUS_CATEGORIES

const VALID_BUCKET_KEYS = new Set<string>(STATUS_BUCKETS.map((b) => b.key))

// A status counts as placed only when it sits in a category we still surface -
// a connection saved under an older set of categories reopens as unplaced
// rather than silently keeping a bucket that no longer exists.
const isStatusPlaced = (mapping: CrmStatusMapping, id: string) =>
  Boolean(mapping[id]) && VALID_BUCKET_KEYS.has(mapping[id])

// The category a status belongs to, or undefined while it's still unplaced.
const bucketOf = (mapping: CrmStatusMapping, id: string) =>
  STATUS_BUCKETS.find((b) => b.key === mapping[id])

// Fades whichever edge still has content behind it, so a cut-off list looks cut
// off instead of finished.
const EDGE_FADE = {
  none: "",
  bottom:
    "[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_28px),transparent)]",
  top: "[mask-image:linear-gradient(to_top,#000_calc(100%_-_28px),transparent)]",
  both: "[mask-image:linear-gradient(to_bottom,transparent,#000_28px,#000_calc(100%_-_28px),transparent)]",
}

// A scroll area that admits it scrolls. The native scrollbar is no help here -
// macOS keeps it hidden until something moves - so it's switched off and drawn
// by hand instead: a track that's always on screen with a thumb sized to how
// much of the content fits, plus a faded edge wherever there's more behind it.
function ScrollBox({
  className,
  rootClassName,
  children,
}: {
  className?: string
  /** on the positioned wrapper - how the box sits in its parent's layout */
  rootClassName?: string
  children: ReactNode
}) {
  const [bar, setBar] = useState({
    scrollable: false,
    top: false,
    bottom: false,
    thumbTop: 0,
    thumbSize: 100,
  })

  // Runs on mount (via the ref), on every render and on every scroll, so the
  // thumb keeps up with content that grows. Bails out when nothing moved - the
  // ref callback re-fires each render, and fresh state every time would spin.
  const measure = (el: HTMLDivElement | null) => {
    if (!el) return
    const room = el.scrollHeight - el.clientHeight
    const size = Math.max((el.clientHeight / el.scrollHeight) * 100, 12)
    const next = {
      scrollable: room > 2,
      top: el.scrollTop > 2,
      bottom: Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 2,
      thumbTop: room > 0 ? (el.scrollTop / room) * (100 - size) : 0,
      thumbSize: size,
    }
    setBar((prev) =>
      (Object.keys(next) as (keyof typeof next)[]).every(
        (k) => prev[k] === next[k]
      )
        ? prev
        : next
    )
  }

  const fade =
    bar.top && bar.bottom
      ? EDGE_FADE.both
      : bar.bottom
        ? EDGE_FADE.bottom
        : bar.top
          ? EDGE_FADE.top
          : EDGE_FADE.none

  return (
    <div className={cn("relative", rootClassName)}>
      <div
        ref={measure}
        onScroll={(e) => measure(e.currentTarget)}
        className={cn(
          "[scrollbar-width:none] overflow-y-auto pr-3 [&::-webkit-scrollbar]:hidden",
          fade,
          className
        )}
      >
        {children}
      </div>
      {bar.scrollable && (
        <div className="pointer-events-none absolute inset-y-0.5 right-0 w-1.5 rounded-full bg-foreground/[0.07]">
          <div
            className="absolute inset-x-0 rounded-full bg-foreground/25"
            style={{ top: `${bar.thumbTop}%`, height: `${bar.thumbSize}%` }}
          />
        </div>
      )}
    </div>
  )
}

// The two filters that aren't categories: everything, and everything still loose.
const FILTER_ALL = "all"
const FILTER_LOOSE = "loose"
type FilterKey = typeof FILTER_ALL | typeof FILTER_LOOSE | CrmStatusBucket

// One line of the category rail beside the list. The rail is the only place
// categories are listed and it does double duty: with nothing selected a line
// filters the list, with rows selected it's where that selection goes. It runs
// down the side rather than across the top, so a seventh or tenth category is
// just another line instead of another squeeze.
//
// "filter" - a line you can look through; "assign" - a line you can send the
// selection to; "off" - "Усі" and "Не розподілені" while assigning, since a
// selection can't be moved into either of them.
type RailMode = "filter" | "assign" | "off"

function RailItem({
  label,
  count,
  dot,
  hint,
  mode,
  active,
  onClick,
}: {
  label: string
  count: number
  dot?: string
  hint?: string
  mode: RailMode
  active: boolean
  onClick: () => void
}) {
  const item = (
    <button
      type="button"
      disabled={mode === "off"}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
        mode === "off" && "opacity-40",
        // flat fill for the active line, like the app's own sidebar - no
        // raised pill floating on the rail
        mode === "filter" &&
          (active
            ? "bg-foreground/[0.08] font-medium text-foreground"
            : "text-muted-foreground hover:bg-foreground/[0.04]"),
        // raised while assigning, so the rail reads as a set of targets
        mode === "assign" &&
          "bg-background ring-1 ring-border hover:ring-foreground/30"
      )}
    >
      {/* the spacer keeps "Усі" aligned with the categories below it */}
      <span className={cn("size-2 shrink-0 rounded-full", dot)} />
      <span className="truncate">{label}</span>
      <span className="ml-auto pl-1 tabular-nums opacity-60">{count}</span>
    </button>
  )
  if (!hint) return item
  return (
    <Tooltip>
      <TooltipTrigger render={item} />
      <TooltipContent side="right" className="max-w-[280px] leading-relaxed">
        {hint}
      </TooltipContent>
    </Tooltip>
  )
}

// One status in the list. The whole row is a selection target - that's what
// makes sorting a hundred statuses bearable - so the per-row category picker
// stops the click from reaching it.
function StatusRow({
  status,
  bucket,
  checked,
  onToggle,
  onAssign,
}: {
  status: CrmStatusOption
  bucket?: StatusBucket
  checked: boolean
  onToggle: (extend: boolean) => void
  onAssign: (bucket: CrmStatusBucket) => void
}) {
  return (
    <div
      onClick={(e) => onToggle(e.shiftKey)}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1 transition-colors select-none",
        checked ? "bg-foreground/[0.06]" : "hover:bg-muted/60"
      )}
    >
      <Checkbox checked={checked} onCheckedChange={() => {}} />
      <Badge
        variant="secondary"
        className="w-11 shrink-0 justify-center rounded-md font-mono text-[11px] tabular-nums"
      >
        {status.id}
      </Badge>
      <span className="truncate text-sm">{status.name}</span>
      <div className="ml-auto pl-2" onClick={(e) => e.stopPropagation()}>
        <Select
          value={bucket?.key ?? ""}
          onValueChange={(v) => onAssign(v as CrmStatusBucket)}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              "w-45",
              bucket ? bucket.tint : "border-dashed text-muted-foreground"
            )}
          >
            <SelectValue>
              {(v: string) => {
                const b = STATUS_BUCKETS.find((x) => x.key === v)
                return b ? (
                  <>
                    <span
                      className={cn("size-2 shrink-0 rounded-full", b.dot)}
                    />
                    {b.short}
                  </>
                ) : (
                  "Оберіть категорію"
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {STATUS_BUCKETS.map((b) => (
              <SelectItem key={b.key} value={b.key}>
                <span className={cn("size-2 shrink-0 rounded-full", b.dot)} />
                {b.short}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Sorting an account's hundred-odd statuses one dropdown at a time would take
// all day, so the screen is built around bulk work: auto-match does the obvious
// ones, the filters narrow the list to what's left, and a selection of rows
// goes into a category in one click. The per-row picker stays for the handful
// of statuses that need a decision of their own.
function StatusMappingStep({
  accountLabel,
  statuses,
  mapping,
  setMapping,
}: {
  accountLabel: string
  statuses: CrmStatusOption[]
  mapping: CrmStatusMapping
  setMapping: Dispatch<SetStateAction<CrmStatusMapping>>
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterKey>(FILTER_ALL)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  // Where the last click landed, so shift-click knows what range to take.
  const anchor = useRef<string | null>(null)

  const placed = statuses.filter((s) => isStatusPlaced(mapping, s.id)).length
  const countIn = (key: CrmStatusBucket) =>
    statuses.filter((s) => mapping[s.id] === key).length

  // The CRM hands the statuses back in its own order; the list shows them by
  // id, so a status is where its number says it is.
  const ordered = [...statuses].sort(
    (a, b) => Number(a.id) - Number(b.id) || a.id.localeCompare(b.id)
  )

  const q = query.trim().toLowerCase()
  const visible = ordered.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) && !s.id.includes(q))
      return false
    if (filter === FILTER_ALL) return true
    if (filter === FILTER_LOOSE) return !isStatusPlaced(mapping, s.id)
    return mapping[s.id] === filter
  })

  const assign = (ids: string[], bucket: CrmStatusBucket) =>
    setMapping((prev) => {
      const next = { ...prev }
      for (const id of ids) next[id] = bucket
      return next
    })

  // Bulk assignment empties the selection: the rows it touched usually leave
  // the current filter, and keeping them selected off-screen only misleads.
  const assignPicked = (bucket: CrmStatusBucket) => {
    assign([...picked], bucket)
    setPicked(new Set())
  }

  const toggle = (id: string, extend: boolean) => {
    setPicked((prev) => {
      const next = new Set(prev)
      const from = visible.findIndex((s) => s.id === anchor.current)
      const to = visible.findIndex((s) => s.id === id)
      // Shift-click takes everything between the two rows, as in a file list.
      if (extend && from !== -1 && to !== -1) {
        const [a, b] = from < to ? [from, to] : [to, from]
        for (let i = a; i <= b; i++) next.add(visible[i].id)
        return next
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    anchor.current = id
  }

  const pickedVisible = visible.filter((s) => picked.has(s.id)).length
  const allVisiblePicked =
    visible.length > 0 && pickedVisible === visible.length
  // A selection turns the category grid from filters into drop targets.
  const assigning = picked.size > 0

  // An accelerator, never a starting point: the screen opens empty, and this
  // only fills in the statuses the user hasn't decided on yet.
  const autoMatch = () =>
    setMapping((prev) => {
      const next = { ...prev }
      for (const s of statuses) {
        if (isStatusPlaced(next, s.id)) continue
        const guess = autoMatchStatus(s.name)
        if (guess) next[s.id] = guess
      }
      return next
    })

  return (
    // A fixed overall height with the list taking whatever is left: filters,
    // a search that finds four statuses, or a category grid that grows by a
    // row - none of it moves the dialog.
    <div className="flex h-[66vh] flex-col gap-3">
      {/* The job of this screen, stated once and hard to miss - with the
          account it applies to riding along on the same strip. */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
        <IconListCheck className="size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm font-medium">
          Звʼяжіть статуси вашої CRM з категоріями нашої аналітики
        </p>
        <span className="ml-auto flex min-w-0 items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <IconCircleCheck className="size-3.5 shrink-0" />
          <span className="truncate">{accountLabel}</span>
        </span>
      </div>

      {/* How far the sorting has got: one segment per category, the grey tail
          is what nobody has placed yet. */}
      <div className="flex items-center gap-3">
        <span className="text-sm whitespace-nowrap">
          <span className="font-semibold tabular-nums">{placed}</span>
          <span className="text-muted-foreground"> з {statuses.length}</span>
        </span>
        <div className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full bg-muted">
          {STATUS_BUCKETS.map((b) => {
            const share = statuses.length
              ? (countIn(b.key) / statuses.length) * 100
              : 0
            return (
              <div
                key={b.key}
                className={cn("h-full transition-all", b.dot)}
                style={{ width: `${share}%` }}
              />
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={autoMatch}
        >
          <IconWand className="size-3.5" />
          Авто-співставлення
        </Button>
      </div>

      <div className="relative">
        <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук статусу"
          className="pl-8"
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
        {/* Filters while nothing is selected, targets once something is. */}
        <div className="flex w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-muted/25 p-1.5">
          <RailItem
            label="Усі"
            count={statuses.length}
            mode={assigning ? "off" : "filter"}
            active={filter === FILTER_ALL}
            onClick={() => setFilter(FILTER_ALL)}
          />
          <RailItem
            label="Не розподілені"
            count={statuses.length - placed}
            mode={assigning ? "off" : "filter"}
            active={filter === FILTER_LOOSE}
            onClick={() => setFilter(FILTER_LOOSE)}
          />
          <div className="my-1 h-px shrink-0 bg-border" />
          {STATUS_BUCKETS.map((b) => (
            <RailItem
              key={b.key}
              label={b.short}
              count={countIn(b.key)}
              dot={b.dot}
              hint={b.hint}
              mode={assigning ? "assign" : "filter"}
              active={filter === b.key}
              onClick={() =>
                assigning ? assignPicked(b.key) : setFilter(b.key)
              }
            />
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 shrink-0 items-center gap-2 border-b px-2">
            <Checkbox
              checked={allVisiblePicked}
              indeterminate={pickedVisible > 0 && !allVisiblePicked}
              disabled={visible.length === 0}
              onCheckedChange={(checked) =>
                setPicked((prev) => {
                  const next = new Set(prev)
                  for (const s of visible) {
                    if (checked) next.add(s.id)
                    else next.delete(s.id)
                  }
                  return next
                })
              }
            />
            {assigning ? (
              <>
                <span className="text-xs whitespace-nowrap">
                  Обрано{" "}
                  <span className="font-semibold tabular-nums">
                    {picked.size}
                  </span>
                </span>
                {/* points back at the rail, where the selection can land */}
                <IconArrowLeft className="size-3.5 shrink-0 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto shrink-0 text-muted-foreground"
                  aria-label="Зняти виділення"
                  onClick={() => setPicked(new Set())}
                >
                  <IconX className="size-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">
                {visible.length === statuses.length
                  ? `${statuses.length} статусів`
                  : `${visible.length} з ${statuses.length}`}
              </span>
            )}
          </div>

          <ScrollBox
            rootClassName="min-h-0 flex-1"
            className="flex h-full flex-col gap-0.5 p-1.5"
          >
            {visible.map((s) => (
              <StatusRow
                key={s.id}
                status={s}
                bucket={bucketOf(mapping, s.id)}
                checked={picked.has(s.id)}
                onToggle={(extend) => toggle(s.id, extend)}
                onAssign={(bucket) => assign([s.id], bucket)}
              />
            ))}
            {visible.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Нічого не знайдено
              </p>
            )}
          </ScrollBox>
        </div>
      </div>
    </div>
  )
}

// Editing opens on "choose" - credentials and status mapping are separate jobs,
// so the dialog asks which one first instead of walking through both. Connecting
// a new CRM starts at "form" and goes through every screen in order.
type Phase = "choose" | "form" | "connecting" | "mapping"

// "https://myaccount.lp-crm.com" -> "myaccount"
const subdomainOf = (label?: string) =>
  (label ?? "").replace(/^https?:\/\//, "").replace(/\.lp-crm\.com$/, "")

// Connects a new CRM, or - when `initial` is given - reopens an existing one so
// its credentials and status mapping can be changed. The two modes share every
// screen; only the entry data, the wording and the save action differ.
function CrmDialog({
  open,
  onOpenChange,
  initial = null,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ConnectedCrm | null
  onSave: (crm: ConnectedCrm) => void
}) {
  const editing = initial !== null
  const [selected, setSelected] = useState<CrmType | null>(
    initial?.type ?? null
  )
  const [subdomain, setSubdomain] = useState(() => subdomainOf(initial?.label))
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "")
  const [phase, setPhase] = useState<Phase>(editing ? "choose" : "form")
  const [statuses, setStatuses] = useState<CrmStatusOption[]>(
    initial?.statuses ?? []
  )
  const [mapping, setMapping] = useState<CrmStatusMapping>(
    initial?.statusMapping ?? {}
  )

  const reset = () => {
    setSelected(initial?.type ?? null)
    setSubdomain(subdomainOf(initial?.label))
    setApiKey(initial?.apiKey ?? "")
    setPhase(editing ? "choose" : "form")
    setStatuses(initial?.statuses ?? [])
    setMapping(initial?.statusMapping ?? {})
  }

  const accountLabel = `https://${subdomain}.lp-crm.com`

  const canConnect =
    selected === "LP CRM" && subdomain.trim() !== "" && apiKey.trim() !== ""

  // Editing only has to re-check the connection when the credentials moved;
  // otherwise the saved statuses are still valid and the mapping opens straight away.
  const credentialsChanged =
    subdomain !== subdomainOf(initial?.label) ||
    apiKey !== (initial?.apiKey ?? "")

  const allRequiredSatisfied = CRM_STATUS_CATEGORIES.filter(
    (c) => c.required
  ).every((c) => Object.values(mapping).includes(c.key))

  const handleConnect = () => {
    setPhase("connecting")
    // Mock the API round-trip that fetches the account's order statuses.
    window.setTimeout(() => {
      setStatuses(MOCK_CRM_STATUSES)
      // Nothing is guessed on the way in: a fresh connection lands on an empty
      // mapping and the user places the statuses. Decisions already made on a
      // re-check survive untouched.
      setPhase("mapping")
    }, 1100)
  }

  // "Статуси" from the choose screen: the saved list is good enough to remap
  // straight away; only a connection that never stored one has to fetch first.
  const openMapping = () => {
    if (statuses.length > 0) setPhase("mapping")
    else handleConnect()
  }

  const handleSave = () => {
    if (!selected) return
    onSave({
      type: selected,
      label: accountLabel,
      apiKey,
      statuses,
      statusMapping: mapping,
    })
    onOpenChange(false)
  }

  // Primary action of the credentials screen. Untouched credentials just save;
  // changed ones are re-checked, which lands on the mapping to confirm the
  // statuses the account came back with.
  const handleFormPrimary = () => {
    if (editing && !credentialsChanged) handleSave()
    else handleConnect()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent
        className={cn(
          "z-[60] data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2",
          phase === "mapping" ? "max-w-4xl" : "max-w-md"
        )}
        overlayClassName="z-[60] backdrop-blur-md"
      >
        <DialogHeader>
          <DialogTitle>
            {phase === "mapping"
              ? "Співставлення статусів"
              : phase === "choose"
                ? "Редагування CRM"
                : phase === "connecting"
                  ? editing
                    ? "Перевірка підключення"
                    : "Підключення CRM"
                  : editing
                    ? "Дані підключення"
                    : "Підключення CRM"}
          </DialogTitle>
          {/* The mapping screen says what to do in its own banner, loud enough
              that a grey line under the title would only repeat it. */}
          {phase !== "mapping" && (
            <DialogDescription>
              {phase === "choose"
                ? "Оберіть, що саме змінити"
                : editing
                  ? "Змініть API ключ або адресу акаунту"
                  : "Оберіть CRM-систему та заповніть дані для підключення"}
            </DialogDescription>
          )}
        </DialogHeader>

        {phase === "choose" && initial && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <CrmLogo type={initial.type} className="size-9 text-sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{initial.type}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {initial.label}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase("form")}
              className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <IconKey className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Дані підключення
                </span>
                <span className="block text-xs text-muted-foreground">
                  API ключ і адреса акаунту
                </span>
              </span>
              <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={openMapping}
              className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <IconListCheck className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Співставлення статусів
                </span>
                <span className="block text-xs text-muted-foreground">
                  Розподіл статусів CRM за категоріями аналітики
                </span>
              </span>
              <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        )}

        {phase === "form" && (
          <>
            {/* an integration can't be moved to another CRM, so editing shows
                the system it belongs to instead of the picker */}
            {editing ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <CrmLogo type={initial.type} className="size-9 text-sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{initial.type}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {initial.label}
                  </p>
                </div>
              </div>
            ) : (
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
            )}
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
          </>
        )}

        {phase === "connecting" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">
                {editing ? "Перевіряємо підключення…" : "Підключаємось до CRM…"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Перевіряємо ключ і завантажуємо статуси замовлень
              </p>
            </div>
          </div>
        )}

        {phase === "mapping" && (
          <StatusMappingStep
            accountLabel={accountLabel}
            statuses={statuses}
            mapping={mapping}
            setMapping={setMapping}
          />
        )}

        <DialogFooter className="sm:justify-end">
          {phase === "choose" ? (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Закрити
            </Button>
          ) : phase === "mapping" ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setPhase(editing ? "choose" : "form")}
              >
                Назад
              </Button>
              <Button
                disabled={!allRequiredSatisfied}
                className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={handleSave}
              >
                <IconCheck className="size-4" />
                {editing ? "Зберегти зміни" : "Зберегти та підключити"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled={phase === "connecting"}
                onClick={() =>
                  editing ? setPhase("choose") : onOpenChange(false)
                }
              >
                {editing ? "Назад" : "Скасувати"}
              </Button>
              <Button
                disabled={!canConnect || phase === "connecting"}
                className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={handleFormPrimary}
              >
                {phase === "connecting" && (
                  <IconLoader2 className="size-4 animate-spin" />
                )}
                {/* an untouched connection has nothing to re-check, so the
                    button saves outright instead of walking on to the statuses */}
                {phase === "connecting" ? (
                  editing ? (
                    "Перевірка…"
                  ) : (
                    "Підключення…"
                  )
                ) : editing ? (
                  credentialsChanged ? (
                    <>
                      Далі
                      <IconArrowRight className="size-4" />
                    </>
                  ) : (
                    <>
                      <IconCheck className="size-4" />
                      Зберегти
                    </>
                  )
                ) : (
                  "Підключити"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CrmStep({
  connectedCrms,
  setConnectedCrms,
  animate = true,
}: {
  connectedCrms: ConnectedCrm[]
  setConnectedCrms: Dispatch<SetStateAction<ConnectedCrm[]>>
  animate?: boolean
}) {
  // one dialog serves both jobs - "add" starts empty, "edit" opens the CRM at
  // that index with its credentials and mapping already filled in
  const [dialog, setDialog] = useState<
    { mode: "add" } | { mode: "edit"; index: number } | null
  >(null)
  const [crmToDelete, setCrmToDelete] = useState<number | null>(null)
  const hasCrms = connectedCrms.length > 0
  const editIndex = dialog?.mode === "edit" ? dialog.index : null

  return (
    <div className="flex flex-col gap-3">
      <Alert
        variant="info"
        className={cn(
          animate && "animate-in duration-300 fade-in slide-in-from-right-8"
        )}
      >
        <IconInfoCircle />
        <AlertDescription>
          Підключіть CRM-систему, щоб бачити ліди, апруви та дохід в аналітиці
        </AlertDescription>
      </Alert>
      <div
        className={cn(
          "rounded-lg border p-3.5",
          animate && "animate-in duration-300 fade-in slide-in-from-right-8"
        )}
        style={
          animate
            ? { animationDelay: "75ms", animationFillMode: "both" }
            : undefined
        }
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
            onClick={() => setDialog({ mode: "add" })}
          >
            <IconDatabase className="size-4" />
            {hasCrms ? "Додати ще" : "Додати CRM"}
          </Button>
        </div>
        {hasCrms && (
          <div className="mt-3 flex flex-col gap-2">
            {connectedCrms.map((crm, i) => {
              // A connection saved under an older set of categories can carry
              // buckets we no longer show - they don't count as mapped.
              const mappedCount = crm.statusMapping
                ? Object.values(crm.statusMapping).filter((b) =>
                    VALID_BUCKET_KEYS.has(b)
                  ).length
                : 0
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
                >
                  <div className="flex items-center gap-3">
                    <CrmLogo type={crm.type} className="size-9 text-xs" />
                    <div>
                      <p className="text-sm font-semibold">{crm.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {crm.label}
                        {mappedCount > 0 && (
                          <> · {mappedCount} статусів співставлено</>
                        )}
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
                      title="Редагувати підключення"
                      aria-label="Редагувати підключення"
                      onClick={() => setDialog({ mode: "edit", index: i })}
                    >
                      <IconPencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      title="Видалити підключення"
                      aria-label="Видалити підключення"
                      onClick={() => setCrmToDelete(i)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* keyed by target so opening it for another CRM starts from that CRM's data */}
      <CrmDialog
        key={editIndex === null ? "add" : "edit-" + editIndex}
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        initial={editIndex === null ? null : connectedCrms[editIndex]}
        onSave={(crm) =>
          setConnectedCrms((prev) =>
            editIndex === null
              ? [...prev, crm]
              : prev.map((c, i) => (i === editIndex ? crm : c))
          )
        }
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
