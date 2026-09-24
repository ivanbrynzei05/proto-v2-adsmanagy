import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// "21–40 з 486" and the arrows under a paged list (see pageOf in lib/paging).
// Gone while everything fits on one page.
export function Pagination({
  page,
  pageCount,
  size,
  total,
  onPage,
  className,
}: {
  page: number
  pageCount: number
  size: number
  total: number
  onPage: (page: number) => void
  className?: string
}) {
  if (pageCount < 2) return null
  const from = page * size + 1
  const to = Math.min(total, (page + 1) * size)

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2 sm:px-4",
        className
      )}
    >
      <span className="text-xs text-muted-foreground tabular-nums">
        {from}–{to} з {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Попередня сторінка"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          <IconChevronLeft />
        </Button>
        <span className="px-1 text-xs font-medium text-muted-foreground tabular-nums">
          {page + 1} / {pageCount}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Наступна сторінка"
          disabled={page >= pageCount - 1}
          onClick={() => onPage(page + 1)}
        >
          <IconChevronRight />
        </Button>
      </div>
    </div>
  )
}
