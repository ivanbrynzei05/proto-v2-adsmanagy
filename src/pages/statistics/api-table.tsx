/**
 * The table under the tiles — columns, rows, totals and paging, all as the
 * response gave them.
 *
 * The page knows of no column: which ones exist, what order they are in, which
 * of them sort and what each cell is measured in all come from `data.table`.
 * A row's first column is the one the response marked `source: "label"`, and
 * that is where the icon goes — `{kind, key}`, never a picture, so the client
 * decides what a "provider" or a "series" looks like.
 *
 * Sorting and paging are requests, not local work: the backend holds every row
 * and this page holds one page of them, so a click on a header goes back for
 * the table alone (`blocks=table`).
 */
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react"
import { Fragment } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import type { PlatformId } from "@/pages/campaigns/data"
import {
  colorOf,
  formatValue,
  labelOf,
  signed,
  type ApiColumn,
  type ApiIcon,
  type ApiRow,
  type ApiTable,
} from "./api"

// The ads providers name themselves as the networks do; the prototype's badge
// predates the backend and calls Google Ads "google".
const PLATFORM_IDS: Record<string, PlatformId> = {
  facebook: "facebook",
  google_ads: "google",
  tiktok: "tiktok",
}

function RowIcon({ icon }: { icon: ApiIcon | null }) {
  if (!icon) return null
  if (icon.kind === "provider") {
    const id = PLATFORM_IDS[icon.key]
    return id ? <PlatformBadge id={id} /> : null
  }
  // "series" — the same colour the chart draws that series with, so the table
  // and the chart cannot disagree about which category a row belongs to
  return (
    <span
      className="size-2.5 shrink-0 rounded-[2px]"
      style={{ backgroundColor: colorOf(icon.key, 0) }}
    />
  )
}

function Cell({
  column,
  row,
  depth,
}: {
  column: ApiColumn
  row: ApiRow
  depth: number
}) {
  if (column.source === "label") {
    return (
      <td className="py-2 pr-3 pl-3">
        <div
          className="flex min-w-0 items-center gap-2"
          style={{ paddingLeft: depth * 18 }}
        >
          <RowIcon icon={row.icon} />
          <span className={cn("truncate", depth === 0 && "font-medium")}>
            {labelOf(row.id, row.label)}
          </span>
        </div>
      </td>
    )
  }
  const value = row.values[column.key] ?? null
  return (
    <td
      className={cn(
        "py-2 pr-3 text-right whitespace-nowrap tabular-nums",
        signed(column.format) && value !== null && value < 0 && "text-destructive"
      )}
    >
      {formatValue(value, column.format)}
    </td>
  )
}

function Rows({
  rows,
  columns,
  depth = 0,
}: {
  rows: ApiRow[]
  columns: ApiColumn[]
  depth?: number
}) {
  return (
    <>
      {rows.map((row) => (
        <Fragment key={row.id}>
          <tr className="border-t">
            {columns.map((column) => (
              <Cell key={column.key} column={column} row={row} depth={depth} />
            ))}
          </tr>
          {row.children.length > 0 && (
            <Rows rows={row.children} columns={columns} depth={depth + 1} />
          )}
        </Fragment>
      ))}
    </>
  )
}

export function ApiTableCard({
  table,
  onSort,
  onPage,
  disabled,
}: {
  table: ApiTable
  onSort: (key: string) => void
  onPage: (page: number) => void
  /** the snapshot answers one page and one sort — the controls say so */
  disabled?: boolean
}) {
  const { columns, rows, totals, page } = table

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
              {columns.map((column) => {
                const active = table.sort === column.key
                const head = labelOf(column.key, column.label)
                return (
                  <th
                    key={column.key}
                    className={cn(
                      "py-2.5 pr-3 font-medium",
                      column.source === "label"
                        ? "pl-3 text-left"
                        : "text-right"
                    )}
                  >
                    {column.sortable && !disabled ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-foreground",
                          active && "text-foreground"
                        )}
                      >
                        {head}
                        {active &&
                          (table.dir === "desc" ? (
                            <IconArrowDown className="size-3" />
                          ) : (
                            <IconArrowUp className="size-3" />
                          ))}
                      </button>
                    ) : (
                      head
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <Rows rows={rows} columns={columns} />
            {/* the pinned total: the whole set, not this page */}
            <tr className="border-t-2 bg-muted/30 font-semibold">
              {columns.map((column) =>
                column.source === "label" ? (
                  <td key={column.key} className="py-2 pr-3 pl-3">
                    Разом
                  </td>
                ) : (
                  <td
                    key={column.key}
                    className="py-2 pr-3 text-right whitespace-nowrap tabular-nums"
                  >
                    {formatValue(totals.values[column.key] ?? null, column.format)}
                  </td>
                )
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {page.total_pages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <span>
            {page.total_rows} рядків · сторінка {page.number} з {page.total_pages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={disabled || page.number <= 1}
              onClick={() => onPage(page.number - 1)}
              className="rounded-md border px-2 py-1 disabled:opacity-40"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={disabled || page.number >= page.total_pages}
              onClick={() => onPage(page.number + 1)}
              className="rounded-md border px-2 py-1 disabled:opacity-40"
            >
              Далі
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
