import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconChartPie,
  IconCircleCheck,
  IconClockX,
  IconLinkOff,
  IconLoader2,
  IconMoon,
  IconRefresh,
  IconShieldLock,
  IconSun,
  IconUsersGroup,
} from "@tabler/icons-react"
import { useEffect, useRef, useState, type ComponentType } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FacebookLogo,
  GoogleLogo,
  TiktokLogo,
} from "@/features/integrations/logos"
import { cn } from "@/lib/utils"
import { CONNECT_ADS_DEMO_STATES } from "./demo-states"

// ---------------------------------------------------------------------------
// Types mirroring the public invite API (GET /integrations/ads/invites/public/{token})
// ---------------------------------------------------------------------------

type InviteProvider = "facebook" | "tiktok" | "google_ads"

type AdInvitePublic = {
  provider: InviteProvider
  provider_label: string
  inviter_name: string | null
  status: "active" | "expired"
  plan_has_room: boolean
}

const PROVIDER_META: Record<
  InviteProvider,
  { label: string; logo: ComponentType<{ className?: string }> }
> = {
  facebook: { label: "Facebook", logo: FacebookLogo },
  tiktok: { label: "TikTok", logo: TiktokLogo },
  google_ads: { label: "Google Ads", logo: GoogleLogo },
}

// ---------------------------------------------------------------------------
// Mock backend. There is no real API client in this prototype, so the public
// invite endpoint is faked from the token: keywords in the token drive which
// state we land in. The shapes match the spec 1:1.
// ---------------------------------------------------------------------------

class InviteNotFoundError extends Error {}

function mockProvider(token: string): InviteProvider {
  if (token.includes("tiktok")) return "tiktok"
  if (token.includes("google")) return "google_ads"
  return "facebook"
}

// GET /integrations/ads/invites/public/{token}
function fetchPublicInvite(token: string): Promise<AdInvitePublic> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (token.includes("invalid") || token.includes("404")) {
        reject(new InviteNotFoundError("NOT_FOUND"))
        return
      }
      const provider = mockProvider(token)
      resolve({
        provider,
        provider_label: PROVIDER_META[provider].label,
        inviter_name: "Acme Agency",
        status: token.includes("expired") ? "expired" : "active",
        plan_has_room: !(
          token.includes("unavailable") ||
          token.includes("no-room") ||
          token.includes("full")
        ),
      })
    }, 650)
  })
}

// POST /integrations/ads/invites/public/{token}/oauth/start
// In reality this returns { authorize_url } and we redirect off-site; here we
// simulate the round trip by returning to this page with ?status=connected.
function startPublicOauth(token: string): Promise<{ authorize_url: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 409 INVALID_STATE - link expired between открытием and кліком.
      if (token.includes("stale")) {
        reject(new Error("INVALID_STATE"))
        return
      }
      resolve({ authorize_url: "https://facebook.com/oauth/authorize?mock=1" })
    }, 1100)
  })
}

// ---------------------------------------------------------------------------
// Page-level state machine
// ---------------------------------------------------------------------------

type Phase =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "expired" }
  | { kind: "unavailable"; invite: AdInvitePublic }
  | { kind: "ready"; invite: AdInvitePublic }
  | { kind: "connecting"; invite: AdInvitePublic }

export function ConnectAdsPage() {
  const { token = "" } = useParams()
  const [searchParams] = useSearchParams()

  // Return from the ad platform: backend appends these to whatever URL it
  // returned to. For an unauthenticated stranger this is a terminal screen.
  const returnStatus = searchParams.get("status")
  const returnReason = searchParams.get("reason")
  const returnProvider = searchParams.get("provider") as InviteProvider | null

  return (
    <ConnectShell footer={<DemoSwitcher token={token} />}>
      {/* Keyed so a token/return change remounts the flow into a fresh load. */}
      <ConnectAdsFlow
        key={`${token}|${returnStatus ?? ""}`}
        token={token}
        returnStatus={returnStatus}
        returnReason={returnReason}
        returnProvider={returnProvider}
      />
    </ConnectShell>
  )
}

function ConnectAdsFlow({
  token,
  returnStatus,
  returnReason,
  returnProvider,
}: {
  token: string
  returnStatus: string | null
  returnReason: string | null
  returnProvider: InviteProvider | null
}) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>({ kind: "loading" })

  const isReturn = returnStatus === "connected" || returnStatus === "error"

  // Load the invite, unless we are showing a post-OAuth return screen.
  useEffect(() => {
    if (isReturn) return

    let cancelled = false
    fetchPublicInvite(token)
      .then((invite) => {
        if (cancelled) return
        if (invite.status === "expired") setPhase({ kind: "expired" })
        else if (!invite.plan_has_room)
          setPhase({ kind: "unavailable", invite })
        else setPhase({ kind: "ready", invite })
      })
      .catch(() => {
        // 404 NOT_FOUND (or any unexpected failure) → «Посилання недійсне».
        if (!cancelled) setPhase({ kind: "not-found" })
      })

    return () => {
      cancelled = true
    }
  }, [token, isReturn])

  const handleConnect = (invite: AdInvitePublic) => {
    setPhase({ kind: "connecting", invite })
    startPublicOauth(token)
      .then(() => {
        // Real flow: window.location.href = authorize_url. Simulated round trip:
        navigate(
          `/connect/ads/${token}?status=connected&provider=${invite.provider}`,
          { replace: true }
        )
      })
      .catch(() => {
        // 409 INVALID_STATE → лінк протермінувався між відкриттям і кліком → Етап 1.
        setPhase({ kind: "expired" })
      })
  }

  if (returnStatus === "connected") {
    return <SuccessState provider={returnProvider} />
  }
  if (returnStatus === "error") {
    return (
      <ErrorState
        reason={returnReason}
        onRetry={() => navigate(`/connect/ads/${token}`, { replace: true })}
      />
    )
  }

  switch (phase.kind) {
    case "not-found":
      return <NotFoundState />
    case "expired":
      return <ExpiredState />
    case "unavailable":
      return <UnavailableState invite={phase.invite} />
    case "ready":
    case "connecting":
      return (
        <ReadyState
          invite={phase.invite}
          connecting={phase.kind === "connecting"}
          onConnect={() => handleConnect(phase.invite)}
        />
      )
    case "loading":
    default:
      return <LoadingState />
  }
}

// ---------------------------------------------------------------------------
// Shared shell: header with logo + theme toggle, centered content.
// ---------------------------------------------------------------------------

function ConnectShell({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex min-h-svh flex-col bg-muted dark:bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between px-6 md:px-8">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IconChartPie className="size-5" />
          </div>
          <span className="text-sm font-semibold">
            Ads<span className="text-primary">Metry</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Перемкнути тему"
        >
          {isDark ? <IconSun /> : <IconMoon />}
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-in duration-300 fade-in slide-in-from-bottom-3">
          {children}
        </div>
      </main>
      {footer}
    </div>
  )
}

// ---------------------------------------------------------------------------
// State card primitive
// ---------------------------------------------------------------------------

type Tone = "neutral" | "brand" | "success" | "warning" | "danger"

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-primary/10 text-primary",
  success:
    "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning:
    "bg-amber-500/12 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
}

function StateCard({
  icon: Icon,
  iconRender,
  tone = "neutral",
  title,
  description,
  children,
}: {
  icon?: ComponentType<{ className?: string }>
  iconRender?: React.ReactNode
  tone?: Tone
  title: string
  description: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-card px-6 py-8 text-center shadow-xs sm:px-8">
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          TONE_CLASSES[tone]
        )}
      >
        {iconRender ?? (Icon ? <Icon className="size-7" /> : null)}
      </div>
      <h1 className="mt-5 text-lg font-bold tracking-tight text-balance">
        {title}
      </h1>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual states
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-card px-6 py-8 shadow-xs sm:px-8">
      <Skeleton className="size-14 rounded-2xl" />
      <Skeleton className="mt-5 h-5 w-48" />
      <Skeleton className="mt-3 h-4 w-64" />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-6 h-10 w-full rounded-md" />
    </div>
  )
}

function ReadyState({
  invite,
  connecting,
  onConnect,
}: {
  invite: AdInvitePublic
  connecting: boolean
  onConnect: () => void
}) {
  const Logo = PROVIDER_META[invite.provider].logo
  const inviter = invite.inviter_name ?? "Команда"

  return (
    <StateCard
      iconRender={<Logo className="size-8" />}
      tone="brand"
      title={`${inviter} запрошує підключити ваш ${invite.provider_label}`}
      description={
        <>
          Авторизуйтесь у {invite.provider_label}, щоб надати доступ до
          рекламних кабінетів. Після підключення можна закрити вкладку.
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full gap-1.5"
          disabled={connecting}
          onClick={onConnect}
        >
          {connecting ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              Перенаправлення…
            </>
          ) : (
            <>
              <Logo className="size-4" />
              Підключити {invite.provider_label}
              <IconArrowRight className="size-4" />
            </>
          )}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <IconShieldLock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          Захищено OAuth 2.0 - ми не бачимо ваш пароль
        </div>
      </div>
    </StateCard>
  )
}

function UnavailableState({ invite }: { invite: AdInvitePublic }) {
  return (
    <StateCard
      icon={IconAlertCircle}
      tone="warning"
      title="Підключення зараз недоступне"
      description={
        <>
          За цим посиланням наразі не вдасться підключити{" "}
          {invite.provider_label}. Зверніться до того, хто його надіслав, щоб
          отримати нове посилання.
        </>
      }
    >
      <Button size="lg" variant="secondary" className="w-full" disabled>
        Підключити {invite.provider_label}
      </Button>
    </StateCard>
  )
}

function ExpiredState() {
  return (
    <StateCard
      icon={IconClockX}
      tone="warning"
      title="Термін дії посилання минув"
      description={
        <>
          Посилання для підключення дійсне лише 15 хвилин. Попросіть того, хто
          вас запросив, надіслати нове посилання.
        </>
      }
    />
  )
}

function NotFoundState() {
  return (
    <StateCard
      icon={IconLinkOff}
      tone="neutral"
      title="Посилання недійсне"
      description={
        <>
          Це посилання для підключення не існує або було пошкоджене. Перевірте,
          чи ви скопіювали його повністю, або запросіть нове.
        </>
      }
    />
  )
}

function SuccessState({ provider }: { provider: InviteProvider | null }) {
  const label = provider ? PROVIDER_META[provider].label : "Рекламний кабінет"
  return (
    <StateCard
      iconRender={<IconCircleCheck className="size-8" />}
      tone="success"
      title="Кабінет підключено"
      description={
        <>
          {label} успішно під'єднано. Дані почнуть синхронізуватися найближчим
          часом - можна закрити цю вкладку.
        </>
      }
    >
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <IconUsersGroup className="size-3.5" />
        Доступ отримала команда, яка вас запросила
      </div>
    </StateCard>
  )
}

function ErrorState({
  reason,
  onRetry,
}: {
  reason: string | null
  onRetry: () => void
}) {
  return (
    <StateCard
      icon={IconAlertTriangle}
      tone="danger"
      title="Не вдалося підключити кабінет"
      description={
        reason && reason.trim().length > 0
          ? reason
          : "Сталася помилка під час підключення. Спробуйте ще раз або зверніться до того, хто вас запросив."
      }
    >
      <Button
        size="lg"
        variant="secondary"
        className="w-full gap-1.5"
        onClick={onRetry}
      >
        <IconRefresh className="size-4" />
        Спробувати ще раз
      </Button>
    </StateCard>
  )
}

// ---------------------------------------------------------------------------
// Demo-only state switcher. The whole app is a prototype with mocked data, so
// this lets you flip through every state without a backend. Remove once a real
// invite API is wired up.
// ---------------------------------------------------------------------------

function DemoSwitcher({ token }: { token: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div ref={ref} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      {open && (
        <div className="mb-2 flex animate-in flex-wrap justify-center gap-1.5 rounded-xl border bg-popover p-2 shadow-md duration-150 fade-in slide-in-from-bottom-1">
          {CONNECT_ADS_DEMO_STATES.map((s) => (
            <Button
              key={s.label}
              size="xs"
              variant="ghost"
              onClick={() => navigate(s.to, { replace: true })}
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 rounded-full text-xs text-muted-foreground shadow-sm"
          onClick={() => setOpen((v) => !v)}
        >
          <IconChartPie className="size-3.5" />
          Демо: стани
          <span className="font-mono text-[10px] opacity-60">{token}</span>
        </Button>
      </div>
    </div>
  )
}
