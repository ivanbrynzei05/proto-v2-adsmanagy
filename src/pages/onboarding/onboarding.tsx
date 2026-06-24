/* eslint-disable react-refresh/only-export-components */
import {
  IconArrowLeft,
  IconArrowRight,
  IconChartPie,
  IconCircleCheck,
  IconMoon,
  IconSun,
  IconX,
} from "@tabler/icons-react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useIntegrations } from "@/components/integrations-provider"
import { useTheme } from "@/components/theme-provider"
import { BillingPeriodToggle } from "@/components/ui/billing-period-toggle"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PricingGrid } from "@/features/billing/plans"
import { AdAccountsStep } from "@/features/integrations/ad-accounts-step"
import { CallCentersStep } from "@/features/integrations/call-centers-step"
import { CrmStep } from "@/features/integrations/crm-step"
import { cn } from "@/lib/utils"

export const ONBOARDING_STEPS = [
  {
    title: "Додайте рекламний кабінет",
    heading: "Підключіть рекламні кабінети",
    description:
      "Додайте облікові записи Facebook, Google або TikTok Ads, щоб бачити витрати, ROI та ефективність кампаній в одному місці",
  },
  {
    title: "Підключіть CRM",
    heading: "Підключіть вашу CRM",
    description:
      "Синхронізуйте ліди та замовлення, щоб аналізувати апрув, дохід і конверсію по кожному джерелу",
  },
  {
    title: "Додайте колцентри",
    heading: "Додайте колцентри",
    description:
      "Підключіть колцентри, щоб відстежувати маржу, допродажі та ефективність операторів",
  },
  {
    title: "Оберіть тариф",
    heading: "Оберіть тариф",
    description:
      "Виберіть план, який підходить вашій команді, та розблокуйте повну аналітику без обмежень",
  },
] as const

export function SetupStepper({
  step,
  completed,
}: {
  step: number
  completed: boolean[]
}) {
  return (
    <div className="flex items-center justify-center">
      {ONBOARDING_STEPS.map((s, i) => {
        const index = i + 1
        const done = index < step && completed[i]
        const active = index === step
        return (
          <div key={s.title} className="flex items-center last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  done &&
                    "scale-100 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                  active &&
                    "scale-110 border-2 border-neutral-900 text-neutral-900 dark:border-white dark:text-white",
                  !done && !active && "scale-100 border text-muted-foreground"
                )}
              >
                {done ? (
                  <IconCircleCheck className="size-3.5 animate-in duration-300 zoom-in-50" />
                ) : (
                  index
                )}
              </div>
              <div
                className={cn(
                  "hidden text-sm font-medium transition-colors duration-300 sm:block",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
              </div>
            </div>
            {index < ONBOARDING_STEPS.length && (
              <div className="mx-2 h-px w-12 flex-none overflow-hidden bg-border">
                <div
                  className={cn(
                    "h-full bg-neutral-900 transition-transform duration-500 ease-out dark:bg-white",
                    done ? "translate-x-0" : "-translate-x-full"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const initialStep =
    typeof (location.state as { step?: number } | null)?.step === "number"
      ? (location.state as { step: number }).step
      : 1

  const [step, setStep] = useState(initialStep)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const {
    connectedAccounts,
    setConnectedAccounts,
    connectedCrms,
    setConnectedCrms,
    callCenters,
    setCallCenters,
  } = useIntegrations()

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  )
  const [confirmFreeOpen, setConfirmFreeOpen] = useState(false)

  const goToStep = (next: number) => {
    setDirection(next > step ? "forward" : "back")
    setStep(next)
  }

  const finish = () => navigate("/")

  const handleSelectPlan = (planId: string) => {
    // Paid plans open the checkout panel inside PricingGrid; we only handle
    // the free plan here (confirm dialog).
    if (planId === "free") {
      setConfirmFreeOpen(true)
    }
  }

  const current = ONBOARDING_STEPS[step - 1]

  const hasAdAccounts = Object.values(connectedAccounts).some(
    (accounts) => (accounts?.length ?? 0) > 0
  )
  const nextDisabled =
    (step === 1 && !hasAdAccounts) ||
    (step === 2 && connectedCrms.length === 0) ||
    (step === 3 && callCenters.length === 0)

  const completed = [
    hasAdAccounts,
    connectedCrms.length > 0,
    callCenters.length > 0,
    false,
  ]

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 shrink-0 items-center gap-4 bg-background/80 px-6 backdrop-blur md:px-8">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IconChartPie className="size-5" />
          </div>
          <span className="hidden text-sm font-semibold sm:inline">
            Ads<span className="text-primary">Metry</span>
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <SetupStepper step={step} completed={completed} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Перемкнути тему"
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Закрити"
            onClick={finish}
          >
            <IconX className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        <div className="mx-auto flex min-h-full max-w-7xl flex-col items-center py-8">
          <div
            key={`heading-${step}`}
            className={cn(
              "mb-6 max-w-xl animate-in text-center delay-150 duration-300 fill-mode-backwards fade-in",
              direction === "forward"
                ? "slide-in-from-right-8"
                : "slide-in-from-left-8"
            )}
          >
            <h2 className="text-xl font-bold tracking-tight">
              {current.heading}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {current.description}
            </p>
          </div>
          <div className={cn(step === 4 ? "w-full" : "w-full max-w-2xl")}>
            <div
              key={step}
              className={cn(
                "animate-in delay-150 duration-300 fill-mode-backwards fade-in",
                direction === "forward"
                  ? "slide-in-from-right-8"
                  : "slide-in-from-left-8"
              )}
            >
              {step === 1 && (
                <AdAccountsStep
                  connectedAccounts={connectedAccounts}
                  setConnectedAccounts={setConnectedAccounts}
                />
              )}
              {step === 2 && (
                <CrmStep
                  connectedCrms={connectedCrms}
                  setConnectedCrms={setConnectedCrms}
                />
              )}
              {step === 3 && (
                <CallCentersStep
                  callCenters={callCenters}
                  setCallCenters={setCallCenters}
                />
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="">
                      <BillingPeriodToggle
                        value={billingPeriod}
                        onChange={setBillingPeriod}
                      />
                    </div>
                  </div>
                  <PricingGrid
                    billingPeriod={billingPeriod}
                    currentPlanId="free"
                    allowSelectCurrent
                    onSelect={handleSelectPlan}
                    onCheckoutComplete={finish}
                    freeCurrentLabel="Недоступно"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t p-4 md:px-6">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4",
            step === 4 ? "max-w-7xl" : "max-w-2xl"
          )}
        >
          <Button
            variant="ghost"
            size="lg"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (step < ONBOARDING_STEPS.length) {
                goToStep(step + 1)
              } else {
                finish()
              }
            }}
          >
            Пропустити
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="secondary"
                size="lg"
                className="gap-1.5"
                onClick={() => goToStep(step - 1)}
              >
                <IconArrowLeft className="size-4" />
                Назад
              </Button>
            )}
            <Button
              size="lg"
              disabled={nextDisabled}
              className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              onClick={() => {
                if (step < ONBOARDING_STEPS.length) {
                  goToStep(step + 1)
                } else {
                  finish()
                }
              }}
            >
              Далі
              <IconArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmFreeOpen} onOpenChange={setConfirmFreeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Підтвердження</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете залишитися на безкоштовному тарифі?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setConfirmFreeOpen(false)}
            >
              Вибрати план
            </Button>
            <Button
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              onClick={() => {
                setConfirmFreeOpen(false)
                finish()
              }}
            >
              Так
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
