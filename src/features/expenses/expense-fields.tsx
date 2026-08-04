import { IconHelpCircle, IconPencil } from "@tabler/icons-react"
import { useState } from "react"

import { useExpenses } from "@/components/expenses-provider"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ExpenseField } from "@/features/expenses/types"
import { cn } from "@/lib/utils"

// A value the user has set, shown the way the analytics reads it. Editing lives
// behind the button, so the page stays a summary until something is changed -
// the same rhythm as the call-centre list.
function ExpenseTile({
  field,
  value,
  onEdit,
}: {
  field: ExpenseField
  value: string
  onEdit: () => void
}) {
  const { icon: Icon, label, note, hint, suffix } = field
  const isSet = value.trim() !== ""

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{label}</span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Що це: ${label}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <IconHelpCircle className="size-4" />
                  </button>
                }
              />
              <TooltipContent className="max-w-[280px] leading-relaxed">
                {hint}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {note}
          </p>
        </div>
      </div>
      <div className="mt-auto flex min-h-12 items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
        {isSet ? (
          <p className="min-w-0 truncate text-base font-semibold tabular-nums">
            {value}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {suffix}
            </span>
          </p>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Не вказано
          </Badge>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={onEdit}
        >
          <IconPencil className="size-3.5" />
          {isSet ? "Редагувати" : "Вказати"}
        </Button>
      </div>
    </div>
  )
}

function EditExpenseDialog({
  field,
  open,
  onOpenChange,
  draft,
  setDraft,
  onSave,
}: {
  field: ExpenseField
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: string
  setDraft: (value: string) => void
  onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        <DialogHeader>
          <DialogTitle>{field.label}</DialogTitle>
          {/* the short note carries the dialog - the full explanation stays in
              the tile's tooltip, where it doesn't crowd the field */}
          <DialogDescription>{field.note}</DialogDescription>
        </DialogHeader>
        <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave()
            }}
            placeholder={field.placeholder}
            inputMode="decimal"
            className="h-full min-w-0 flex-1 rounded-none border-0 px-2.5 shadow-none focus-visible:ring-0"
          />
          <span className="flex shrink-0 items-center bg-muted pr-2.5 pl-1.5 text-sm text-muted-foreground">
            {field.suffix}
          </span>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={onSave}
          >
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// A group of expense tiles plus the one dialog they all edit through.
export function ExpenseFieldsGrid({
  fields,
  className,
}: {
  fields: ExpenseField[]
  className?: string
}) {
  const { expenses, setExpense } = useExpenses()
  // The field stays put while the dialog animates closed, so its title and note
  // don't blank out mid-fade; only `open` flips.
  const [edit, setEdit] = useState<{
    field: ExpenseField
    open: boolean
  } | null>(null)
  const [draft, setDraft] = useState("")

  const openEdit = (field: ExpenseField) => {
    setDraft(expenses[field.key])
    setEdit({ field, open: true })
  }

  const closeEdit = () =>
    setEdit((prev) => (prev ? { ...prev, open: false } : prev))

  // Saving an emptied field is a real edit - it puts the tile back to "Не вказано".
  const save = () => {
    if (edit) setExpense(edit.field.key, draft.trim())
    closeEdit()
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {fields.map((field) => (
        <ExpenseTile
          key={field.key}
          field={field}
          value={expenses[field.key]}
          onEdit={() => openEdit(field)}
        />
      ))}
      {edit && (
        <EditExpenseDialog
          field={edit.field}
          open={edit.open}
          onOpenChange={(open) => !open && closeEdit()}
          draft={draft}
          setDraft={setDraft}
          onSave={save}
        />
      )}
    </div>
  )
}
