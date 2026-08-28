/**
 * The filter panel, built from `meta.filters`.
 *
 * The response says which categories this breakdown accepts, what the tiers of
 * each are and what is in them; this draws that and nothing else. A category
 * the backend stops offering disappears on its own, and one it adds appears
 * without a line here — which is the whole difference from the panel this
 * replaced, where the lists were the prototype's own inventions.
 *
 * What travels back is leaves. A parent is a convenience — ticking it ticks its
 * children — so the request carries cabinets rather than "this whole account",
 * and a cabinet synced tomorrow does not quietly join a filter saved today.
 */
import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/pages/campaigns/date-range"
import type { DateRange } from "@/pages/campaigns/date-utils"
import { labelOf, type ApiFilter, type ApiFilterOption, type FilterSelection } from "./api"

// A catalogue runs to thousands; nobody scrolls past the first screen, and what
// is not on it is reached by typing.
const PICKER_ROWS = 60

/** Every leaf under a node — what ticking a parent actually selects. */
function leavesOf(option: ApiFilterOption): string[] {
  if (!option.children || option.children.length === 0) return [option.id]
  return option.children.flatMap(leavesOf)
}

function Option({
  option,
  depth,
  selected,
  onToggle,
}: {
  option: ApiFilterOption
  depth: number
  selected: string[]
  onToggle: (ids: string[], on: boolean) => void
}) {
  const leaves = leavesOf(option)
  const on = leaves.every((id) => selected.includes(id))
  const some = !on && leaves.some((id) => selected.includes(id))

  return (
    <>
      <button
        type="button"
        onClick={() => onToggle(leaves, !on)}
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted/60"
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px]",
            on && "bg-primary text-primary-foreground border-primary",
            some && "border-primary text-primary"
          )}
        >
          {on ? "✓" : some ? "–" : ""}
        </span>
        <span className="min-w-0 flex-1 truncate">{option.label}</span>
      </button>
      {option.children?.map((child) => (
        <Option
          key={child.id}
          option={child}
          depth={depth + 1}
          selected={selected}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}

function matches(option: ApiFilterOption, needle: string): boolean {
  if (option.label.toLowerCase().includes(needle)) return true
  return (option.children ?? []).some((child) => matches(child, needle))
}

function CategoryPicker({
  filter,
  selected,
  onChange,
}: {
  filter: ApiFilter
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const options = needle
    ? filter.options.filter((option) => matches(option, needle))
    : filter.options
  // A tree deeper than one tier is worth a search box; a flat list of two
  // connections is not.
  const searchable = filter.levels.length > 1

  function toggle(ids: string[], on: boolean) {
    const next = on
      ? [...new Set([...selected, ...ids])]
      : selected.filter((id) => !ids.includes(id))
    onChange(next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-full justify-between gap-1.5 font-normal"
          >
            <span className="truncate">
              {labelOf(filter.key)}:{" "}
              <span className="font-medium">
                {selected.length === 0 ? "усі" : selected.length}
              </span>
            </span>
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-72 p-0">
        {searchable && (
          <div className="border-b p-1.5">
            <div className="relative">
              <IconSearch className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Пошук"
                className="h-8 pl-7 text-sm"
              />
            </div>
          </div>
        )}
        <div className="max-h-[280px] overflow-y-auto p-1">
          {options.slice(0, PICKER_ROWS).map((option) => (
            <Option
              key={option.id}
              option={option}
              depth={0}
              selected={selected}
              onToggle={toggle}
            />
          ))}
          {options.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              Нічого не знайшлося
            </p>
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange([])}
            >
              Скинути
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ApiFiltersPanel({
  range,
  onRange,
  filters,
  selection,
  onSelection,
}: {
  range: DateRange
  onRange: (next: DateRange) => void
  filters: ApiFilter[]
  selection: FilterSelection
  onSelection: (next: FilterSelection) => void
}) {
  return (
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Період
        </h2>
        <DateRangePicker value={range} onChange={onRange} />
      </div>

      {filters.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Фільтри
          </h2>
          {filters.map((filter) => (
            <CategoryPicker
              key={filter.key}
              filter={filter}
              selected={selection[filter.key] ?? []}
              onChange={(next) =>
                onSelection({ ...selection, [filter.key]: next })
              }
            />
          ))}
        </div>
      )}
    </Card>
  )
}
