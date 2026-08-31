import { useRef } from "react"

import { useCurrency } from "@/components/currency-provider"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { fmt } from "@/pages/campaigns/data"
import { fmtNum } from "@/pages/dashboard/data"
import { productTiles, type ProductStat, type ProductsReport } from "./data"
import { MetricTiles } from "./metric-tiles"
import {
  NoMatchRow,
  SortHead,
  TablePager,
  TableSearch,
  TOTAL,
  TOTAL_LINE,
  useTableView,
  type Column,
} from "./table-controls"

type Totals = ProductsReport["totals"]

// The table, column by column. Module-level so the sort keeps its reference
// between renders - a fresh array every render would re-sort the whole list on
// every keystroke elsewhere in the card.
const COLUMNS: Column<ProductStat, Totals>[] = [
  {
    key: "name",
    label: "Товар",
    sort: (p) => p.name,
    cell: (p) => (
      <span className="block max-w-[260px] truncate font-medium">{p.name}</span>
    ),
    total: () => "Разом",
  },
  {
    key: "sold",
    label: "Продано",
    sort: (p) => p.sold,
    cell: (p) => fmtNum(p.sold),
    total: (t) => fmtNum(t.sold),
    strong: true,
  },
  {
    key: "leads",
    label: "Ліди",
    sort: (p) => p.leads,
    cell: (p) => fmtNum(p.leads),
    total: (t) => fmtNum(t.leads),
  },
  {
    key: "approves",
    label: "Апруви",
    sort: (p) => p.approves,
    cell: (p) => fmtNum(p.approves),
    total: (t) => fmtNum(t.approves),
  },
  {
    key: "approveRate",
    label: "% апруву",
    sort: (p) => p.rates.approveRate,
    cell: (p) => `${p.rates.approveRate}%`,
    total: (t) => `${t.rates.approveRate}%`,
  },
  {
    key: "buyoutRate",
    label: "% викупу",
    sort: (p) => p.rates.buyoutRate,
    cell: (p) => `${p.rates.buyoutRate}%`,
    total: (t) => `${t.rates.buyoutRate}%`,
  },
  {
    key: "avgCheck",
    label: "Сер. чек",
    sort: (p) => p.avgCheck,
    cell: (p, cash) => cash(p.avgCheck),
    total: (t, cash) => cash(t.avgCheck),
  },
  {
    key: "costPerLead",
    label: "Ціна ліда",
    sort: (p) => p.rates.costPerLead,
    cell: (p, cash) => cash(p.rates.costPerLead),
    total: (t, cash) => cash(t.rates.costPerLead),
  },
  {
    key: "ads",
    label: "Реклама",
    sort: (p) => p.money.ads,
    cell: (p, cash) => cash(p.money.ads),
    total: (t, cash) => cash(t.money.ads),
  },
  {
    key: "sales",
    label: "Виручка",
    sort: (p) => p.money.sales,
    cell: (p, cash) => cash(p.money.sales),
    total: (t, cash) => cash(t.money.sales),
  },
  {
    key: "profit",
    label: "Дохід",
    sort: (p) => p.money.profit,
    cell: (p, cash) => cash(p.money.profit),
    total: (t, cash) => cash(t.money.profit),
    strong: true,
    signed: true,
  },
  {
    key: "roi",
    label: "ROI",
    sort: (p) => p.rates.roi,
    cell: (p) => `${p.rates.roi}%`,
    total: (t) => `${t.rates.roi}%`,
    strong: true,
    signed: true,
  },
]

export function ProductsMetricsCard({
  report,
  className,
}: {
  report: ProductsReport
  className?: string
}) {
  const { currency } = useCurrency()
  const { products, totals } = report
  const cash = (value: number) => fmt(value, "₴", currency)
  const view = useTableView(products, COLUMNS)
  const table = useRef<HTMLDivElement>(null)

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-4">
        <MetricTiles
          tiles={productTiles({
            sold: totals.sold,
            avgCheck: totals.avgCheck,
            sales: totals.money.sales,
            profit: totals.money.profit,
            rates: totals.rates,
          })}
        />

        <TableSearch value={view.query} onChange={view.onQuery} />

        <div
          ref={table}
          className="-mx-(--card-spacing) scroll-mt-20 overflow-x-auto px-(--card-spacing)"
        >
          <Table className="text-xs" containerClassName="overflow-x-visible">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((column, i) => (
                  <SortHead
                    key={column.key}
                    column={column}
                    sort={view.sort}
                    onSort={view.onSort}
                    align={i === 0 ? "left" : "right"}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.pageRows.length === 0 ? (
                <NoMatchRow span={COLUMNS.length} />
              ) : (
                view.pageRows.map((p) => (
                  <TableRow key={p.id}>
                    {COLUMNS.map((column, j) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "px-2 py-2",
                          j > 0 && "text-right tabular-nums",
                          column.strong && "font-semibold",
                          column.signed &&
                            Number(column.sort(p)) < 0 &&
                            "text-destructive"
                        )}
                      >
                        {column.cell(p, cash)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((column, i) => (
                  <TableCell
                    key={column.key}
                    className={cn(TOTAL, TOTAL_LINE, i > 0 && "text-right")}
                  >
                    {column.total(totals, cash)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <TablePager {...view.pager} anchor={table} />
      </CardContent>
    </Card>
  )
}
