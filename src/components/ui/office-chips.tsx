import { IconCheck, IconPlus, IconX } from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Offices as a row of chips with a square "+" at the end. The plus swaps itself
// for a small number field - type, Enter (or the tick) saves it as another chip,
// Esc backs out. Shared by the team member dialog and the call centre one, so
// both places add offices the same way. The caller supplies the label.
export function OfficeChips({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")

  const save = () => {
    const office = draft.trim()
    if (office !== "" && !value.includes(office)) {
      onChange([...value, office])
    }
    setDraft("")
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((office) => (
        <span
          key={office}
          className="flex h-8 items-center gap-1 rounded-md border border-input pr-1 pl-2.5 text-sm shadow-xs"
        >
          {office}
          <button
            type="button"
            aria-label={`Прибрати офіс ${office}`}
            onClick={() => onChange(value.filter((o) => o !== office))}
            className="grid size-5 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX className="size-3.5" />
          </button>
        </span>
      ))}

      {adding ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                save()
              }
              if (e.key === "Escape") {
                // the dialog also listens for Esc - this one only closes the field
                e.stopPropagation()
                setDraft("")
                setAdding(false)
              }
            }}
            // an empty field on blur means the user changed their mind
            onBlur={() => draft.trim() === "" && setAdding(false)}
            placeholder="Номер"
            inputMode="numeric"
            className="h-8 w-20"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Зберегти офіс"
            onClick={save}
          >
            <IconCheck className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Додати офіс"
          className="border-dashed text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <IconPlus className="size-4" />
        </Button>
      )}
    </div>
  )
}
