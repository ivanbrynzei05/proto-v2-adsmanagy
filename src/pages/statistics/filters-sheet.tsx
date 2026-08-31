import { IconRestore, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { countFilters } from "./data"
import { useDraftFilters } from "./draft-filters"
import { FilterGroups, type FilterGroupsProps } from "./filters-panel"

/**
 * The panel's filter half, slid up from the bottom of a phone.
 *
 * The period is not in here: it is not one of the filters, and it is the one
 * control worth reading without opening anything, so it stays on the page next
 * to the button that opens this. Nothing under the sheet is rebuilt while it is
 * open - the footer button is what applies the ticks, exactly as it does in the
 * panel on a wide screen - and a sheet closed any other way is a sheet the
 * report was never asked to redraw for.
 */
export function StatisticsFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFilters,
  ...groups
}: FilterGroupsProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { draft, setDraft, dirty, apply, clear, revert } = useDraftFilters(
    filters,
    onFilters
  )
  const active = countFilters(draft)

  // every way out of the sheet but the footer button - the X, the backdrop, a
  // swipe, Escape - leaves the report as it was, so the draft goes back with it
  function dismiss(next: boolean) {
    if (!next) revert()
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={dismiss}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[88svh] gap-0 rounded-t-2xl p-0"
      >
        {/* grab handle + title */}
        <div className="shrink-0 border-b">
          <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" />
          <div className="flex items-center gap-2 px-4 py-2.5">
            <SheetTitle className="text-[15px] font-semibold">
              Фільтри
            </SheetTitle>
            {active > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary tabular-nums">
                {active}
              </span>
            )}
            <SheetDescription className="sr-only">
              Команда, реклама, товари, колцентри та CRM
            </SheetDescription>
            {active > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                onClick={clear}
              >
                <IconRestore className="size-4" />
                Скинути
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className={active > 0 ? undefined : "ml-auto"}
              onClick={() => dismiss(false)}
              aria-label="Закрити"
            >
              <IconX />
            </Button>
          </div>
        </div>

        {/* scrolling body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
          <FilterGroups {...groups} filters={draft} onFilters={setDraft} />
        </div>

        {/* confirm */}
        <div className="shrink-0 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* The button always closes, and only rebuilds the report when there
              is something to rebuild it for: a sheet opened and confirmed with
              nothing touched should not blank the chart into a skeleton. */}
          <Button
            className="h-11 w-full text-sm"
            onClick={() => {
              if (dirty) apply()
              onOpenChange(false)
            }}
          >
            Застосувати
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
