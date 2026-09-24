import {
  IconLoader2,
  IconPackageOff,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PRODUCT_LIST } from "@/pages/campaigns/data"
import {
  Pager,
  PendingRows,
  ProductFace,
} from "@/pages/campaigns/product-picker"

type CatalogueItem = { id: string; name: string }

// The CRM catalogue holds more than what is sold: packaging, insurance and
// "upgraded" versions added to pull the price down sit next to the real
// products. Those are what order-based detection mistakes for a campaign's
// product - and what this list lets the owner rule out.
const SERVICE_ITEMS: CatalogueItem[] = [
  { id: "9901", name: "Пакування - коробка з логотипом" },
  { id: "9902", name: "Пакування - пузирчаста плівка" },
  { id: "9910", name: "Подарунковий пакет" },
  { id: "9920", name: "Страхування посилки" },
  { id: "1043", name: "Neck Relax Pro (покращена версія)" },
  { id: "2088", name: "CleanMax X9 Plus (покращена версія)" },
]

const CATALOGUE = [...PRODUCT_LIST, ...SERVICE_ITEMS]

// Same round trip the campaign picker makes - the catalogue lives in the CRM,
// so every query is a request - minus what is already excluded.
function searchCatalogue(
  query: string,
  page: number,
  exclude: Set<string>
): Promise<{ items: CatalogueItem[]; total: number }> {
  const q = query.trim().replace(/^#/, "").toLowerCase()
  const hits = CATALOGUE.filter(
    (p) =>
      !exclude.has(p.id) &&
      (!q || p.id.includes(q) || p.name.toLowerCase().includes(q))
  )
  const from = page * PER_PAGE
  const result = {
    items: hits.slice(from, from + PER_PAGE),
    total: hits.length,
  }
  const latency = 180 + Math.random() * 280
  return new Promise((resolve) =>
    window.setTimeout(() => resolve(result), latency)
  )
}

const PER_PAGE = 5
const DEBOUNCE_MS = 260
const STORAGE_KEY = "product-exclusions"

// the demo opens with the two cases the feature exists for already listed
const DEFAULT_EXCLUSIONS: CatalogueItem[] = [SERVICE_ITEMS[0], SERVICE_ITEMS[4]]

function readStored(): CatalogueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CatalogueItem[]) : DEFAULT_EXCLUSIONS
  } catch {
    return DEFAULT_EXCLUSIONS
  }
}

// Lives inside the popup, so every open starts from an empty search and no
// ticks. Several positions can be picked in one go - packaging usually comes in
// a handful of variants.
function AddExclusionsForm({
  excluded,
  onCancel,
  onAdd,
}: {
  excluded: Set<string>
  onCancel: () => void
  onAdd: (items: CatalogueItem[]) => void
}) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<{
    items: CatalogueItem[]
    total: number
  }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState<Map<string, CatalogueItem>>(
    () => new Map()
  )

  function ask(nextQuery: string, nextPage: number) {
    setQuery(nextQuery)
    setPage(nextPage)
    setLoading(true)
  }

  // debounced typing, immediate paging, stale answers dropped - see the
  // campaign product picker for the reasoning
  const reqRef = useRef(0)
  const sentRef = useRef("")
  useEffect(() => {
    const req = ++reqRef.current
    const delay = query === sentRef.current ? 0 : DEBOUNCE_MS
    sentRef.current = query
    const timer = window.setTimeout(() => {
      searchCatalogue(query, page, excluded).then((res) => {
        if (reqRef.current !== req) return
        setResult(res)
        setLoading(false)
      })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [query, page, excluded])

  function toggle(item: CatalogueItem) {
    setPicked((m) => {
      const next = new Map(m)
      if (next.has(item.id)) next.delete(item.id)
      else next.set(item.id, item)
      return next
    })
  }

  const pageCount = Math.max(1, Math.ceil(result.total / PER_PAGE))

  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle className="text-base">Виключити товари</DialogTitle>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="relative">
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => ask("", 0)}
            >
              <IconX />
            </Button>
          )}
        </div>

        <div className="-mx-1 flex max-h-[46vh] min-h-64 flex-1 flex-col gap-1 overflow-y-auto px-1">
          {loading ? (
            <PendingRows />
          ) : result.total === 0 ? (
            <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
              Товарів не знайдено
            </div>
          ) : (
            result.items.map((item) => {
              const isPicked = picked.has(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                    isPicked
                      ? "border-primary/35 bg-primary/8"
                      : "border-transparent hover:bg-muted/60"
                  )}
                >
                  <ProductFace
                    id={item.id}
                    name={item.name}
                    picked={isPicked}
                    fromCrm
                  />
                </button>
              )
            })
          )}
        </div>

        <Pager
          page={page}
          pageCount={pageCount}
          busy={loading}
          onChange={(next) => ask(query, next)}
        />
      </div>

      <DialogFooter className="mt-1">
        <Button variant="secondary" onClick={onCancel}>
          Скасувати
        </Button>
        <Button
          disabled={picked.size === 0}
          className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          onClick={() => onAdd(Array.from(picked.values()))}
        >
          {picked.size > 0 ? `Виключити (${picked.size})` : "Виключити"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function ProductExclusionsCard() {
  const [items, setItems] = useState<CatalogueItem[]>(readStored)
  const [adding, setAdding] = useState(false)
  // a fresh Set only when the list changes, so the search effect doesn't
  // re-fire on every render
  const [excludedIds, setExcludedIds] = useState(
    () => new Set(items.map((i) => i.id))
  )

  function commit(next: CatalogueItem[]) {
    setItems(next)
    setExcludedIds(new Set(next.map((i) => i.id)))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const addButton = (
    <Button
      variant="secondary"
      className="gap-1.5"
      onClick={() => setAdding(true)}
    >
      <IconPlus className="size-4" />
      Додати
    </Button>
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          Виключення товарів
        </CardTitle>
        {items.length > 0 && <CardAction>{addButton}</CardAction>}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <IconPackageOff className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">Виключень немає</p>
            {addButton}
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
              >
                <ProductFace
                  id={item.id}
                  name={item.name}
                  picked={false}
                  fromCrm
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={"Прибрати з виключень: " + item.name}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => commit(items.filter((i) => i.id !== item.id))}
                >
                  <IconX />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-lg gap-5">
          <AddExclusionsForm
            excluded={excludedIds}
            onCancel={() => setAdding(false)}
            onAdd={(added) => {
              commit([...items, ...added])
              setAdding(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
