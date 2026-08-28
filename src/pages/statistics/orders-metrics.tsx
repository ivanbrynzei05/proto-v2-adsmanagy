import { Fragment, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { fmtNum } from "@/pages/dashboard/data"
import { CATEGORIES, orderTiles, type OrdersReport } from "./data"
import { MetricTiles } from "./metric-tiles"
import { MoreRowsButton } from "./rows-limit"

const STATUSES_SHOWN = 6

function pct(value: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 1000) / 10}%`
}

// Every status the period actually carried, under the category it is mapped
// into - this is the full list, and the only place the counts are read at rest.
export function OrdersMetricsCard({
  report,
  className,
}: {
  report: OrdersReport
  className?: string
}) {
  const { totals, statusTotals } = report
  // a real account runs a hundred-odd statuses; the table opens on the ones
  // that carry the period and keeps the tail behind one button
  const [expanded, setExpanded] = useState(false)
  const shown = (key: (typeof CATEGORIES)[number]["key"]) =>
    expanded ? statusTotals[key] : statusTotals[key].slice(0, STATUSES_SHOWN)
  const hidden = CATEGORIES.reduce(
    (a, c) => a + Math.max(0, statusTotals[c.key].length - STATUSES_SHOWN),
    0
  )

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-4">
        <MetricTiles tiles={orderTiles(totals)} />

        <div className="flex flex-col gap-2">
          <div className="-mx-(--card-spacing) overflow-x-auto px-(--card-spacing)">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 px-2 font-medium">Статус</TableHead>
                  <TableHead className="h-8 px-2 text-right font-medium whitespace-nowrap">
                    Замовлень
                  </TableHead>
                  <TableHead className="h-8 px-2 text-right font-medium whitespace-nowrap">
                    % категорії
                  </TableHead>
                  <TableHead className="h-8 px-2 text-right font-medium whitespace-nowrap">
                    % лідів
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...CATEGORIES].reverse().map((c) => (
                  <Fragment key={c.key}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell className="px-2 py-1.5 font-semibold">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-semibold tabular-nums">
                        {fmtNum(totals[c.key])}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                        100%
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-semibold tabular-nums">
                        {pct(totals[c.key], totals.leads)}
                      </TableCell>
                    </TableRow>
                    {shown(c.key).length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={4}
                          className="px-2 py-2 pl-[26px] text-muted-foreground"
                        >
                          немає замовлень у цих статусах
                        </TableCell>
                      </TableRow>
                    ) : (
                      shown(c.key).map((s) => (
                        <TableRow key={s.name}>
                          <TableCell className="px-2 py-1.5 pl-[26px]">
                            {s.name}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-right tabular-nums">
                            {fmtNum(s.value)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                            {pct(s.value, totals[c.key])}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                            {pct(s.value, totals.leads)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <MoreRowsButton
            hidden={hidden}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
