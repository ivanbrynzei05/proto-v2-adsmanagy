import {
  IconArrowRight,
  IconCheck,
  IconCircleCheck,
  IconDatabase,
  IconInfoCircle,
  IconLoader2,
  IconTrash,
  IconWand,
} from "@tabler/icons-react"
import { useState, type Dispatch, type SetStateAction } from "react"

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
  dot: string
  required?: boolean
}

const STATUS_BUCKETS: StatusBucket[] = CRM_STATUS_CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
  dot: c.dot,
  required: c.required,
}))

const VALID_BUCKET_KEYS = new Set<string>(STATUS_BUCKETS.map((b) => b.key))

// A status counts as placed only when it sits in a bucket we actually surface.
// Auto-match can occasionally guess a bucket we don't show - treat those as
// still loose so the user can place them rather than silently losing them.
const isStatusPlaced = (mapping: CrmStatusMapping, id: string) =>
  Boolean(mapping[id]) && VALID_BUCKET_KEYS.has(mapping[id])

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

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Статуси з CRM:</span>
        {statuses.map((s) => (
          <Badge key={s.id} variant="outline" className="gap-1 font-normal">
            <span className="font-mono text-[11px] font-semibold tabular-nums">
              {s.id}
            </span>
            {s.name}
          </Badge>
        ))}
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

      <div className="flex max-h-[42vh] flex-col gap-2 overflow-y-auto pr-1">
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
      </div>
    </div>
  )
}

type Phase = "form" | "connecting" | "mapping"

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
  const [phase, setPhase] = useState<Phase>("form")
  const [statuses, setStatuses] = useState<CrmStatusOption[]>([])
  const [mapping, setMapping] = useState<CrmStatusMapping>({})

  const reset = () => {
    setSelected(null)
    setSubdomain("")
    setApiKey("")
    setPhase("form")
    setStatuses([])
    setMapping({})
  }

  const accountLabel = `https://${subdomain}.lp-crm.com`

  const canConnect =
    selected === "LP CRM" && subdomain.trim() !== "" && apiKey.trim() !== ""

  const allRequiredSatisfied = CRM_STATUS_CATEGORIES.filter(
    (c) => c.required
  ).every((c) => Object.values(mapping).includes(c.key))

  const handleConnect = () => {
    setPhase("connecting")
    // Mock the API round-trip that fetches the account's order statuses.
    window.setTimeout(() => {
      setStatuses(MOCK_CRM_STATUSES)
      // Pre-fill confident guesses so the user only resolves the ambiguous ones.
      const initial: CrmStatusMapping = {}
      for (const s of MOCK_CRM_STATUSES) {
        const guess = autoMatchStatus(s.name)
        if (guess) initial[s.id] = guess
      }
      setMapping(initial)
      setPhase("mapping")
    }, 1100)
  }

  const handleSave = () => {
    if (!selected) return
    onAdd({
      type: selected,
      label: accountLabel,
      statuses,
      statusMapping: mapping,
    })
    onOpenChange(false)
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
            {phase === "mapping" ? "Співставлення статусів" : "Підключення CRM"}
          </DialogTitle>
          <DialogDescription>
            {phase === "mapping"
              ? "Звʼяжіть статуси вашої CRM з категоріями нашої аналітики"
              : "Оберіть CRM-систему та заповніть дані для підключення"}
          </DialogDescription>
        </DialogHeader>

        {phase === "form" && (
          <>
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
          </>
        )}

        {phase === "connecting" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Підключаємось до CRM…</p>
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
          {phase === "mapping" ? (
            <>
              <Button variant="secondary" onClick={() => setPhase("form")}>
                Назад
              </Button>
              <Button
                disabled={!allRequiredSatisfied}
                className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={handleSave}
              >
                <IconCheck className="size-4" />
                Зберегти та підключити
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled={phase === "connecting"}
                onClick={() => onOpenChange(false)}
              >
                Скасувати
              </Button>
              <Button
                disabled={!canConnect || phase === "connecting"}
                className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={handleConnect}
              >
                {phase === "connecting" && (
                  <IconLoader2 className="size-4 animate-spin" />
                )}
                {phase === "connecting" ? "Підключення…" : "Підключити"}
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
  const [addOpen, setAddOpen] = useState(false)
  const [crmToDelete, setCrmToDelete] = useState<number | null>(null)
  const hasCrms = connectedCrms.length > 0

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
            onClick={() => setAddOpen(true)}
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
