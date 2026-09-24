import { cn } from "@/lib/utils"

// The muted track with the picked option raised on a card - the same control
// Налаштування → Інтеграції switches its tabs with.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { id: T; label: React.ReactNode; disabled?: boolean }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn("flex gap-1 rounded-lg bg-muted p-1", className)}>
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            disabled={o.disabled}
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={cn(
              // grows from its own width rather than from zero, so a long
              // label never gets squeezed to the length of a short one
              "flex h-7 min-w-0 flex-auto items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
