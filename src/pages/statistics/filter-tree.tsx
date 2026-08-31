/* eslint-disable react-refresh/only-export-components */
import { IconChevronDown, IconSearch, IconTag } from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CrmLogo } from "@/features/integrations/logos"
import { type CrmType } from "@/features/integrations/types"
import { type TeamMember } from "@/features/team/types"
import { cn } from "@/lib/utils"
import { AD_ACCOUNTS, PLATFORMS, PORTFOLIOS } from "@/pages/campaigns/data"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import { PRODUCT_OPTIONS, type ReportFilters } from "./data"

/** Which list in the panel's state a node writes to. */
export type FilterField =
  | "platforms"
  | "portfolios"
  | "accounts"
  | "products"
  | "centers"
  | "crms"
  | "members"

/**
 * One node of a filter category, at any tier — the same shape the API sends as
 * `meta.filters[].options[]`, plus which list it belongs to.
 *
 * `children` undefined is a leaf, which is the API's `children: null`.
 */
export type FilterNode = {
  id: string
  label: string
  field: FilterField
  icon?: React.ReactNode
  /**
   * The code the row is really picked by, drawn as a chip at the end of it — a
   * product id, where two products share a name and only the id tells them
   * apart. Searched as well as shown.
   */
  badge?: string
  disabled?: boolean
  /**
   * A tier that only groups: it has no id of its own to send, so it gets no
   * checkbox. The API's platform and connection tiers are exactly this — the
   * route takes cabinet uuids and `<connection>:<product>`, never the tier
   * above them.
   */
  group?: boolean
  children?: FilterNode[]
}

// The catalogue runs to a couple of thousand; a tier shows the first screen of
// them and the rest is reached by typing.
const ROWS_PER_NODE = 40

function has(filters: ReportFilters, node: FilterNode) {
  return (filters[node.field] as string[]).includes(node.id)
}

function toggleOwn(filters: ReportFilters, node: FilterNode): ReportFilters {
  const list = filters[node.field] as string[]
  return {
    ...filters,
    [node.field]: list.includes(node.id)
      ? list.filter((id) => id !== node.id)
      : [...list, node.id],
  }
}

function countPicked(nodes: FilterNode[], filters: ReportFilters): number {
  return nodes.reduce(
    (total, node) =>
      total +
      (!node.group && has(filters, node) ? 1 : 0) +
      countPicked(node.children ?? [], filters),
    0
  )
}

/**
 * The search keeps a node when it matches, or when anything under it does. The
 * chip is matched alongside the name: a товар is looked up by its id at least
 * as often as by what it is called, and the id is right there on the row.
 */
function prune(nodes: FilterNode[], needle: string): FilterNode[] {
  if (!needle) return nodes
  const out: FilterNode[] = []
  for (const node of nodes) {
    const self =
      node.label.toLowerCase().includes(needle) ||
      (node.badge?.toLowerCase().includes(needle) ?? false)
    const kids = prune(node.children ?? [], needle)
    if (self || kids.length) {
      out.push({ ...node, children: self ? node.children : kids })
    }
  }
  return out
}

/**
 * One node and everything under it. The tree is always open: the indent is what
 * says which tier a row belongs to, and nothing is hidden behind a fold.
 */
function Row({
  node,
  depth,
  filters,
  onFilters,
}: {
  node: FilterNode
  depth: number
  filters: ReportFilters
  onFilters: (next: ReportFilters) => void
}) {
  const children = node.children ?? []
  // The cut at ROWS_PER_NODE is what keeps a couple of thousand товарів out of
  // the DOM. A row ticked through the search box and then left behind by the
  // cut could never be taken off again, so ticked rows float to the top of
  // their tier - the sort is stable, and everything else keeps the order it
  // came in.
  const rows =
    children.length > ROWS_PER_NODE
      ? [...children].sort(
          (a, b) =>
            Number(!b.group && has(filters, b)) -
            Number(!a.group && has(filters, a))
        )
      : children

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md py-1.5 pr-2",
          node.group ? "pt-2.5" : "hover:bg-accent",
          node.disabled && "opacity-50"
        )}
        style={{ paddingLeft: 8 + depth * 18 }}
      >
        {/* The node's own box picks the node itself and nothing else. That is
            what lets a lead be read without their buyers. A grouping tier has
            no id to send, so it gets no box. */}
        {node.group ? null : (
          <Checkbox
            checked={has(filters, node)}
            disabled={node.disabled}
            onCheckedChange={() => onFilters(toggleOwn(filters, node))}
          />
        )}

        {node.group ? (
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {node.label}
          </span>
        ) : (
          <button
            type="button"
            disabled={node.disabled}
            onClick={() => onFilters(toggleOwn(filters, node))}
            className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
          >
            {node.icon}
            <span className="truncate">{node.label}</span>
            {node.badge && (
              // the same #id chip the campaigns table and the product picker
              // carry, so an id reads the same wherever it is shown
              <Badge
                variant="secondary"
                className="ml-auto h-4 shrink-0 gap-1 px-1.5 font-mono text-[10px] tracking-tight tabular-nums"
              >
                <IconTag className="size-3" />
                {node.badge}
              </Badge>
            )}
          </button>
        )}
      </div>

      {rows.slice(0, ROWS_PER_NODE).map((child) => (
        <Row
          key={child.id}
          node={child}
          depth={depth + 1}
          filters={filters}
          onFilters={onFilters}
        />
      ))}
      {children.length > ROWS_PER_NODE && (
        <p
          className="py-1.5 text-xs text-muted-foreground"
          style={{ paddingLeft: 8 + (depth + 1) * 18 }}
        >
          ще {children.length - ROWS_PER_NODE} — шукай полем вище
        </p>
      )}
    </>
  )
}

/**
 * One filter category, drawn as the tree the API sends.
 *
 * One component for all of them: a category with one tier draws a flat list and
 * a category with three draws three, and neither needs a picker of its own.
 */
export function TreePicker({
  label,
  nodes,
  filters,
  onFilters,
  searchable,
}: {
  label: string
  nodes: FilterNode[]
  filters: ReportFilters
  onFilters: (next: ReportFilters) => void
  searchable?: boolean
}) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const shown = useMemo(() => prune(nodes, needle), [nodes, needle])
  const picked = countPicked(nodes, filters)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-full justify-between gap-1.5 font-normal"
          >
            <span className="truncate">
              {label}:{" "}
              <span className="font-medium">
                {picked === 0 ? "усі" : picked}
              </span>
            </span>
            <IconChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 p-0">
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
            shown.map((node) => (
              <Row
                key={node.id}
                node={node}
                depth={0}
                filters={filters}
                onFilters={onFilters}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// --- the trees themselves -----------------------------------------------------

/** Платформа › Бізнес-акаунт › Кабінет — three tiers, as the API sends them. */
export function adsTree(reachable: string[]): FilterNode[] {
  return PLATFORMS.map((platform) => {
    const mine = AD_ACCOUNTS.filter((a) => a.platform === platform.id)
    return {
      id: platform.id,
      label: platform.label,
      field: "platforms" as const,
      icon: <PlatformBadge id={platform.id} size={14} />,
      children: PORTFOLIOS.filter((p) =>
        mine.some((a) => a.business === p.id)
      ).map((portfolio) => ({
        id: portfolio.id,
        label: portfolio.name,
        field: "portfolios" as const,
        children: mine
          .filter((a) => a.business === portfolio.id)
          .map((account) => ({
            id: account.id,
            label: account.name,
            field: "accounts" as const,
            disabled: !reachable.includes(account.id),
          })),
      })),
    }
  }).filter((platform) => platform.children.length > 0)
}

/**
 * CRM › Товар. Nothing in the demo says which CRM sells what, so the catalogue
 * is dealt out over the connected ones — the shape is the point, not the split.
 *
 * A row carries the mark of the system it came from and the id it is picked by:
 * the header above it scrolls away, and the catalogue really does hold two
 * товари of the same name under different ids.
 */
export function productsTree(
  crms: { id: string; name: string; type: CrmType }[]
): FilterNode[] {
  if (crms.length === 0) return []
  return crms.map((crm, index) => ({
    id: crm.id,
    label: crm.name,
    field: "crms" as const,
    // grouping only: the CRM itself is picked in its own category
    group: true,
    children: PRODUCT_OPTIONS.filter((_, i) => i % crms.length === index).map(
      (product) => ({
        id: product.id,
        label: product.name,
        field: "products" as const,
        icon: <CrmLogo type={crm.type} className="size-4 text-[9px]" />,
        badge: product.id,
      })
    ),
  }))
}

/** Тімлід › Баєр. Everyone with nobody above them sits at the top. */
export function teamTree(members: TeamMember[]): FilterNode[] {
  const node = (member: TeamMember): FilterNode => ({
    id: member.id,
    label: member.name,
    field: "members",
  })
  return members
    .filter((member) => !member.leadId)
    .map((member) => {
      const buyers = members.filter((m) => m.leadId === member.id)
      return buyers.length
        ? { ...node(member), children: buyers.map(node) }
        : node(member)
    })
}

/** A one-tier category — the same component, a list with no children. */
export function flatTree(
  options: { id: string; name: string }[],
  field: FilterField
): FilterNode[] {
  return options.map((option) => ({
    id: option.id,
    label: option.name,
    field,
  }))
}
