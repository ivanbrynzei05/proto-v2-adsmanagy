/* eslint-disable react-refresh/only-export-components */
import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// The table scrolls inside its card, so the head and the total stay put while
// the list runs under them; both are pinned by their cells rather than by the
// row, which is the part a collapsed border follows.
export const HEAD = "sticky top-0 z-10 h-8 bg-card px-2 font-medium"
export const HEAD_LINE = "shadow-[inset_0_-1px_0_0_var(--border)]"
export const TOTAL =
  "sticky bottom-0 z-10 bg-card px-2 py-2 font-semibold tabular-nums"
export const TOTAL_LINE = "shadow-[inset_0_2px_0_0_var(--border)]"

/** money in the display currency - the column defs take it rather than a hook */
export type Cash = (value: number) => string

export type Column<Row, Totals> = {
  key: string
  label: string
  /** what the column sorts on - the raw figure, never the formatted one */
  sort: (row: Row) => number | string
  cell: (row: Row, cash: Cash) => React.ReactNode
  /** the same figure over the whole period */
  total: (totals: Totals, cash: Cash) => React.ReactNode
  /** the row's headline figure, set heavier than the rest */
  strong?: boolean
  /** red once it goes negative */
  signed?: boolean
}

export type Sort = { key: string; dir: "asc" | "desc" }

/**
 * Search and sort over a metrics table.
 *
 * A period can put thousands of products or campaigns in one list, and the
 * order the report builds them in only answers one question. Sorting asks the
 * others - where the ROI went negative, whose lead costs most - and the search
 * is the only way to reach a named row that is two thousand down.
 *
 * The result is memoised because the virtual list resets its scroll whenever
 * the array changes: a fresh one every render would pin it to the top.
 */
export function useTableView<Row extends { name: string }, Totals>(
  rows: Row[],
  columns: Column<Row, Totals>[]
) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort | null>(null)

  const view = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const kept = needle
      ? rows.filter((r) => r.name.toLowerCase().includes(needle))
      : rows
    const column = sort && columns.find((c) => c.key === sort.key)
    if (!column || !sort) return kept
    const sign = sort.dir === "asc" ? 1 : -1
    return [...kept].sort((a, b) => {
      const [x, y] = [column.sort(a), column.sort(b)]
      const by =
        typeof x === "string" && typeof y === "string"
          ? x.localeCompare(y, "uk")
          : Number(x) - Number(y)
      return by * sign
    })
  }, [rows, columns, query, sort])

  return {
    rows: view,
    query,
    onQuery: setQuery,
    sort,
    // biggest first, then smallest, then back to the order the report built
    onSort: (key: string) =>
      setSort((prev) =>
        prev?.key !== key
          ? { key, dir: "desc" }
          : prev.dir === "desc"
            ? { key, dir: "asc" }
            : null
      ),
  }
}

export function TableSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative w-full sm:max-w-2xs">
      <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Пошук"
        className="h-9 pl-8"
      />
    </div>
  )
}

export function SortHead<Row, Totals>({
  column,
  sort,
  onSort,
  align,
}: {
  column: Column<Row, Totals>
  sort: Sort | null
  onSort: (key: string) => void
  align: "left" | "right"
}) {
  const active = sort?.key === column.key
  return (
    <TableHead
      className={cn(HEAD, HEAD_LINE, align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={cn(
          "group inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground",
          // the caret goes on the outside of the label, so the labels stay
          // flush with the figures under them
          align === "right" && "flex-row-reverse",
          active && "text-foreground"
        )}
      >
        {column.label}
        <IconChevronDown
          className={cn(
            "size-3 shrink-0 transition",
            active
              ? sort.dir === "asc" && "rotate-180"
              : "opacity-0 group-hover:opacity-40"
          )}
        />
      </button>
    </TableHead>
  )
}

/** what the table says when the search matches nothing */
export function NoMatchRow({ span }: { span: number }) {
  return (
    <tr>
      <td
        colSpan={span}
        className="px-2 py-10 text-center text-muted-foreground"
      >
        Нічого не знайдено
      </td>
    </tr>
  )
}
