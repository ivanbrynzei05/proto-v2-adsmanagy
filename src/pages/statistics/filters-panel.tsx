import {
  IconChevronDown,
  IconDatabase,
  IconHeadset,
  IconPackage,
  IconSpeakerphone,
  IconUsers,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type CrmType } from "@/features/integrations/types"
import { type TeamMember } from "@/features/team/types"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/pages/campaigns/date-range"
import type { DateRange } from "@/pages/campaigns/date-utils"
import { countFilters, matchingAccounts, type ReportFilters } from "./data"
import { useDraftFilters } from "./draft-filters"
import {
  adsTree,
  flatTree,
  productsTree,
  teamTree,
  TreePicker,
} from "./filter-tree"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
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

export type FilterGroupsProps = {
  filters: ReportFilters
  onFilters: (f: ReportFilters) => void
  /**
   * The CRMs this account has connected, or the demo ones when it has none.
   * `type` is the system behind the connection's own name — it is what the
   * product rows are marked with.
   */
  crmOptions: { id: string; name: string; type: CrmType }[]
  /** the call centres the report is built from, connected or demo */
  centerOptions: { id: string; name: string }[]
  /** everyone the account gave access to - empty on a one-person account */
  members: TeamMember[]
}

/**
 * Every source group, one under the other. The panel on the left of the chart
 * and the sheet a phone slides up both draw exactly this - the filters are the
 * same filters either way, only the thing carrying them changes.
 *
 * The sources are a property of the account, not of the chart currently on
 * screen, so every group is here on every breakdown rather than appearing and
 * disappearing with the tabs. Folded by default, and open on its own the moment
 * it is narrowing something.
 */
export function FilterGroups({
  filters,
  onFilters,
  crmOptions,
  centerOptions,
  members,
  className,
}: FilterGroupsProps & { className?: string }) {
  // Every tree is built once and then held: the catalogue alone is a couple of
  // thousand nodes, and rebuilding it on each tick would both cost that and
  // reshuffle the pickers' pages under whoever is ticking.
  const team = useMemo(() => teamTree(members), [members])
  const products = useMemo(() => productsTree(crmOptions), [crmOptions])
  const centers = useMemo(
    () => flatTree(centerOptions, "centers"),
    [centerOptions]
  )
  const crms = useMemo(() => flatTree(crmOptions, "crms"), [crmOptions])
  // the exception, and it has to be: a cabinet that the platforms above it - or
  // the people the report is read for - rule out is shown, but greyed, so this
  // one is rebuilt as the ticks that grey it change
  const ads = useMemo(
    () =>
      adsTree(
        matchingAccounts({ ...filters, accounts: [] }, members).map((a) => a.id)
      ),
    [filters, members]
  )

  return (
    <section className={cn("flex flex-col divide-y", className)}>
      {/* Whose numbers these are comes before what they are cut by: a lead
            reads the report for one buyer, and every group under this one then
            narrows that person's traffic rather than the account's. A team of
            nobody has nothing to pick, so the group is not drawn at all. */}
      {members.length > 0 && (
        <FilterGroup
          title="Команда"
          icon={IconUsers}
          count={filters.members.length}
          onClear={() => onFilters({ ...filters, members: [] })}
        >
          {/* A lead carries their buyers as children, and their own box picks
                the lead alone - reading a lead without their team is a tick on
                the lead and nothing under it. */}
          <TreePicker
            label="Користувачі"
            nodes={team}
            filters={filters}
            onFilters={onFilters}
          />
        </FilterGroup>
      )}

      <FilterGroup
        title="Реклама"
        icon={IconSpeakerphone}
        count={
          filters.platforms.length +
          filters.portfolios.length +
          filters.accounts.length
        }
        onClear={() =>
          onFilters({
            ...filters,
            platforms: [],
            portfolios: [],
            accounts: [],
          })
        }
      >
        {/* Three tiers in one picker, which is how the API sends them: the
              platform holds its business accounts, and those hold the cabinets
              the report is actually cut by. */}
        <TreePicker
          label="Джерела"
          nodes={ads}
          filters={filters}
          onFilters={onFilters}
        />
      </FilterGroup>

      <FilterGroup
        title="Товари"
        icon={IconPackage}
        count={filters.products.length}
        onClear={() => onFilters({ ...filters, products: [] })}
      >
        {/* One flat catalogue: the CRM a товар came from is a mark on its row,
              and picking a CRM is what the group below is for. It runs to a
              couple of thousand, so it is typed into rather than paged
              through. */}
        <TreePicker
          label="Товари"
          searchable
          nodes={products}
          filters={filters}
          onFilters={onFilters}
        />
      </FilterGroup>

      <FilterGroup
        title="Колцентри"
        icon={IconHeadset}
        count={filters.centers.length}
        onClear={() => onFilters({ ...filters, centers: [] })}
      >
        {/* One tier - the same component, drawing a flat list because the
              category has nothing under its rows. */}
        <TreePicker
          label="Колцентри"
          nodes={centers}
          filters={filters}
          onFilters={onFilters}
        />
      </FilterGroup>

      <FilterGroup
        title="CRM"
        icon={IconDatabase}
        count={filters.crms.length}
        onClear={() => onFilters({ ...filters, crms: [] })}
      >
        <TreePicker
          label="Системи"
          nodes={crms}
          filters={filters}
          onFilters={onFilters}
        />
      </FilterGroup>
    </section>
  )
}

/**
 * The panel down the left of the report: the period, then every filter group,
 * then the button that hands them over.
 *
 * The period applies the moment it is picked and the filters do not - the
 * period is one control and one decision, while a set of filters is ticked
 * across five groups and is only worth rebuilding the report once it is
 * finished. That split is why the two sit in sections of their own.
 */
export function FiltersPanel({
  range,
  onRange,
  filters,
  onFilters,
  ...groups
}: FilterGroupsProps & {
  range: DateRange
  onRange: (r: DateRange) => void
}) {
  const { draft, setDraft, dirty, apply, clear } = useDraftFilters(
    filters,
    onFilters
  )
  // what the panel says is ticked is what the panel is holding, applied or not
  const active = countFilters(draft)

  return (
    // overflow-visible, against the card's own default: the footer below is
    // sticky, and a card that clips is a scroll container of its own for it -
    // one that never scrolls, which pins the button to nothing. The two bands
    // on the corners round themselves instead of being cut to shape.
    <Card className="gap-0 divide-y overflow-visible py-0">
      {/* Both halves of the panel are headed the same way: a band with the
          section's name on it, and what it holds under it. The period is still
          not one of the filters - the split into two sections is what says so,
          rather than one of the two names being set differently from the
          other. */}
      <div className="flex items-center gap-2 rounded-t-xl bg-muted/50 px-4 py-2.5">
        <SectionTitle>Період</SectionTitle>
      </div>
      <section className="px-4 py-3.5">
        <DateRangePicker
          value={range}
          onChange={onRange}
          className="h-9 w-full justify-between"
        />
      </section>

      <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5">
        <SectionTitle>Фільтри</SectionTitle>
        {active > 0 && (
          <>
            <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary tabular-nums">
              {active}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-auto rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
            >
              Скинути все
            </button>
          </>
        )}
      </div>
      <FilterGroups
        {...groups}
        filters={draft}
        onFilters={setDraft}
        className="px-4"
      />

      {/* The panel scrolls inside itself once the groups are open, so the
          button rides the bottom of it rather than sitting a screen below the
          last tick. Dead until the draft says something the report is not
          already built from - there is nothing to apply until then.
          The hairline is a shadow rather than a border: the divider above the
          bar belongs to the groups and scrolls away with them, and a border of
          its own would double that line up whenever the panel fits. */}
      <div className="sticky bottom-0 z-10 rounded-b-xl bg-card p-4 shadow-[0_-1px_0_var(--border)]">
        <Button className="h-9 w-full" disabled={!dirty} onClick={apply}>
          Застосувати
        </Button>
      </div>
    </Card>
  )
}
