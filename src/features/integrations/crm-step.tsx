import {
  IconCheck,
  IconDatabase,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react"
import { useState, type Dispatch, type SetStateAction } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import lpCrmLogo from "@/assets/lp-crm.png"
import {
  CRM_LOGO_COLORS,
  CRM_LOGO_LETTERS,
  CRM_TYPES,
  pluralizeIntegration,
  type ConnectedCrm,
  type CrmType,
} from "./types"

function CrmLogo({ type, className }: { type: CrmType; className?: string }) {
  if (type === "LP CRM") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-md",
          className
        )}
      >
        <img src={lpCrmLogo} alt="LP CRM" className="h-full w-full object-contain" />
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
  const [acceptedOrderStatus, setAcceptedOrderStatus] = useState("")
  const [completedOrderStatus, setCompletedOrderStatus] = useState("")

  const reset = () => {
    setSelected(null)
    setSubdomain("")
    setApiKey("")
    setAcceptedOrderStatus("")
    setCompletedOrderStatus("")
  }

  const canSubmit =
    selected === "LP CRM"
      ? subdomain.trim() !== "" &&
        apiKey.trim() !== "" &&
        Number(acceptedOrderStatus) > 0 &&
        Number(completedOrderStatus) > 0
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
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Статус прийнятих
                </label>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={acceptedOrderStatus}
                  onChange={(e) =>
                    setAcceptedOrderStatus(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Статус завершених
                </label>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={completedOrderStatus}
                  onChange={(e) =>
                    setCompletedOrderStatus(e.target.value.replace(/\D/g, ""))
                  }
                />
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
                ...(selected === "LP CRM"
                  ? { acceptedOrderStatus, completedOrderStatus }
                  : {}),
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
