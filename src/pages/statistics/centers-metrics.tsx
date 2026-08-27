import { useCurrency } from "@/components/currency-provider"
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
import { fmt } from "@/pages/campaigns/data"
import { fmtNum } from "@/pages/dashboard/data"
import { centerTiles, type CentersReport } from "./data"
import { MetricTiles } from "./metric-tiles"

export function CentersMetricsCard({
  report,
  className,
}: {
  report: CentersReport
  className?: string
}) {
  const { currency } = useCurrency()
  const { centers, totals } = report

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-4">
        <MetricTiles tiles={centerTiles(totals)} />

        <div className="-mx-(--card-spacing) overflow-x-auto px-(--card-spacing)">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-2 font-medium">Колцентр</TableHead>
                {[
                  "Ліди",
                  "Дозвон",
                  "% дозвону",
                  "Апруви",
                  "% апруву",
                  "Допродажі",
                  "Сума допродажів",
                  "Витрати",
                  "Ціна апруву",
                  "Сер. час",
                ].map((label) => (
                  <TableHead
                    key={label}
                    className="h-8 px-2 text-right font-medium whitespace-nowrap"
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-2 py-2">
                    <span className="flex items-center gap-2 font-medium whitespace-nowrap">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmtNum(c.leads)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmtNum(c.reached)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {c.rates.reachRate}%
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmtNum(c.approves)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                    {c.rates.approveRate}%
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmtNum(c.upsells)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmt(c.upsellSum, "₴", currency)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmt(c.cost, "₴", currency)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {fmt(c.rates.costPerApprove, "₴", currency)}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right tabular-nums">
                    {c.rates.handle} хв
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 hover:bg-transparent">
                <TableCell className="px-2 py-2 font-semibold">Разом</TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmtNum(totals.leads)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmtNum(totals.reached)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {totals.rates.reachRate}%
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmtNum(totals.approves)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {totals.rates.approveRate}%
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmtNum(totals.upsells)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmt(totals.upsellSum, "₴", currency)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmt(totals.cost, "₴", currency)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmt(totals.rates.costPerApprove, "₴", currency)}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-semibold tabular-nums">
                  {totals.rates.handle} хв
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
