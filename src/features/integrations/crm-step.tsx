import {
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconDatabase,
  IconHelpCircle,
  IconInfoCircle,
  IconKey,
  IconListCheck,
  IconLoader2,
  IconPencil,
  IconTrash,
  IconWand,
} from "@tabler/icons-react"
import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

import lpCrmLogo from "@/assets/lp-crm.png"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  autoMatchStatus,
  CRM_LOGO_COLORS,
  CRM_LOGO_LETTERS,
  CRM_STATUS_CATEGORIES,
  CRM_STATUS_IGNORE,
  CRM_TYPES,
  MOCK_CRM_STATUSES,
  pluralizeIntegration,
  type ConnectedCrm,
  type CrmStatusBucket,
  type CrmStatusMapping,
  type CrmStatusOption,
  type CrmType,
} from "./types"

// The analytics buckets a CRM status can land in, in display order: the real
// categories first, then the "ignore" pseudo-bucket. Each bucket gets its own
// multiselect, so the user gathers every status that belongs to it in one place.
type StatusBucket = {
  key: CrmStatusBucket
  label: string
  hint: string
  dot: string
  tint: string
  required?: boolean
}

const STATUS_BUCKETS: StatusBucket[] = CRM_STATUS_CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
  hint: c.hint,
  dot: c.dot,
  tint: c.tint,
  required: c.required,
}))

const VALID_BUCKET_KEYS = new Set<string>(STATUS_BUCKETS.map((b) => b.key))

// A status counts as placed only when it sits in a bucket we actually surface.
// Auto-match can occasionally guess a bucket we don't show - treat those as
// still loose so the user can place them rather than silently losing them.
const isStatusPlaced = (mapping: CrmStatusMapping, id: string) =>
  Boolean(mapping[id]) && VALID_BUCKET_KEYS.has(mapping[id])

// The bucket a status currently belongs to, or undefined while it's loose.
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
  children,
}: {
  className?: string
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
    <div className="relative">
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

function CrmLogo({ type, className }: { type: CrmType; className?: string }) {
  if (type === "LP CRM") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-md",
          className
        )}
      >
        <img
          src={lpCrmLogo}
          alt="LP CRM"
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

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

// One analytics bucket and the statuses placed in it. The multiselect offers
// every status that's still free (or already here); statuses already claimed by
// another bucket aren't listed - the user removes them there first. Selected
// statuses show as removable chips.
function CategoryMappingRow({
  bucket,
  statuses,
  mapping,
  onChange,
}: {
  bucket: StatusBucket
  statuses: CrmStatusOption[]
  mapping: CrmStatusMapping
  onChange: (next: CrmStatusOption[]) => void
}) {
  const selected = statuses.filter((s) => mapping[s.id] === bucket.key)
  const available = statuses.filter(
    (s) => mapping[s.id] === bucket.key || !isStatusPlaced(mapping, s.id)
  )

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-2.5 transition-colors",
        selected.length > 0 ? "bg-muted/40" : "border-dashed"
      )}
    >
      <div className="flex items-center gap-2 pt-1.5 whitespace-nowrap">
        <span className={cn("size-2 shrink-0 rounded-full", bucket.dot)} />
        <span className="text-sm font-medium">
          {bucket.label}
          {bucket.required && (
            <span
              className="ml-0.5 text-rose-500"
              title="Обовʼязкова категорія"
            >
              *
            </span>
          )}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={`Які статуси обрати: ${bucket.label}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconHelpCircle className="size-4" />
              </button>
            }
          />
          <TooltipContent className="max-w-[280px] leading-relaxed">
            {bucket.hint}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="ml-auto flex items-start gap-2">
        <IconArrowRight className="size-6 shrink-0 pt-1.5 text-muted-foreground" />
        <Combobox<CrmStatusOption, true>
          multiple
          modal={false}
          items={available}
          value={selected}
          onValueChange={onChange}
          itemToStringLabel={(s) => s.name}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <div className="w-84 shrink-0">
            <ComboboxInputGroup>
              <ComboboxChips>
                {selected.map((s) => (
                  <ComboboxChip key={s.id} title={s.name}>
                    {s.id}
                  </ComboboxChip>
                ))}
                <ComboboxInput
                  placeholder={
                    selected.length > 0 ? "Додати статус…" : "Оберіть статуси…"
                  }
                />
              </ComboboxChips>
            </ComboboxInputGroup>
            <ComboboxContent align="start" className="w-84 max-w-none">
              <ComboboxEmpty>Немає вільних статусів</ComboboxEmpty>
              <ComboboxList>
                {(status: CrmStatusOption) => (
                  <ComboboxItem key={status.id} value={status}>
                    <Badge
                      variant="secondary"
                      className="shrink-0 rounded-md font-mono text-[11px] tabular-nums"
                    >
                      {status.id}
                    </Badge>
                    <span className="truncate">{status.name}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </div>
        </Combobox>
      </div>
    </div>
  )
}

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
  // Fill in confident guesses for any status the user hasn't touched yet.
  const autoMatch = () =>
    setMapping((prev) => {
      const next = { ...prev }
      for (const s of statuses) {
        if (next[s.id]) continue
        const guess = autoMatchStatus(s.name)
        if (guess) next[s.id] = guess
      }
      return next
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
        <IconCircleCheck className="size-4 shrink-0" />
        <span className="truncate">
          Підключено · <span className="font-medium">{accountLabel}</span>
        </span>
      </div>

      {/* Every status the account has. Each one takes on the colour of the
          category it lands in, so the wall of grey badges turns into a map of
          what's already sorted and what still needs a home. */}
      <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-2.5">
        <span className="text-xs text-muted-foreground">Статуси з CRM:</span>
        <ScrollBox className="flex max-h-32 flex-wrap gap-1.5">
          {statuses.map((s) => {
            const bucket = bucketOf(mapping, s.id)
            return (
              <Badge
                key={s.id}
                variant="outline"
                className={cn(
                  "gap-1 font-normal transition-colors",
                  bucket?.tint
                )}
              >
                <span className="font-mono text-[11px] font-semibold tabular-nums">
                  {s.id}
                </span>
                {s.name}
              </Badge>
            )
          })}
        </ScrollBox>
      </div>

      <div className="flex items-center justify-end">
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

      <ScrollBox className="flex max-h-[42vh] flex-col gap-2">
        {STATUS_BUCKETS.map((bucket) => (
          <CategoryMappingRow
            key={bucket.key}
            bucket={bucket}
            statuses={statuses}
            mapping={mapping}
            onChange={(next) =>
              setMapping((prev) => {
                const updated = { ...prev }
                const nextIds = new Set(next.map((s) => s.id))
                // Drop statuses that left this bucket…
                for (const s of statuses) {
                  if (updated[s.id] === bucket.key && !nextIds.has(s.id)) {
                    delete updated[s.id]
                  }
                }
                // …and (re)assign the current picks to it.
                for (const id of nextIds) updated[id] = bucket.key
                return updated
              })
            }
          />
        ))}
      </ScrollBox>
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
      setMapping((prev) => {
        const next: CrmStatusMapping = {}
        for (const s of MOCK_CRM_STATUSES) {
          // Decisions already made survive a re-check; only statuses nobody has
          // placed yet get a guess, so the user resolves just the ambiguous ones.
          const kept = prev[s.id]
          if (kept) {
            next[s.id] = kept
            continue
          }
          const guess = autoMatchStatus(s.name)
          if (guess) next[s.id] = guess
        }
        return next
      })
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
          phase === "mapping" ? "max-w-3xl" : "max-w-md"
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
          <DialogDescription>
            {phase === "mapping"
              ? "Звʼяжіть статуси вашої CRM з категоріями нашої аналітики"
              : phase === "choose"
                ? "Оберіть, що саме змінити"
                : editing
                  ? "Змініть API ключ або адресу акаунту"
                  : "Оберіть CRM-систему та заповніть дані для підключення"}
          </DialogDescription>
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
              const mappedCount = crm.statusMapping
                ? Object.values(crm.statusMapping).filter(
                    (b) => b !== CRM_STATUS_IGNORE
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
