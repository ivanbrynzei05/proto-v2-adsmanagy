import type { Icon } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

// The column of sections beside a page's content - Налаштування and Інтеграції
// both switch their sections with it. It sits on its own panel, so the left
// column reads as part of the page furniture rather than loose buttons on the
// background. On desktop it follows the page down; on narrow screens it scrolls
// sideways inside the panel.
export function SectionNav<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string; icon: Icon; count?: number }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-xs lg:sticky lg:top-18 lg:flex-col lg:self-start lg:overflow-visible">
      {items.map((item) => {
        const isActive = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors [&>svg]:size-4 [&>svg]:shrink-0",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <item.icon />
            {item.label}
            {!!item.count && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
