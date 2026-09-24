import { cn } from "@/lib/utils"

// One value of a single-choice filter laid out as a row of pills - the kind of
// a comment, the outcome of a rule. The row scrolls sideways on a phone.
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors [&>svg]:size-3.5",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-input text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

// the count trailing a chip's label
export function ChipCount({ children }: { children: React.ReactNode }) {
  return <span className="tabular-nums opacity-70">{children}</span>
}
