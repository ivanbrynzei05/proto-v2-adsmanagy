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
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import { fmtNum } from "@/pages/dashboard/data"
import { adsTiles, type AdsReport, type CampaignStat } from "./data"
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

type Totals = AdsReport["totals"]

// The table, column by column. Module-level so the sort keeps its reference
// between renders - a fresh array every render would re-sort the whole list on
// every keystroke elsewhere in the card.
const COLUMNS: Column<CampaignStat, Totals>[] = [
  {
    key: "name",
    label: "Кампанія",
    sort: (c) => c.name,
    cell: (c) => (
      <span className="flex items-center gap-2">
        <PlatformBadge id={c.platform} size={14} />
        <span
          className={cn(
            "max-w-[260px] truncate font-medium",
            !c.active && "text-muted-foreground"
          )}
        >
          {c.name}
        </span>
        {/* leading-none keeps the pill under the row's own line height, so a
            paused campaign does not sit a couple of pixels taller than the
            rows around it */}
        {!c.active && (
          <span className="rounded-full bg-muted px-1.5 py-px text-[10px] leading-none font-medium text-muted-foreground">
            пауза
          </span>
        )}
      </span>
    ),
    total: () => "Разом",
  },
  {
    key: "ads",
    label: "Витрати",
    sort: (c) => c.money.ads,
    cell: (c, cash) => cash(c.money.ads),
    total: (t, cash) => cash(t.money.ads),
    strong: true,
  },
  {
    key: "impressions",
    label: "Покази",
    sort: (c) => c.impressions,
    cell: (c) => fmtNum(c.impressions),
    total: (t) => fmtNum(t.impressions),
  },
  {
    key: "clicks",
    label: "Кліки",
    sort: (c) => c.clicks,
    cell: (c) => fmtNum(c.clicks),
    total: (t) => fmtNum(t.clicks),
  },
  {
    key: "ctr",
    label: "CTR",
    sort: (c) => c.rates.ctr,
    cell: (c) => `${c.rates.ctr}%`,
    total: (t) => `${t.rates.ctr}%`,
  },
  {
    key: "cpm",
    label: "CPM",
    sort: (c) => c.rates.cpm,
    cell: (c, cash) => cash(c.rates.cpm),
    total: (t, cash) => cash(t.rates.cpm),
  },
  {
    key: "cpc",
    label: "CPC",
    sort: (c) => c.rates.cpc,
    cell: (c, cash) => cash(c.rates.cpc),
    total: (t, cash) => cash(t.rates.cpc),
  },
  {
    key: "leads",
    label: "Ліди",
    sort: (c) => c.leads,
    cell: (c) => fmtNum(c.leads),
    total: (t) => fmtNum(t.leads),
  },
  {
    key: "costPerLead",
    label: "Ціна ліда",
    sort: (c) => c.rates.costPerLead,
    cell: (c, cash) => cash(c.rates.costPerLead),
    total: (t, cash) => cash(t.rates.costPerLead),
  },
  {
    key: "approves",
    label: "Апруви",
    sort: (c) => c.approves,
    cell: (c) => fmtNum(c.approves),
    total: (t) => fmtNum(t.approves),
  },
  {
    key: "approveRate",
    label: "% апруву",
    sort: (c) => c.rates.approveRate,
    cell: (c) => `${c.rates.approveRate}%`,
    total: (t) => `${t.rates.approveRate}%`,
  },
  {
    key: "profit",
    label: "Дохід",
    sort: (c) => c.money.profit,
    cell: (c, cash) => cash(c.money.profit),
    total: (t, cash) => cash(t.money.profit),
    signed: true,
  },
  {
    key: "roi",
    label: "ROI",
    sort: (c) => c.rates.roi,
    cell: (c) => `${c.rates.roi}%`,
    total: (t) => `${t.rates.roi}%`,
    strong: true,
    signed: true,
  },
]

export function AdsMetricsCard({
  report,
  className,
}: {
  report: AdsReport
  className?: string
}) {
  const { currency } = useCurrency()
  const { campaigns, totals } = report
  const cash = (value: number) => fmt(value, "₴", currency)
  const view = useTableView(campaigns, COLUMNS)
  const table = useRef<HTMLDivElement>(null)

  return (
    <Card className={cn("gap-0 py-4 [--card-spacing:16px]", className)}>
      <CardContent className="flex flex-col gap-4">
        <MetricTiles tiles={adsTiles(totals)} />

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
                view.pageRows.map((c) => (
                  <TableRow key={c.id}>
                    {COLUMNS.map((column, j) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "px-2 py-2",
                          j > 0 && "text-right tabular-nums",
                          column.strong && "font-semibold",
                          column.signed &&
                            Number(column.sort(c)) < 0 &&
                            "text-destructive"
                        )}
                      >
                        {column.cell(c, cash)}
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
