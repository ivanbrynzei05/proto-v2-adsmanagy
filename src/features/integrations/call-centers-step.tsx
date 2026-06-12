import {
  IconCheck,
  IconHeadset,
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
import {
  UPSELL_FEE_TYPES,
  pluralizeCallCenter,
  type CallCenter,
  type UpsellFeeType,
} from "./types"

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

export function CallCentersStep({
  callCenters,
  setCallCenters,
  animate = true,
}: {
  callCenters: CallCenter[]
  setCallCenters: Dispatch<SetStateAction<CallCenter[]>>
  animate?: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [centerToDelete, setCenterToDelete] = useState<number | null>(null)
  const hasCenters = callCenters.length > 0

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
          Додайте колцентри та умови оплати, щоб бачити маржу та допродажі в
          аналітиці
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
