import { useRef, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  entryTitle,
  formatAmount,
  formatLedgerDate,
  formatSigned,
  type LedgerEntry,
} from "@/features/billing/payments"
import { HEAD, HEAD_LINE, TablePager } from "@/pages/statistics/table-controls"
import { cn } from "@/lib/utils"

const PAGE_SIZES: readonly number[] = [10, 20, 50]

/**
 * The wallet ledger: every top-up, charge and refund, newest first. Paged the
 * way the endpoint is - ?page, ?page_size.
 */
export function PaymentHistory({ entries }: { entries: LedgerEntry[] }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const anchor = useRef<HTMLDivElement>(null)

  const pages = Math.max(1, Math.ceil(entries.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const end = Math.min(start + pageSize, entries.length)
  const rows = entries.slice(start, end)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Історія операцій
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div ref={anchor}>
          <Table containerClassName="-mx-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${HEAD} ${HEAD_LINE}`}>Дата</TableHead>
                <TableHead className={`${HEAD} ${HEAD_LINE}`}>
                  Операція
                </TableHead>
                <TableHead className={`${HEAD} ${HEAD_LINE} text-right`}>
                  Сума
                </TableHead>
                <TableHead className={`${HEAD} ${HEAD_LINE} text-right`}>
                  Баланс після
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Немає операцій
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((entry) => {
                  const when = formatLedgerDate(entry.created_at)
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="block tabular-nums">{when.date}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {when.time}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entryTitle(entry)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold whitespace-nowrap tabular-nums",
                          entry.amount > 0 &&
                            "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {formatSigned(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                        {formatAmount(entry.balance_after)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TablePager
          page={current}
          pages={pages}
          onPage={setPage}
          pageSize={pageSize}
          onPageSize={(next) => {
            setPageSize(next)
            setPage(1)
          }}
          from={entries.length === 0 ? 0 : start + 1}
          to={end}
          total={entries.length}
          sizes={PAGE_SIZES}
          anchor={anchor}
        />
      </CardContent>
    </Card>
  )
}
