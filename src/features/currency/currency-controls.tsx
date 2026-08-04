import { useCurrency } from "@/components/currency-provider"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BASE_CURRENCY_CODE,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  currencyCode,
  formatRate,
  nbuRate,
} from "@/features/currency/types"
import { cn } from "@/lib/utils"

// The two buttons say what the rate is, so the row needs no caption above them.
const RATE_SOURCES = [
  { value: true, label: "Курс НБУ" },
  { value: false, label: "Власний" },
]

// Everything about the display currency on one settings row: which currency,
// where its rate comes from, and the rate itself.
// The rate half is always on screen - it only greys out - so switching currency
// never reflows the row.
export function CurrencyControls() {
  const { settings, setSetting } = useCurrency()

  const code = currencyCode(settings)
  // the base currency has nothing to convert into, so its rate is frozen at 1
  const isBase = code === BASE_CURRENCY_CODE
  const quoted = nbuRate(code)
  const rateLocked = isBase || settings.useNbuRate

  // Switching to a manual rate hands over the one the analytics was already
  // using, so the field starts from a real number instead of empty.
  function setRateSource(useNbu: boolean) {
    if (!useNbu && settings.rate.trim() === "" && quoted !== null) {
      setSetting("rate", formatRate(quoted))
    }
    setSetting("useNbuRate", useNbu)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <Select
        value={code}
        onValueChange={(v) => setSetting("code", v as string)}
      >
        <SelectTrigger className="w-[112px]">
          <SelectValue>
            {(v: string) => `${v} ${CURRENCY_SYMBOLS[v] ?? ""}`}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_OPTIONS.map((c) => (
            <SelectItem key={c} value={c}>
              {c} {CURRENCY_SYMBOLS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* where the rate comes from - same segmented look as the theme switch
          a couple of rows up */}
      <div
        className={cn(
          "flex h-9 gap-1 rounded-lg border bg-muted p-1 transition-opacity",
          isBase && "opacity-50"
        )}
      >
        {RATE_SOURCES.map(({ value, label }) => {
          const isActive = settings.useNbuRate === value
          return (
            <button
              key={label}
              type="button"
              disabled={isBase}
              onClick={() => setRateSource(value)}
              className={cn(
                "flex items-center rounded-md px-2.5 text-sm transition-colors disabled:pointer-events-none",
                isActive
                  ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-ring/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* spelled out as an equation - "1 $ = 41,5 ₴" leaves nothing to guess */}
      <div
        className={cn(
          "flex h-9 w-[168px] items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow,opacity] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30",
          rateLocked && "opacity-60"
        )}
      >
        <span className="flex shrink-0 items-center bg-muted pr-1.5 pl-2.5 text-sm text-muted-foreground">
          1 {CURRENCY_SYMBOLS[code] ?? code} =
        </span>
        <Input
          disabled={rateLocked}
          value={
            isBase
              ? "1"
              : settings.useNbuRate && quoted !== null
                ? formatRate(quoted)
                : settings.rate
          }
          onChange={(e) =>
            setSetting("rate", e.target.value.replace(/[^\d.,]/g, ""))
          }
          placeholder="Курс"
          inputMode="decimal"
          aria-label={`Курс: скільки гривень коштує 1 ${code}`}
          className="h-full min-w-0 flex-1 rounded-none border-0 px-1.5 text-center shadow-none focus-visible:ring-0 disabled:opacity-100"
        />
        <span className="flex shrink-0 items-center bg-muted pr-2.5 pl-1.5 text-sm text-muted-foreground">
          ₴
        </span>
      </div>
    </div>
  )
}
