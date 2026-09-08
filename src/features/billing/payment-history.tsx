import { IconFileInvoice } from "@tabler/icons-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HEAD, HEAD_LINE, TablePager } from "@/pages/statistics/table-controls"
import {
  PAYMENT_STATUS,
  formatAmount,
  formatPaymentDate,
  type Payment,
} from "@/features/billing/payments"

const PAGE_SIZE = 8

/**
 * Every charge made against the balance, newest first.
 *
 * A ledger grows without end, so it is handed out a page at a time the same way
 * the statistics tables are - the card keeps its height whether the account is
 * a week or three years old.
 */
export function PaymentHistory({ payments }: { payments: Payment[] }) {
  const [page, setPage] = useState(1)
  const pageSize = PAGE_SIZE

  const pages = Math.max(1, Math.ceil(payments.length / pageSize))
  // a top-up prepends a row, so the page under the reader can shift past the
  // end of the list - the last page stands in for it rather than going blank
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const end = Math.min(start + pageSize, payments.length)
  const rows = payments.slice(start, end)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Історія оплат
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Table containerClassName="-mx-2">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${HEAD} ${HEAD_LINE}`}>Дата</TableHead>
              <TableHead className={`${HEAD} ${HEAD_LINE}`}>
                Призначення
              </TableHead>
              <TableHead className={`${HEAD} ${HEAD_LINE}`}>Спосіб</TableHead>
              <TableHead className={`${HEAD} ${HEAD_LINE}`}>Статус</TableHead>
              <TableHead className={`${HEAD} ${HEAD_LINE} text-right`}>
                Сума
              </TableHead>
              <TableHead className={`${HEAD} ${HEAD_LINE} w-9`} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((payment) => {
              const status = PAYMENT_STATUS[payment.status]
              return (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatPaymentDate(payment.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.kind}
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                      {payment.id}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.method}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`border-transparent ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      payment.status === "failed"
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {formatAmount(payment.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Рахунок ${payment.id}`}
                    >
                      <IconFileInvoice />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <TablePager
          bare
          page={current}
          pages={pages}
          onPage={setPage}
          from={start + 1}
          to={end}
          total={payments.length}
        />
      </CardContent>
    </Card>
  )
}
