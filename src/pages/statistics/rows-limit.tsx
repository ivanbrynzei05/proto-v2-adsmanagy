import { IconChevronDown } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fmtNum } from "@/pages/dashboard/data"

// The tail of a grouped table, behind one button. Flat lists scroll instead -
// see ./virtual-rows.
export function MoreRowsButton({
  hidden,
  expanded,
  onToggle,
}: {
  hidden: number
  expanded: boolean
  onToggle: () => void
}) {
  if (hidden === 0) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-8 w-full gap-1.5 text-xs text-muted-foreground"
    >
      {expanded ? "Згорнути" : `Показати всі (${fmtNum(hidden)})`}
      <IconChevronDown className={cn("size-4", expanded && "rotate-180")} />
    </Button>
  )
}
