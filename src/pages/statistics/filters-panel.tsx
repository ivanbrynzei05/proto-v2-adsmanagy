import {
  IconChevronDown,
  IconDatabase,
  IconHeadset,
  IconPackage,
  IconSearch,
  IconSpeakerphone,
} from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  AD_ACCOUNTS,
  PLATFORMS,
  PORTFOLIOS,
  type PlatformId,
} from "@/pages/campaigns/data"
import { DateRangePicker } from "@/pages/campaigns/date-range"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import type { DateRange } from "@/pages/campaigns/date-utils"
import {
  EMPTY_FILTERS,
  matchingAccounts,
  PRODUCT_OPTIONS,
  type CampaignState,
  type ReportFilters,
} from "./data"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

// One multi-select over a list of sources. The trigger says what it is and how
// much of it is on, so the section needs no label of its own: nothing ticked
// means everything is in, which is what "усі" on the trigger says.
// How many rows a searchable list draws at once. The catalogue runs to a
// couple of thousand; nobody reads past the first screen, and what is not on it
// is reached by typing rather than by scrolling.
const PICKER_ROWS = 40

function SourcePicker<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
  searchable,
}: {
  label: string
  options: { id: T; name: string; icon?: React.ReactNode; disabled?: boolean }[]
  selected: T[]
  onToggle: (id: T) => void
  onClear: () => void
  /** long lists get a field at the top instead of a very long scroll */
  searchable?: boolean
}) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const matched = needle
    ? options.filter((o) => o.name.toLowerCase().includes(needle))
    : options
  // what is ticked stays on screen whatever the search says, so a tick is never
  // lost behind a query that no longer matches it
  const shown = searchable
    ? [
        ...matched.filter((o) => selected.includes(o.id)),
        ...matched.filter((o) => !selected.includes(o.id)),
      ].slice(0, PICKER_ROWS)
    : matched

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-full justify-between gap-1.5 font-normal"
          >
            <span className="truncate">
              {label}:{" "}
              <span className="font-medium">
                {selected.length === 0 ? "усі" : selected.length}
              </span>
            </span>
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-72 p-0">
        {searchable && (
          <div className="border-b p-1.5">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук"
                className="h-8 pl-8"
              />
            </div>
          </div>
        )}
        <div className="max-h-[46vh] overflow-y-auto p-1">
          {shown.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Нічого не знайдено
            </p>
          ) : (
            shown.map((o) => (
              <DropdownMenuCheckboxItem
                key={o.id}
                checked={selected.includes(o.id)}
                disabled={o.disabled}
                onCheckedChange={() => onToggle(o.id)}
                closeOnClick={false}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {o.icon}
                  <span className="truncate">{o.name}</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-1">
              <DropdownMenuItem closeOnClick={false} onClick={onClear}>
                Показати всі
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// A folded group of source filters. The header carries how many of them are on,
// so a closed group still says whether it is narrowing anything - and opens on
// its own the moment it is.
function FilterGroup({
  title,
  icon: Icon,
  count,
  onClear,
  children,
}: {
  title: string
  icon: typeof IconSpeakerphone
  count: number
  onClear: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(count > 0)

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 py-2.5 text-left"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-medium">{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary tabular-nums">
              {count}
            </span>
          )}
          <IconChevronDown
            className={cn(
              "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
              !open && "-rotate-90"
            )}
          />
        </button>
        {count > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Скинути
          </button>
        )}
      </div>
      {/* a 0fr -> 1fr grid row is what makes the fold animate: the row has a
          real height to travel to without anyone measuring the content */}
      <div
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 pb-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value]
}

export function FiltersPanel({
  range,
  onRange,
  filters,
  onFilters,
  crmOptions,
  centerOptions,
}: {
  range: DateRange
  onRange: (r: DateRange) => void
  filters: ReportFilters
  onFilters: (f: ReportFilters) => void
  /** the CRMs this account has connected, or the demo ones when it has none */
  crmOptions: { id: string; name: string }[]
  /** the call centres the report is built from, connected or demo */
  centerOptions: { id: string; name: string }[]
}) {
  // everything ticked across every group, for the badge on the band
  const active = Object.values(filters).reduce(
    (a, list) => a + (list as string[]).length,
    0
  )
  // a cabinet that the platforms above it rule out is shown, but greyed - the
  // list is how you see which cabinets a platform even has
  const reachable = matchingAccounts({ ...filters, accounts: [] }).map(
    (a) => a.id
  )

  return (
    <Card className="gap-0 divide-y py-0">
      <section className="flex flex-col gap-2 px-4 py-3.5">
        <SectionTitle>Період</SectionTitle>
        <DateRangePicker
          value={range}
          onChange={onRange}
          className="h-9 w-full justify-between"
        />
      </section>

      {/* the filters get a band of their own so the period above them reads as
          the frame of the report rather than as the first filter in the list */}
      <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5">
        <SectionTitle>Фільтри</SectionTitle>
        {active > 0 && (
          <>
            <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary tabular-nums">
              {active}
            </span>
            <button
              type="button"
              onClick={() => onFilters(EMPTY_FILTERS)}
              className="ml-auto rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
            >
              Скинути все
            </button>
          </>
        )}
      </div>
      {/* The sources are a property of the account, not of the chart currently
          on screen, so every group is here on every breakdown rather than
          appearing and disappearing with the tabs. Folded by default, and open
          on its own the moment it is narrowing something. */}
      <section className="flex flex-col divide-y px-4">
        <FilterGroup
          title="Реклама"
          icon={IconSpeakerphone}
          count={
            filters.platforms.length +
            filters.portfolios.length +
            filters.accounts.length +
            filters.states.length
          }
          onClear={() =>
            onFilters({
              ...filters,
              platforms: [],
              portfolios: [],
              accounts: [],
              states: [],
            })
          }
        >
          <SourcePicker<PlatformId>
            label="Платформи"
            options={PLATFORMS.map((p) => ({
              id: p.id,
              name: p.label,
              icon: <PlatformBadge id={p.id} size={14} />,
            }))}
            selected={filters.platforms}
            onToggle={(id) =>
              onFilters({
                ...filters,
                platforms: toggle(filters.platforms, id),
              })
            }
            onClear={() => onFilters({ ...filters, platforms: [] })}
          />
          <SourcePicker
            label="Бізнес-акаунти"
            options={PORTFOLIOS.map((p) => ({ id: p.id, name: p.name }))}
            selected={filters.portfolios}
            onToggle={(id) =>
              onFilters({
                ...filters,
                portfolios: toggle(filters.portfolios, id),
              })
            }
            onClear={() => onFilters({ ...filters, portfolios: [] })}
          />
          <SourcePicker
            label="Рекламні кабінети"
            options={AD_ACCOUNTS.map((a) => ({
              id: a.id,
              name: a.name,
              icon: <PlatformBadge id={a.platform} size={14} />,
              disabled: !reachable.includes(a.id),
            }))}
            selected={filters.accounts}
            onToggle={(id) =>
              onFilters({ ...filters, accounts: toggle(filters.accounts, id) })
            }
            onClear={() => onFilters({ ...filters, accounts: [] })}
          />
          <SourcePicker<CampaignState>
            label="Стан"
            options={[
              { id: "active", name: "Активні" },
              { id: "paused", name: "На паузі" },
            ]}
            selected={filters.states}
            onToggle={(id) =>
              onFilters({ ...filters, states: toggle(filters.states, id) })
            }
            onClear={() => onFilters({ ...filters, states: [] })}
          />
        </FilterGroup>

        <FilterGroup
          title="Товари"
          icon={IconPackage}
          count={filters.products.length}
          onClear={() => onFilters({ ...filters, products: [] })}
        >
          {/* the catalogue runs to a couple of thousand, so this one is typed
              into rather than scrolled through */}
          <SourcePicker
            label="Товари"
            searchable
            options={PRODUCT_OPTIONS.map((p) => ({ id: p.id, name: p.name }))}
            selected={filters.products}
            onToggle={(id) =>
              onFilters({ ...filters, products: toggle(filters.products, id) })
            }
            onClear={() => onFilters({ ...filters, products: [] })}
          />
        </FilterGroup>

        <FilterGroup
          title="Колцентри"
          icon={IconHeadset}
          count={filters.centers.length}
          onClear={() => onFilters({ ...filters, centers: [] })}
        >
          <SourcePicker
            label="Колцентри"
            options={centerOptions}
            selected={filters.centers}
            onToggle={(id) =>
              onFilters({ ...filters, centers: toggle(filters.centers, id) })
            }
            onClear={() => onFilters({ ...filters, centers: [] })}
          />
        </FilterGroup>

        <FilterGroup
          title="CRM"
          icon={IconDatabase}
          count={filters.crms.length}
          onClear={() => onFilters({ ...filters, crms: [] })}
        >
          <SourcePicker
            label="Системи"
            options={crmOptions}
            selected={filters.crms}
            onToggle={(id) =>
              onFilters({ ...filters, crms: toggle(filters.crms, id) })
            }
            onClear={() => onFilters({ ...filters, crms: [] })}
          />
        </FilterGroup>
      </section>
    </Card>
  )
}
