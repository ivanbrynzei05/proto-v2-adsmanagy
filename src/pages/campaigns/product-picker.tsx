import {
  IconBulb,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconMail,
  IconPackage,
  IconPlus,
  IconSearch,
  IconSpeakerphone,
  IconTag,
  IconTagOff,
  IconX,
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CrmLogo } from "@/features/integrations/logos"
import { type CrmType } from "@/features/integrations/types"
import { cn } from "@/lib/utils"
import { PRODUCTS, searchProducts, type ProductPage } from "./data"

// The campaign the dialog is editing, plus the product currently tied to it.
export type ProductTarget = {
  /** key the manual link is stored under (entity + row name) */
  key: string
  /** campaign name - the dialog subtitle */
  name: string
  /** product in effect right now; null when the campaign has none */
  productId: string | null
  /** work address of whoever runs the campaign; null when the team is empty */
  authorEmail: string | null
}

// Catalogue name for an id, or a stand-in for an id attached by hand that the
// catalogue doesn't carry yet.
function productName(id: string) {
  return PRODUCTS[id] ?? "Товар " + id
}

// The catalogue is the connected CRM's, so its rows carry its mark - the one
// shown in Інтеграції, at the size of the line it sits on.
const CATALOGUE_CRM: CrmType = "LP CRM"

function CrmSource() {
  return (
    <span className="flex h-4 min-w-0 items-center gap-1 text-[11px] leading-4 text-muted-foreground">
      <CrmLogo type={CATALOGUE_CRM} className="size-3.5" />
      <span className="truncate">{CATALOGUE_CRM}</span>
    </span>
  )
}

// A named block of the dialog - what the campaign has now, and what it can be
// moved to. Same title + hint header the filters sheet uses, so a labelled
// section reads the same across the page.
function Section({
  title,
  hint,
  className,
  children,
}: {
  title: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {hint && (
          <span className="text-[11px] text-muted-foreground/80">{hint}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// The identity of a product wherever it is shown: an icon disc, the name with
// the system it came from underneath, and the id as a chip on the right. The id
// is what a campaign is actually linked by, so it gets the same #id chip the
// table carries instead of hiding inside the grey line - and the chips line up
// in one column, which is how the list is scanned. Selecting turns the disc into
// a check, so the picked state never crowds the chip.
function ProductFace({
  id,
  name,
  picked,
  isNew = false,
}: {
  id: string
  name: string
  picked: boolean
  /** an id typed into the search box that the catalogue doesn't know */
  isNew?: boolean
}) {
  // only what the catalogue answered with can claim to come from the CRM - an id
  // attached by hand is exactly the case where it hasn't reached it yet
  const fromCatalogue = PRODUCTS[id] !== undefined
  return (
    <>
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md",
          picked
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {picked ? (
          <IconCheck className="size-4" />
        ) : isNew ? (
          <IconPlus className="size-4" />
        ) : (
          <IconPackage className="size-4" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        {/* the line box is pinned rather than inherited: the pending rows copy
            these two exactly, and a row that changes height when the answer
            arrives makes the whole list jump */}
        {fromCatalogue && <CrmSource />}
      </span>
      <Badge
        variant="secondary"
        className={cn(
          "shrink-0 gap-1 font-mono text-[11px] font-semibold tracking-tight tabular-nums",
          picked && "bg-primary/15 text-primary",
          isNew && "border border-dashed border-border bg-transparent"
        )}
      >
        <IconTag className="size-3" />
        {id}
      </Badge>
    </>
  )
}

// The product the campaign is on right now, pinned above the catalogue: it is
// the answer to "what is attached?", so it never has to be hunted for in the
// list. Detaching belongs here too - it acts on this product and nothing else.
// Pressing it takes the whole block off the screen: the campaign is left with
// no product, which is exactly what "no block" looks like everywhere else in
// the dialog. Nothing is written until the footer button is pressed, and
// Скасувати brings the product back.
function CurrentProduct({
  id,
  picked,
  onPick,
  onDetach,
}: {
  id: string
  /** the card is the pending choice - i.e. nothing else is selected */
  picked: boolean
  onPick: () => void
  onDetach: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border p-1 transition-colors",
        picked ? "border-primary/35 bg-primary/8" : "border-border bg-muted/30"
      )}
    >
      <button
        type="button"
        onClick={onPick}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1 text-left"
      >
        <ProductFace id={id} name={productName(id)} picked={picked} />
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onDetach}
      >
        <IconTagOff />
        Відкріпити
      </Button>
    </div>
  )
}

// One line of the catalogue. The typed-in id reuses the same shape with a plus
// in the disc and a dashed frame, so it sits in the list without breaking it.
function ProductRow({
  id,
  name,
  picked,
  isNew = false,
  onPick,
  onCommit,
}: {
  id: string
  name: string
  picked: boolean
  isNew?: boolean
  onPick: () => void
  onCommit: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      onDoubleClick={onCommit}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
        picked
          ? "border-primary/35 bg-primary/8"
          : cn(
              "hover:bg-muted/60",
              isNew ? "border-dashed border-border" : "border-transparent"
            )
      )}
    >
      <ProductFace id={id} name={name} picked={picked} isNew={isNew} />
    </button>
  )
}

// Five products a page - the whole page is taken in at a glance, and the dialog
// keeps a fixed height instead of growing with the catalogue. The pager is
// hidden entirely while everything fits on one page.
const PER_PAGE = 5

// How long typing has to settle before the search is sent.
const DEBOUNCE_MS = 260

// A page of rows in outline while the request is out. Padding, disc and the two
// line boxes are the ones a real row has - h-5 for the name (text-sm) and h-4
// for the note - so the list keeps its exact height when the answer lands and
// nothing below it moves. The widths vary per line so it reads as text rather
// than as a bar chart.
const SKELETON_WIDTHS = ["w-2/5", "w-3/5", "w-1/2", "w-2/3", "w-1/3"]

function PendingRows() {
  return (
    <>
      {SKELETON_WIDTHS.map((w, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2"
        >
          <Skeleton className="size-7 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex h-5 items-center">
              <Skeleton className={cn("h-3.5", w)} />
            </span>
            <span className="flex h-4 items-center">
              <Skeleton className="h-2.5 w-16" />
            </span>
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </>
  )
}

// The pager keeps its row whether or not there is anything to page: the first
// answer is what reveals how many pages exist, and a control appearing after it
// lands would resize a popup that is centred on the screen - i.e. shift
// everything above it too. The row is always there; only its contents arrive.
function Pager({
  page,
  pageCount,
  busy,
  onChange,
}: {
  /** zero-based */
  page: number
  pageCount: number
  /** a page is on its way - paging again would only queue up more requests */
  busy: boolean
  onChange: (page: number) => void
}) {
  if (pageCount < 2) return <div className="h-8" />
  return (
    <div className="flex h-8 items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Попередня сторінка"
        disabled={busy || page === 0}
        onClick={() => onChange(page - 1)}
      >
        <IconChevronLeft />
      </Button>
      <span className="px-1 text-[11px] font-medium text-muted-foreground tabular-nums">
        {page + 1} / {pageCount}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Наступна сторінка"
        disabled={busy || page === pageCount - 1}
        onClick={() => onChange(page + 1)}
      >
        <IconChevronRight />
      </Button>
    </div>
  )
}

// The way out of ever opening this dialog again: name the campaign so the id is
// picked up on its own. Sits right under the header, where the campaign name it
// talks about is still in view - by the bottom of the dialog the reader is
// already picking and won't stop to read it.
function NamingTip() {
  return (
    <Alert
      variant="info"
      // the page's info alert, tinted: among the greys of the card below it, a
      // flat grey block was one more thing to skip past
      className="border-primary/20 bg-primary/5 px-3 py-2.5 [&>svg]:text-primary"
    >
      <IconBulb />
      <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
        {/* the example and its brackets travel as one word, so a line never
            breaks between "напр." and the chip or strands the ")," alone */}
        <p className="text-pretty">
          Якщо поставити ID товару на початок назви кампанії{" "}
          <span className="whitespace-nowrap">
            (напр.{" "}
            <code className="rounded bg-primary/10 px-1 font-mono text-[11px] font-semibold text-primary">
              1042 - …
            </code>
            ),
          </span>{" "}
          система прив'яже кампанію до товару автоматично.
        </p>
      </AlertDescription>
    </Alert>
  )
}

// Lives inside the popup, which unmounts on close - so every open starts from a
// clean search box with the campaign's own product preselected.
function ProductPickerForm({
  target,
  onCancel,
  onSave,
}: {
  target: ProductTarget
  onCancel: () => void
  onSave: (productId: string | null) => void
}) {
  const [query, setQuery] = useState("")
  const [picked, setPicked] = useState<string | null>(target.productId)
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<ProductPage>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)

  const current = target.productId

  // "no product" chosen against a campaign that has one. Its card is gone from
  // the top, so the product is no longer pinned anywhere - and that is what
  // puts it back among the search results, where picking it again undoes the
  // detach without anything having to be spelled out.
  const detaching = current !== null && picked === null
  const excluded = detaching ? null : current

  // Anything that changes what the CRM should be asked goes through here, so
  // the list is marked pending the moment the intent is expressed rather than
  // when the request finally leaves - typing feels answered even while the
  // debounce is still counting down.
  function ask(nextQuery: string, nextPage: number) {
    setQuery(nextQuery)
    setPage(nextPage)
    setLoading(true)
  }

  // Every keystroke and every page is a request to the CRM. Typing is held back
  // by DEBOUNCE_MS so a word costs one round trip instead of one per letter,
  // and each answer carries the number of the request that asked for it: a slow
  // reply that lands after a newer one has already been sent is dropped, which
  // is the difference between the list settling on what was typed last and
  // flickering back to a stale page.
  const reqRef = useRef(0)
  const sentRef = useRef("")
  useEffect(() => {
    const req = ++reqRef.current
    // only typing has to settle; paging - and the first load - asks at once
    const delay = query === sentRef.current ? 0 : DEBOUNCE_MS
    sentRef.current = query
    const timer = window.setTimeout(() => {
      searchProducts({
        query,
        page,
        perPage: PER_PAGE,
        exclude: excluded,
      }).then((res) => {
        if (reqRef.current !== req) return
        // the page fell off the end of a shrunken catalogue - ask again for the
        // last one that exists instead of showing an empty stretch
        const last = Math.max(0, Math.ceil(res.total / PER_PAGE) - 1)
        if (page > last) {
          setPage(last)
          return
        }
        setResult(res)
        setLoading(false)
      })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [query, page, excluded])

  // A typed id the CRM doesn't know: the product may exist there long before it
  // reaches this catalogue, so the id can be attached as it is. Offered only
  // once the search has come back without an exact hit - while a request is in
  // flight there is nothing to conclude yet.
  const typedId = query.trim().replace(/^#/, "")
  const newId =
    !loading &&
    /^\d{3,6}$/.test(typedId) &&
    typedId !== current &&
    !result.items.some((p) => p.id === typedId)
      ? typedId
      : null

  // The server pages, so the count comes with the answer rather than from a
  // list held here.
  const pageCount = Math.max(1, Math.ceil(result.total / PER_PAGE))

  return (
    <>
      {/* The campaign is the subject of everything below, so it is the loudest
          line here: the task itself is a short label above it, and the name
          gets the megaphone the campaign rows carry plus full-strength text. */}
      <DialogHeader className="gap-2 pr-8">
        <DialogTitle className="text-base">
          {current ? "Товар кампанії" : "Прикріпити товар"}
        </DialogTitle>
        <DialogDescription className="flex items-start gap-2 text-foreground">
          <IconSpeakerphone className="mt-px size-4 shrink-0 text-muted-foreground" />
          <span className="line-clamp-2 font-medium break-words">
            {target.name}
          </span>
        </DialogDescription>
        {/* the person to ask about this campaign, one step quieter than the
            name - the address is what makes them reachable from here */}
        {target.authorEmail && (
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <IconMail className="size-4 shrink-0" />
            <span className="truncate">{target.authorEmail}</span>
          </p>
        )}
      </DialogHeader>

      <NamingTip />

      {/* gone the moment it is detached - the block is the product, so with no
          product there is nothing to show */}
      {current && !detaching && (
        <Section title="Поточний товар">
          <CurrentProduct
            id={current}
            picked={picked === current}
            onPick={() => setPicked(current)}
            onDetach={() => setPicked(null)}
          />
        </Section>
      )}

      {/* extra air under the current product: the two blocks are different
          kinds of thing - one state, one choice - so the seam between them is
          wider than the spacing inside either */}
      <Section
        title={current && !detaching ? "Обрати інший товар" : "Обрати товар"}
        className={cn("min-h-0 flex-1", current && !detaching && "mt-3")}
      >
        <div className="relative">
          {/* the magnifier spins while the CRM is being asked, so the wait is
              visible in the field itself and not only in the list */}
          {loading ? (
            <IconLoader2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            autoFocus
            className="pr-8 pl-8.5"
            placeholder="Пошук товару за назвою або ID"
            value={query}
            onChange={(e) => ask(e.target.value, 0)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Очистити пошук"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
              // keeps the caret in the field, so the next query can be typed
              // straight after clearing
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => ask("", 0)}
            >
              <IconX />
            </Button>
          )}
        </div>

        {/* the floor holds the height steady on a last page of two or three, so
            paging doesn't make the popup jump; the cap lets the list shrink
            first on a short window, keeping the tip and the buttons in view */}
        <div className="-mx-1 flex max-h-[46vh] min-h-64 flex-1 flex-col gap-1 overflow-y-auto px-1">
          {loading ? (
            <PendingRows />
          ) : (
            <>
              {newId && (
                <ProductRow
                  id={newId}
                  name={"Прикріпити ID " + newId}
                  picked={picked === newId}
                  isNew
                  onPick={() => setPicked(newId)}
                  onCommit={() => onSave(newId)}
                />
              )}
              {result.items.map((p) => (
                <ProductRow
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  picked={p.id === picked}
                  onPick={() => setPicked(p.id)}
                  onCommit={() => onSave(p.id)}
                />
              ))}
              {result.total === 0 && !newId && (
                <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
                  {/* the campaign's own product is filtered out of the results,
                      so searching for it would otherwise read as "not found" */}
                  {typedId && typedId === current ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Цей товар уже прикріплений
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        Він показаний вище як поточний
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Товарів не знайдено
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        Введіть ID, щоб прикріпити його вручну
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <Pager
          page={page}
          pageCount={pageCount}
          busy={loading}
          onChange={(next) => ask(query, next)}
        />
      </Section>

      {/* same pair every dialog in the app closes with: a secondary way out and
          the committing button in black */}
      <DialogFooter className="mt-1">
        <Button variant="secondary" onClick={onCancel}>
          Скасувати
        </Button>
        {/* one label for all three outcomes - attach, replace, detach: what is
            being saved is already shown above, and a button that renames itself
            as you click around reads as three different buttons */}
        <Button
          disabled={picked === current}
          className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          onClick={() => onSave(picked)}
        >
          Зберегти
        </Button>
      </DialogFooter>
    </>
  )
}

// Search the catalogue and attach a product to a campaign - or change / detach
// the one it already has.
export function ProductPickerDialog({
  open,
  target,
  onOpenChange,
  onSave,
}: {
  open: boolean
  /** the campaign being edited - kept around while the dialog animates out */
  target: ProductTarget | null
  onOpenChange: (open: boolean) => void
  /** productId=null detaches the product from the campaign */
  onSave: (key: string, productId: string | null) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-5">
        {target && (
          <ProductPickerForm
            target={target}
            onCancel={() => onOpenChange(false)}
            onSave={(productId) => {
              onSave(target.key, productId)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
