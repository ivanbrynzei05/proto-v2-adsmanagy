/* eslint-disable react-refresh/only-export-components */
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { fmtNum } from "@/pages/dashboard/data"

// The head and the total row are ruled off by an inset shadow rather than a
// border, so the line is drawn inside the cell box and does not add a pixel to
// the row height the way a border on a collapsed table would.
export const HEAD = "h-8 bg-card px-2 font-medium"
export const HEAD_LINE = "shadow-[inset_0_-1px_0_0_var(--border)]"
export const TOTAL = "bg-card px-2 py-2 font-semibold tabular-nums"
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

/** how many rows a page can be set to; the first is what a table opens on */
export const PAGE_SIZES = [25, 50, 100] as const

/**
 * Search, sort and page over a metrics table.
 *
 * A period can put thousands of products or campaigns in one list, and the
 * order the report builds them in only answers one question. Sorting asks the
 * others - where the ROI went negative, whose lead costs most - and the search
 * is the only way to reach a named row that is two thousand down. What is left
 * after both is handed out a page at a time, so the card stays the same height
 * whether the period caught twelve campaigns or four thousand.
 *
 * The sorted list is memoised because it is the input to the slice: rebuilding
 * it every render would re-slice on every keystroke elsewhere in the card.
 */
export function useTableView<Row extends { name: string }, Totals>(
  rows: Row[],
  columns: Column<Row, Totals>[]
) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort | null>(null)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0])
  const [page, setPage] = useState(1)

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

  const pages = Math.max(1, Math.ceil(view.length / pageSize))
  // a page the list has shrunk past is not a page - the last one stands in for
  // it until the reader moves, rather than the table going blank
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const end = Math.min(start + pageSize, view.length)

  return {
    /** everything the search and the sort left, over every page */
    rows: view,
    /** the slice actually drawn */
    pageRows: view.slice(start, end),
    query,
    // a narrower search is a different list, and page four of it is not the
    // page four that was on screen - both of these start again from the first
    onQuery: (next: string) => {
      setQuery(next)
      setPage(1)
    },
    sort,
    // biggest first, then smallest, then back to the order the report built
    onSort: (key: string) => {
      setSort((prev) =>
        prev?.key !== key
          ? { key, dir: "desc" }
          : prev.dir === "desc"
            ? { key, dir: "asc" }
            : null
      )
      setPage(1)
    },
    /** everything TablePager needs, and nothing the table body does */
    pager: {
      page: current,
      pages,
      onPage: setPage,
      pageSize,
      onPageSize: (next: number) => {
        setPageSize(next)
        setPage(1)
      },
      /** 1-based, for the count beside the pager; 0 of 0 when nothing matched */
      from: view.length === 0 ? 0 : start + 1,
      to: end,
      total: view.length,
    },
  }
}

export type PagerProps = ReturnType<
  typeof useTableView<{ name: string }, unknown>
>["pager"]

/**
 * The page numbers to draw: the ends, the current one and its neighbours, with
 * a gap standing in for whatever a long list holds between them.
 */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7)
    return Array.from({ length: pages }, (_, i): number | "gap" => i + 1)
  const near = [page - 1, page, page + 1].filter((n) => n > 1 && n < pages)
  const out: (number | "gap")[] = [1]
  if (near[0] > 2) out.push("gap")
  out.push(...near)
  if (near[near.length - 1] < pages - 1) out.push("gap")
  out.push(pages)
  return out
}

/**
 * Which page of the table is on screen, and how big a page is.
 *
 * The numbered buttons are desktop only - on a phone the row would wrap into a
 * second line of its own, and the arrows plus the count say the same thing.
 */
export function TablePager({
  page,
  pages,
  onPage,
  pageSize,
  onPageSize,
  from,
  to,
  total,
  anchor,
}: PagerProps & {
  /** the table itself, brought back into view when the page turns */
  anchor?: React.RefObject<HTMLElement | null>
}) {
  // a page turned from the foot of a hundred rows would otherwise open at its
  // own foot; "nearest" walks back up to the head and does nothing at all when
  // the table already fits on screen
  function turn(next: number) {
    onPage(next)
    anchor?.current?.scrollIntoView({ block: "nearest" })
  }

  if (total === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSize(Number(value))}
        >
          <SelectTrigger
            size="sm"
            className="w-auto text-xs"
            aria-label="Рядків на сторінці"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmtNum(from)}–{fmtNum(to)} з {fmtNum(total)}
        </span>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => turn(page - 1)}
            aria-label="Попередня сторінка"
          >
            <IconChevronLeft />
          </Button>
          {pageWindow(page, pages).map((slot, i) =>
            slot === "gap" ? (
              <span
                key={`gap-${i}`}
                className="hidden w-5 text-center text-xs text-muted-foreground sm:block"
              >
                …
              </span>
            ) : (
              <Button
                key={slot}
                variant={slot === page ? "secondary" : "ghost"}
                size="icon-sm"
                className="hidden text-xs tabular-nums sm:inline-flex"
                aria-current={slot === page ? "page" : undefined}
                onClick={() => turn(slot)}
              >
                {slot}
              </Button>
            )
          )}
          <span className="text-xs text-muted-foreground tabular-nums sm:hidden">
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= pages}
            onClick={() => turn(page + 1)}
            aria-label="Наступна сторінка"
          >
            <IconChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
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
