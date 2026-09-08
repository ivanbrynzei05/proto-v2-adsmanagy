import { IconArrowLeft, IconLoader2, IconMail } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AuthHero, AuthLayout } from "@/pages/auth/auth-layout"
import { cn } from "@/lib/utils"

/** how many characters the letter carries */
const LENGTH = 6

/** how long the letter takes to arrive before it can be asked for again */
const RESEND_SECONDS = 45

/** the one password the demo refuses, so the error state can be seen */
const WRONG = "000000"

const EMPTY = Array.from({ length: LENGTH }, () => "")

/**
 * The password that came in the letter.
 *
 * Sign-in is passwordless up to this point: the address gets a one-time
 * password and this screen is where it is spent. It is a character per box
 * rather than one field, because the password is copied over from a letter a
 * character at a time and the boxes say how many are left without a word of
 * instruction.
 *
 * The frame, the hero and the field styling are the live login screen's - see
 * AuthLayout - so this sits inside that flow instead of looking like a page
 * from somewhere else.
 *
 * There is no auth back end in the prototype: any full password is taken as
 * the one that was sent, apart from six zeroes, which is refused so the error
 * state is reachable.
 */
export function PasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const email = searchParams.get("email") ?? "noutnoti@gmail.com"

  const [code, setCode] = useState<string[]>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [left, setLeft] = useState(RESEND_SECONDS)
  const [resent, setResent] = useState(false)
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  const joined = code.join("")
  const full = joined.length === LENGTH

  // one interval for the whole countdown; it stops itself at zero so a screen
  // left open overnight is not ticking behind the tab
  useEffect(() => {
    if (left <= 0) return
    const id = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(id)
  }, [left])

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (checking || !full) return
    setChecking(true)
    setError(null)
    // stands in for the round trip to the auth service
    setTimeout(() => {
      if (joined !== WRONG) {
        navigate("/")
        return
      }
      setChecking(false)
      setError("Невірний пароль. Перевірте лист або надішліть новий")
      setCode(EMPTY)
      boxes.current[0]?.focus()
    }, 900)
  }

  const resend = () => {
    setLeft(RESEND_SECONDS)
    setResent(true)
    setCode(EMPTY)
    setError(null)
    boxes.current[0]?.focus()
  }

  return (
    <AuthLayout>
      <AuthHero icon={IconMail} title="Пароль з листа" />

      <form className="space-y-3.5" onSubmit={submit}>
        <div className="space-y-2">
          <p className="text-center text-[13.5px] text-slate-500 dark:text-slate-400">
            Надіслали на{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {email}
            </span>
          </p>
          <CodeBoxes
            code={code}
            invalid={Boolean(error)}
            boxes={boxes}
            onChange={(next) => {
              setCode(next)
              setError(null)
            }}
            onComplete={() => boxes.current[LENGTH - 1]?.blur()}
          />
          {error && (
            <p className="text-center text-xs font-medium text-rose-500">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!full || checking}
          className="h-[46px] w-full rounded-xl text-sm font-semibold shadow-none transition-transform active:scale-[0.98]"
        >
          {checking && <IconLoader2 className="size-4 animate-spin" />}
          {checking ? "Входимо..." : "Увійти"}
        </Button>
      </form>

      {/* one blue accent per screen - the submit button - so the resend stays a
          sentence and the way back is quieter still, under a rule */}
      <p className="mt-4 text-center text-[13.5px] text-slate-500 dark:text-slate-400">
        {resent ? "Лист надіслано." : "Не отримали лист?"}{" "}
        {left > 0 ? (
          <span className="text-slate-400 tabular-nums dark:text-slate-500">
            Повторно через {left} с
          </span>
        ) : (
          <button
            type="button"
            className="font-semibold text-blue-600 hover:underline"
            onClick={resend}
          >
            Надіслати ще раз
          </button>
        )}
      </p>

      <div className="mt-[18px] border-t border-slate-200 pt-4 text-center dark:border-slate-800">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          onClick={() => navigate("/")}
        >
          <IconArrowLeft className="size-4" />
          Назад до входу
        </button>
      </div>
    </AuthLayout>
  )
}

/**
 * One box per character.
 *
 * Every box is its own input so the caret, the mobile keyboard and the browser
 * autofill all behave; the boxes move the focus between themselves as the
 * password goes in, and a pasted password is spread across them from whichever
 * box took it. The box itself wears the login form's field styling - the same
 * filled slate field that goes white and rings blue on focus.
 */
function CodeBoxes({
  code,
  invalid,
  boxes,
  onChange,
  onComplete,
}: {
  code: string[]
  invalid: boolean
  boxes: React.RefObject<(HTMLInputElement | null)[]>
  onChange: (next: string[]) => void
  onComplete: () => void
}) {
  const focus = (i: number) =>
    boxes.current[Math.min(Math.max(i, 0), LENGTH - 1)]?.focus()

  const put = (i: number, raw: string) => {
    let typed = raw.replace(/[^0-9a-zA-Z]/g, "").toUpperCase()
    // a character typed beside one already in the box replaces it, rather than
    // pushing the box's own character on into the next one
    if (typed.length > 1 && typed[0] === code[i]) typed = typed.slice(1)
    const next = [...code]
    if (!typed) {
      next[i] = ""
      onChange(next)
      return
    }
    // a paste lands in the box it was dropped on and fills the ones after it
    for (let k = 0; k < typed.length && i + k < LENGTH; k++) {
      next[i + k] = typed[k]
    }
    onChange(next)
    focus(Math.min(i + typed.length, LENGTH - 1))
    if (next.every(Boolean)) onComplete()
  }

  const key = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i]) {
      // the box is already empty, so backspace clears the one before it
      e.preventDefault()
      const next = [...code]
      next[i - 1] = ""
      onChange(next)
      focus(i - 1)
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      focus(i - 1)
    }
    if (e.key === "ArrowRight") {
      e.preventDefault()
      focus(i + 1)
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Пароль з листа">
      {code.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el
          }}
          value={char}
          onChange={(e) => put(i, e.target.value)}
          onKeyDown={(e) => key(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="text"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          aria-label={`Символ ${i + 1}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-12 w-full min-w-0 rounded-xl border-0 bg-slate-100 text-center text-lg font-bold uppercase shadow-none transition-[background-color,box-shadow] outline-none",
            "hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600",
            "dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:bg-slate-900 dark:focus:ring-blue-500",
            invalid && "text-rose-500 ring-2 ring-rose-400 dark:ring-rose-500"
          )}
        />
      ))}
    </div>
  )
}
