import { IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

// Chip rows scroll sideways rather than wrapping, so a section stays one line
// tall however many options it holds and the sheet keeps every filter within
// reach. `bleed` cancels the parent's padding so the row can scroll edge to
// edge - pass the matching negative/positive pair, e.g. "-mx-4 px-4".
export function ChipRow({
  bleed,
  className,
  children,
}: {
  bleed?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex [scrollbar-width:none] gap-1.5 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [&>*]:shrink-0",
        bleed,
        className
      )}
    >
      {children}
    </div>
  )
}

// A chip that turns one column on or off. The little checkbox is what makes it
// read as a toggle rather than a link - the sections where only one value can
// be picked use a select instead, so this shape always means "many of these".
export function ToggleChip({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium shadow-xs transition-colors",
        active
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-input bg-card text-foreground",
        className
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background"
        )}
      >
        {active && <IconCheck className="size-2.5" stroke={3.5} />}
      </span>
      {children}
    </button>
  )
}
