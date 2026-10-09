import {
  IconChevronDown,
  IconRestore,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react"
import { useMemo, useState } from "react"

import { useTeam } from "@/components/team-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { type TeamMember } from "@/features/team/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  AD_ACCOUNTS,
  AD_LOGINS,
  PLATFORMS,
  type AdAccount,
  type AdLogin,
  type PlatformId,
} from "@/pages/campaigns/data"
import { PlatformBadge } from "@/pages/campaigns/platform-badge"
import { adsSummary, runnerOf } from "./data"

// the rail's first line - every platform at once
const ALL_PLATFORMS = "all"

// The platforms something is connected on, in the catalogue's order. One with
// nothing on it has nothing to narrow to, so it is not listed.
const LIVE_PLATFORMS = PLATFORMS.filter((p) =>
  AD_LOGINS.some((l) => l.platform === p.id)
)

const LOGIN_NAME = new Map(AD_LOGINS.map((l) => [l.id, l.name.toLowerCase()]))

// One line of the rail: a column beside the list, a pill in a sideways strip on
// a phone. The number is how many of that platform's cabinets are ticked, and
// it only shows once some are - so the rail also says where the selection sits.
function RailItem({
  label,
  icon,
  picked,
  active,
  onClick,
  strip,
}: {
  label: string
  icon?: React.ReactNode
  picked: number
  active: boolean
  onClick: () => void
  strip: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
        !strip && "w-full",
        active
          ? "bg-foreground/[0.08] font-medium text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.04]"
      )}
    >
      {/* the spacer keeps Усі in line with the platforms under it */}
      {icon ?? (!strip && <span className="size-3.5 shrink-0" />)}
      <span className="truncate">{label}</span>
      {picked > 0 && (
        <span
          className={cn(
            "rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary tabular-nums",
            !strip && "ml-auto"
          )}
        >
          {picked}
        </span>
      )}
    </button>
  )
}

// A login and its cabinets. The cabinets are chips laid out under the login
// rather than rows of their own: their names are short and repeat from login to
// login - RK1, RK2 - and only read right beside the login they belong to. The
// login's line says whose it is, and its box ticks all of them.
function LoginRow({
  login,
  buyer,
  cabinets,
  picked,
  canPick,
  onPick,
}: {
  login: AdLogin
  /** who runs the login, and with it every cabinet under it */
  buyer: TeamMember | null
  cabinets: AdAccount[]
  picked: Set<string>
  canPick: (cabinet: AdAccount) => boolean
  onPick: (ids: string[], on: boolean) => void
}) {
  const open = cabinets.filter(canPick)
  const on = open.filter((c) => picked.has(c.id)).length

  return (
    <div className="px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Checkbox
          checked={open.length > 0 && on === open.length}
          indeterminate={on > 0 && on < open.length}
          disabled={open.length === 0}
          onCheckedChange={(next) =>
            onPick(
              open.map((c) => c.id),
              next
            )
          }
          aria-label={"Усі кабінети акаунта " + login.name}
        />
        <PlatformBadge id={login.platform} size={14} />
        <span className="truncate text-[13px] font-medium">{login.name}</span>
        {/* quieter than the login's own name, the same person glyph the
            campaigns table marks its authors with */}
        {buyer && (
          <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <IconUser className="size-3 shrink-0 opacity-70" />
            <span className="truncate">{buyer.name}</span>
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 pl-7">
        {cabinets.map((c) => {
          const active = picked.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              disabled={!canPick(c)}
              onClick={() => onPick([c.id], !active)}
              className={cn(
                "max-w-full truncate rounded-md border px-2 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                active
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-input bg-background hover:bg-muted"
              )}
            >
              {c.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Everything inside the picker, in the tiers the API sends: the platform on
 * the rail, its accounts in the list, each account's cabinets under it - and a
 * search over accounts, cabinets and buyers, with one button that ticks all of
 * what the rail and the search leave.
 *
 * Mounted on every open, so it always starts on the whole list.
 */
function AdsBrowser({
  value,
  onChange,
  reachable,
  compact,
}: {
  value: string[]
  onChange: (next: string[]) => void
  reachable?: string[]
  /** a phone: the rail turns into a strip above the list */
  compact: boolean
}) {
  const [platform, setPlatform] = useState<PlatformId | typeof ALL_PLATFORMS>(
    ALL_PLATFORMS
  )
  const [query, setQuery] = useState("")
  const { members } = useTeam()

  // who runs each login - the same deal the Команда filter reads
  const runners = useMemo(
    () => new Map(AD_LOGINS.map((l) => [l.id, runnerOf(l.id, members)])),
    [members]
  )
  const buyerOf = (c: AdAccount) => runners.get(c.login) ?? null
  const picked = useMemo(() => new Set(value), [value])
  const allowed = useMemo(
    () => (reachable ? new Set(reachable) : null),
    [reachable]
  )
  const canPick = (c: AdAccount) => !allowed || allowed.has(c.id)

  // The search reads everything a chip shows: a login whose name matches
  // brings every cabinet under it, and so does a buyer's name.
  const needle = query.trim().toLowerCase()
  const visible = AD_ACCOUNTS.filter(
    (c) =>
      (platform === ALL_PLATFORMS || c.platform === platform) &&
      (!needle ||
        c.name.toLowerCase().includes(needle) ||
        (LOGIN_NAME.get(c.login) ?? "").includes(needle) ||
        (buyerOf(c)?.name.toLowerCase().includes(needle) ?? false))
  )
  const rows = AD_LOGINS.flatMap((login) => {
    const cabinets = visible.filter((c) => c.login === login.id)
    return cabinets.length ? [{ login, cabinets }] : []
  })

  const open = visible.filter(canPick)
  const allOn = open.length > 0 && open.every((c) => picked.has(c.id))

  function pick(ids: string[], on: boolean) {
    const next = new Set(picked)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    onChange([...next])
  }

  // everything on one platform leaves the rail nothing to choose between
  const rail = LIVE_PLATFORMS.length > 1 && (
    <>
      <RailItem
        label="Усі"
        picked={value.length}
        active={platform === ALL_PLATFORMS}
        onClick={() => setPlatform(ALL_PLATFORMS)}
        strip={compact}
      />
      {LIVE_PLATFORMS.map((p) => (
        <RailItem
          key={p.id}
          label={p.label}
          icon={<PlatformBadge id={p.id} size={14} />}
          picked={
            AD_ACCOUNTS.filter((c) => c.platform === p.id && picked.has(c.id))
              .length
          }
          active={platform === p.id}
          onClick={() => setPlatform(p.id)}
          strip={compact}
        />
      ))}
    </>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b",
          compact ? "p-2.5" : "p-2"
        )}
      >
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Акаунт, кабінет або баєр"
            className="h-9 pl-8"
            // a phone would throw its keyboard up over the list
            autoFocus={!compact}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          disabled={open.length === 0}
          onClick={() =>
            pick(
              open.map((c) => c.id),
              !allOn
            )
          }
        >
          {allOn ? "Зняти всі" : "Обрати всі"}
          <span className="text-muted-foreground tabular-nums">
            {open.length}
          </span>
        </Button>
      </div>

      {compact && rail && (
        <div className="flex shrink-0 [scrollbar-width:none] gap-1 overflow-x-auto border-b px-2.5 py-1.5 [&::-webkit-scrollbar]:hidden">
          {rail}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {!compact && rail && (
          <div className="flex w-40 shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-muted/25 p-1.5">
            {rail}
          </div>
        )}
        <div className="min-h-0 min-w-0 flex-1 divide-y overflow-y-auto overscroll-contain">
          {rows.map(({ login, cabinets }) => (
            <LoginRow
              key={login.id}
              login={login}
              cabinets={cabinets}
              buyer={runners.get(login.id) ?? null}
              picked={picked}
              canPick={canPick}
              onPick={pick}
            />
          ))}
          {rows.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              Нічого не знайдено
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The Реклама filter: платформа › акаунт › кабінет.
 *
 * The same for everyone who opens it - an owner, a lead and a buyer all get
 * this one picker, over whatever accounts they can see. People appear only as
 * the buyer beside an account, never as a list to pick from: a buyer does not
 * see the team, and sees nobody's name but their own on their own accounts.
 *
 * It used to be the whole tree drawn out at once, which stops reading at a few
 * dozen cabinets - the same RK1 under five accounts. Now the platform is picked
 * on the rail, its accounts are listed with their cabinets as chips under
 * them, and the search reaches all of it. What it hands back is still just the
 * cabinets - an account or a platform is a quick way to tick a lot of them.
 *
 * A popover on a wide screen; on a phone, a sheet of its own over the filter
 * sheet it is opened from.
 */
export function AdsPicker({
  label,
  value,
  onChange,
  reachable,
  onApply,
  variant = "secondary",
  className,
}: {
  label: string
  /** picked cabinet ids - empty is "усі" */
  value: string[]
  onChange: (next: string[]) => void
  /** the cabinets the page's other filters leave in reach - the rest grey out */
  reachable?: string[]
  /**
   * Where the ticks are a draft the page applies, the picker's own button
   * applies them too - otherwise the button only closes it.
   */
  onApply?: () => void
  /** the trigger's skin - a toolbar draws it as one of its own buttons */
  variant?: "secondary" | "outline"
  /** the trigger's shape, for a row that is not a full-width panel */
  className?: string
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  function finish() {
    onApply?.()
    setOpen(false)
  }

  const trigger = (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        "h-9 w-full justify-between gap-1.5 font-normal",
        className
      )}
      onClick={isMobile ? () => setOpen(true) : undefined}
    >
      <span className="truncate">
        {label}: <span className="font-medium">{adsSummary(value)}</span>
      </span>
      <IconChevronDown className="size-4 text-muted-foreground" />
    </Button>
  )
  const browser = (
    <AdsBrowser
      value={value}
      onChange={onChange}
      reachable={reachable}
      compact={isMobile}
    />
  )
  const done = onApply ? "Застосувати" : "Готово"

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            // a fixed height, so a search that finds two cabinets does not
            // drop the sheet out from under the thumb
            className="gap-0 rounded-t-2xl p-0 data-[side=bottom]:h-[85svh]"
          >
            <div className="shrink-0 border-b">
              <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" />
              <div className="flex items-center gap-2 px-4 py-2.5">
                <SheetTitle className="text-[15px] font-semibold">
                  {label}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Платформи, акаунти й кабінети
                </SheetDescription>
                {value.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-muted-foreground"
                    onClick={() => onChange([])}
                  >
                    <IconRestore className="size-4" />
                    Скинути
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={value.length > 0 ? undefined : "ml-auto"}
                  onClick={() => setOpen(false)}
                  aria-label="Закрити"
                >
                  <IconX />
                </Button>
              </div>
            </div>
            {browser}
            <div className="shrink-0 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button className="h-11 w-full text-sm" onClick={finish}>
                {done}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      {/* A fixed height, for the same reason as the sheet: the list under the
          search grows and shrinks, the panel holding it does not. */}
      <PopoverContent
        align="start"
        className="flex h-[min(30rem,70vh)] w-[580px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0"
      >
        {browser}
        <div className="flex shrink-0 items-center gap-2 border-t p-2">
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onChange([])}
            >
              <IconX />
              Скинути
            </Button>
          )}
          <Button size="sm" className="ml-auto" onClick={finish}>
            {done}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
