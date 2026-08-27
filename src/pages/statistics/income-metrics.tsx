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
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import { incomeTiles, type IncomeReport, type Rates } from "./data"
import { MetricTiles } from "./metric-tiles"

// Nothing is painted for being good - a figure only gets a colour when it is a
// loss, which is the one case the number alone is easy to skim past.
function roiTone(value: number) {
  return value < 0 ? "text-destructive" : undefined
}

// Columns of the platform table. Money and rates only - the counts that feed
// them are in the rail beside the chart.
const COLUMNS: {
  key:
    | "leads"
    | "costPerLead"
    | "approveRate"
    | "buyoutRate"
    | "ads"
    | "profit"
    | "roi"
  label: string
  from: "money" | "rates"
  unit: "" | "₴" | "%"
}[] = [
  { key: "leads", label: "Ліди", from: "money", unit: "" },
  { key: "costPerLead", label: "Ціна ліда", from: "rates", unit: "₴" },
  { key: "approveRate", label: "% апруву", from: "rates", unit: "%" },
  { key: "buyoutRate", label: "% викупу", from: "rates", unit: "%" },
  { key: "ads", label: "Реклама", from: "money", unit: "₴" },
  { key: "profit", label: "Дохід", from: "money", unit: "₴" },
  { key: "roi", label: "ROI", from: "rates", unit: "%" },
]

export function IncomeMetricsCard({
  report,
  className,
}: {
  report: IncomeReport
  className?: string
}) {
  const { currency } = useCurrency()
  const { rates, platforms, totals } = report

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-4">
        <MetricTiles tiles={incomeTiles(totals)} />

        <div className="flex flex-col gap-2">
          {/* the table scrolls inside its own box rather than pushing the card
              sideways on a narrow screen */}
          <div className="-mx-(--card-spacing) overflow-x-auto px-(--card-spacing)">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 px-2 font-medium">
                    Платформа
                  </TableHead>
                  {COLUMNS.map((c) => (
                    <TableHead
                      key={c.key}
                      className="h-8 px-2 text-right font-medium whitespace-nowrap"
                    >
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-2 py-2">
                      <span className="flex items-center gap-2 font-medium whitespace-nowrap">
                        <PlatformBadge id={p.id} size={14} />
                        {p.label}
                      </span>
                    </TableCell>
                    {COLUMNS.map((c) => {
                      const value =
                        c.from === "rates"
                          ? p.rates[c.key as keyof Rates]
                          : p.money[c.key as "leads" | "ads" | "profit"]
                      return (
                        <TableCell
                          key={c.key}
                          className={cn(
                            "px-2 py-2 text-right tabular-nums",
                            c.key === "roi" && "font-semibold",
                            c.key === "roi" && roiTone(value)
                          )}
                        >
                          {fmt(value, c.unit, currency)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
                {/* the account as a whole, so a platform is read against it */}
                <TableRow className="border-t-2 hover:bg-transparent">
                  <TableCell className="px-2 py-2 font-semibold">
                    Разом
                  </TableCell>
                  {COLUMNS.map((c) => {
                    const value =
                      c.from === "rates"
                        ? rates[c.key as keyof Rates]
                        : totals[c.key as "leads" | "ads" | "profit"]
                    return (
                      <TableCell
                        key={c.key}
                        className="px-2 py-2 text-right font-semibold tabular-nums"
                      >
                        {fmt(value, c.unit, currency)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
