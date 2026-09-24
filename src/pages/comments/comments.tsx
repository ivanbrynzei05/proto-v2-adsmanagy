import {
  IconBan,
  IconEye,
  IconEyeOff,
  IconMoodSad,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { useRef, useState } from "react"

import { useComments } from "@/components/comments-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChipCount, FilterChip } from "@/components/ui/filter-chip"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Segmented } from "@/components/ui/segmented"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  adTitle,
  ago,
  avatarTone,
  campaignLabel,
  CATEGORIES,
  categoryInfo,
  FB_AD_GROUPS,
  type CommentCategory,
  type FbComment,
} from "@/features/comments/types"
import { initialsOf } from "@/features/team/types"
import { pageOf } from "@/lib/paging"
import { cn } from "@/lib/utils"
import { ADS, plural } from "@/pages/campaigns/data"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"

const PAGE_SIZE = 20

// public comments and hidden ones - hiding moves a comment from one to the other
type View = "shown" | "hidden"

// what the rail shows per ad: how many, and how many of them need a look
type AdStats = { total: number; negative: number; spam: number }

const NO_STATS: AdStats = { total: 0, negative: 0, spam: 0 }

function commentsLabel(n: number) {
  return n + " " + plural(n, "коментар", "коментарі", "коментарів")
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {children}
    </span>
  )
}

function StatBadges({ stats }: { stats: AdStats }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-[11px] tabular-nums">
      {stats.negative > 0 && (
        <span className="flex items-center gap-0.5 text-destructive">
          <IconMoodSad className="size-3.5" aria-label="Негатив" />
          {stats.negative}
        </span>
      )}
      {stats.spam > 0 && (
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <IconBan className="size-3.5" aria-label="Спам" />
          {stats.spam}
        </span>
      )}
      <span className="min-w-6 text-right font-medium text-muted-foreground">
        {stats.total}
      </span>
    </span>
  )
}

function RailItem({
  active,
  label,
  stats,
  onClick,
  className,
}: {
  active: boolean
  label: string
  stats: AdStats
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active || undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <StatBadges stats={stats} />
    </button>
  )
}

// The ads the comments sit under, grouped by campaign - a rail to browse by on
// wide screens. Searchable, since an account runs far more ads than fit here.
function AdRail({
  value,
  onChange,
  stats,
  all,
}: {
  value: number | null
  onChange: (ad: number | null) => void
  stats: Map<number, AdStats>
  all: AdStats
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const groups = FB_AD_GROUPS.map((g) => ({
    campaign: g.campaign,
    ads: g.ads.filter(
      (i) =>
        !q ||
        adTitle(ADS[i]).toLowerCase().includes(q) ||
        g.campaign.toLowerCase().includes(q)
    ),
  })).filter((g) => g.ads.length > 0)

  return (
    <div className="hidden w-72 shrink-0 flex-col border-r lg:flex xl:w-80">
      <div className="relative border-b p-2.5">
        <IconSearch className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-8.5"
          placeholder="Пошук оголошення"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        <RailItem
          className="font-semibold"
          active={value === null}
          label="Усі оголошення"
          stats={all}
          onClick={() => onChange(null)}
        />
        {groups.map((g) => (
          <div key={g.campaign} className="mt-2.5">
            <p className="truncate px-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {campaignLabel(g.campaign)}
            </p>
            {g.ads.map((i) => (
              <RailItem
                key={i}
                active={value === i}
                label={adTitle(ADS[i])}
                stats={stats.get(i) ?? NO_STATS}
                onClick={() => onChange(i)}
              />
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Нічого не знайдено
          </p>
        )}
      </div>
    </div>
  )
}

// The same choice on a phone, where there is no room for the rail.
function AdSelect({
  value,
  onChange,
  stats,
  all,
}: {
  value: number | null
  onChange: (ad: number | null) => void
  stats: Map<number, AdStats>
  all: AdStats
}) {
  return (
    <div className="border-b p-2.5 lg:hidden">
      <Select
        value={value === null ? "all" : String(value)}
        onValueChange={(v) => onChange(v === "all" ? null : Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(v: string) =>
              v === "all" ? "Усі оголошення" : adTitle(ADS[Number(v)])
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Усі оголошення
            <Count>{all.total}</Count>
          </SelectItem>
          {FB_AD_GROUPS.map((g) => (
            <SelectGroup key={g.campaign}>
              <SelectLabel>{campaignLabel(g.campaign)}</SelectLabel>
              {g.ads.map((i) => (
                <SelectItem key={i} value={String(i)}>
                  {adTitle(ADS[i])}
                  <Count>{stats.get(i)?.total ?? 0}</Count>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CommentRow({
  c,
  showAd,
  selected,
  onSelect,
  onToggleHidden,
  onDelete,
}: {
  c: FbComment
  /** the ad is only worth repeating while every ad is listed */
  showAd: boolean
  selected: boolean
  onSelect: () => void
  onToggleHidden: () => void
  onDelete: () => void
}) {
  const row = ADS[c.ad]
  const cat = categoryInfo(c.category)

  return (
    <li
      className={cn(
        "flex gap-3 px-3 py-3 sm:px-4",
        selected && "bg-primary/[0.05]"
      )}
    >
      {/* bulk picking is a desktop affordance, like the campaign table's */}
      <div className="hidden pt-2 md:block">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label="Обрати коментар"
        />
      </div>
      <Avatar className="size-8">
        <AvatarFallback
          className={cn("text-[11px] font-semibold", avatarTone(c.author))}
        >
          {initialsOf(c.author)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold">{c.author}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            · {ago(c.at)}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 text-sm leading-snug break-words",
            c.hidden && "text-muted-foreground"
          )}
        >
          {c.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
              cat.tone
            )}
          >
            <cat.icon className="size-3" />
            {cat.label}
          </span>
          {showAd && (
            <span className="flex max-w-full min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <PlatformBadge id="facebook" size={12} />
              <span className="truncate">
                {adTitle(row)} · {campaignLabel(row.campaign ?? "")}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={c.hidden ? "Показати" : "Приховати"}
          title={c.hidden ? "Показати" : "Приховати"}
          onClick={onToggleHidden}
        >
          {c.hidden ? <IconEye /> : <IconEyeOff />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Видалити"
          title="Видалити"
          onClick={onDelete}
        >
          <IconTrash />
        </Button>
      </div>
    </li>
  )
}

// Comments under the Facebook ads, ad by ad: the rail picks the ad, the list
// shows a page of its comments, each marked with its kind - to hide or delete,
// one at a time or a page's worth at once.
export function CommentsPage() {
  const { comments, setHidden, remove } = useComments()
  const [view, setView] = useState<View>("shown")
  const [ad, setAd] = useState<number | null>(null)
  const [category, setCategory] = useState<CommentCategory | "all">("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  // kept while the dialog animates out
  const [toDelete, setToDelete] = useState<FbComment[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)

  // a new page is read from its top, with nothing picked on it
  function turnTo(next: number) {
    setPage(next)
    setPicked(new Set())
    listRef.current?.scrollTo({ top: 0 })
  }

  // whatever changes what is listed starts over from the first page
  function refilter(apply: () => void) {
    apply()
    turnTo(0)
  }

  // per-ad numbers for the rail, within the current view
  const inView = comments.filter((c) => c.hidden === (view === "hidden"))
  const stats = new Map<number, AdStats>()
  const all: AdStats = { total: 0, negative: 0, spam: 0 }
  for (const c of inView) {
    const s = stats.get(c.ad) ?? { total: 0, negative: 0, spam: 0 }
    for (const t of [s, all]) {
      t.total++
      if (c.category === "negative") t.negative++
      if (c.category === "spam") t.spam++
    }
    stats.set(c.ad, s)
  }

  const ofAd = ad === null ? comments : comments.filter((c) => c.ad === ad)
  const hiddenCount = ofAd.filter((c) => c.hidden).length
  const q = query.trim().toLowerCase()
  // everything but the kind, so the chips can count within it
  const base = ofAd.filter(
    (c) =>
      c.hidden === (view === "hidden") &&
      (!q ||
        c.text.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q))
  )
  const list = base
    .filter((c) => category === "all" || c.category === category)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
  const paged = pageOf(list, page, PAGE_SIZE)
  const onPage = paged.items.filter((c) => picked.has(c.id))
  const allPicked =
    paged.items.length > 0 && onPage.length === paged.items.length

  function toggle(id: string) {
    setPicked((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function askDelete(items: FbComment[]) {
    setToDelete(items)
    setDeleteOpen(true)
  }

  return (
    <div className="flex h-[calc(100svh-58px)] w-full min-w-0 flex-col gap-3 overflow-hidden p-2.5 sm:gap-4 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">Коментарі</h1>
        {/* automoderation is parked for now - the tab keeps its place */}
        <Segmented
          className="order-last w-full sm:order-none sm:w-auto"
          value="inbox"
          onChange={() => {}}
          options={[
            { id: "inbox", label: "Вхідні" },
            { id: "automod", label: "Автомодерація", disabled: true },
          ]}
        />
      </div>

      <Card className="min-h-0 flex-1 flex-row gap-0 overflow-hidden py-0">
        <AdRail
          value={ad}
          onChange={(next) => refilter(() => setAd(next))}
          stats={stats}
          all={all}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdSelect
            value={ad}
            onChange={(next) => refilter(() => setAd(next))}
            stats={stats}
            all={all}
          />

          <div className="flex flex-wrap items-center gap-2 border-b p-2.5 sm:p-3">
            <Segmented
              className="w-full sm:w-auto"
              value={view}
              onChange={(next) => refilter(() => setView(next))}
              options={[
                {
                  id: "shown",
                  label: (
                    <>
                      Показані <Count>{ofAd.length - hiddenCount}</Count>
                    </>
                  ),
                },
                {
                  id: "hidden",
                  label: (
                    <>
                      Приховані <Count>{hiddenCount}</Count>
                    </>
                  ),
                },
              ]}
            />
            <div className="relative min-w-0 flex-1 sm:ml-auto sm:max-w-64">
              <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8.5"
                placeholder="Пошук у коментарях"
                value={query}
                onChange={(e) => refilter(() => setQuery(e.target.value))}
              />
            </div>
          </div>

          <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto border-b px-2.5 py-2 sm:px-3 [&::-webkit-scrollbar]:hidden">
            <FilterChip
              active={category === "all"}
              onClick={() => refilter(() => setCategory("all"))}
            >
              Усі <ChipCount>{base.length}</ChipCount>
            </FilterChip>
            {CATEGORIES.map((cat) => {
              const n = base.filter((c) => c.category === cat.id).length
              if (n === 0 && category !== cat.id) return null
              return (
                <FilterChip
                  key={cat.id}
                  active={category === cat.id}
                  onClick={() => refilter(() => setCategory(cat.id))}
                >
                  <cat.icon />
                  {cat.label}
                  <ChipCount>{n}</ChipCount>
                </FilterChip>
              )
            })}
          </div>

          {/* the page's worth at once - pick, then hide or delete together */}
          {list.length > 0 && (
            <div className="hidden h-11 shrink-0 items-center gap-3 border-b px-4 md:flex">
              <Checkbox
                checked={allPicked}
                indeterminate={onPage.length > 0 && !allPicked}
                onCheckedChange={() =>
                  setPicked(
                    allPicked
                      ? new Set()
                      : new Set(paged.items.map((c) => c.id))
                  )
                }
                aria-label="Обрати всі на сторінці"
              />
              {onPage.length > 0 ? (
                <>
                  <span className="text-[13px] font-semibold text-primary tabular-nums">
                    Обрано: {onPage.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHidden(
                        onPage.map((c) => c.id),
                        view !== "hidden"
                      )
                      setPicked(new Set())
                    }}
                  >
                    {view === "hidden" ? <IconEye /> : <IconEyeOff />}
                    {view === "hidden" ? "Показати" : "Приховати"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => askDelete(onPage)}
                  >
                    <IconTrash />
                    Видалити
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPicked(new Set())}
                  >
                    <IconX />
                    Зняти
                  </Button>
                </>
              ) : (
                <span className="min-w-0 truncate text-[13px] text-muted-foreground">
                  {ad === null ? "Усі оголошення" : adTitle(ADS[ad])} ·{" "}
                  {commentsLabel(list.length)}
                </span>
              )}
            </div>
          )}

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Коментарів немає
              </p>
            ) : (
              <ul className="divide-y">
                {paged.items.map((c) => (
                  <CommentRow
                    key={c.id}
                    c={c}
                    showAd={ad === null}
                    selected={picked.has(c.id)}
                    onSelect={() => toggle(c.id)}
                    onToggleHidden={() => setHidden([c.id], !c.hidden)}
                    onDelete={() => askDelete([c])}
                  />
                ))}
              </ul>
            )}
          </div>

          <Pagination
            page={paged.page}
            pageCount={paged.pageCount}
            size={PAGE_SIZE}
            total={list.length}
            onPage={turnTo}
          />
        </div>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {toDelete.length === 1
                ? "Видалити коментар?"
                : "Видалити " + commentsLabel(toDelete.length) + "?"}
            </DialogTitle>
            {toDelete.length === 1 && (
              <DialogDescription>
                {toDelete[0].author}: «{toDelete[0].text}»
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                remove(toDelete.map((c) => c.id))
                setPicked(new Set())
                setDeleteOpen(false)
              }}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
