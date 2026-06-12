import {
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconShieldLock,
  IconTrash,
} from "@tabler/icons-react"
import { useState, type Dispatch, type SetStateAction } from "react"

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
import { cn } from "@/lib/utils"
import {
  AD_PLATFORMS,
  MOCK_AD_ACCOUNTS,
  pluralizeKabinet,
  type AdPlatform,
  type ConnectedAdAccounts,
} from "./types"

function ConnectPlatformDialog({
  platform,
  onOpenChange,
  onConnect,
}: {
  platform: AdPlatform | null
  onOpenChange: (open: boolean) => void
  onConnect: (platform: AdPlatform) => void
}) {
  const [copied, setCopied] = useState(false)
  const [lastPlatform, setLastPlatform] = useState<AdPlatform | null>(null)

  if (platform && platform !== lastPlatform) {
    setLastPlatform(platform)
  }

  const display = platform ?? lastPlatform
  const link = display
    ? `https://app.adsmetry.io/connect/${display.name.toLowerCase().replace(/\s+/g, "-")}`
    : ""

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog
      open={!!platform}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setCopied(false)
      }}
    >
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        {display && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <display.icon className="size-5" />
                Підключення {display.name}
              </DialogTitle>
              <DialogDescription>
                Авторизуйтесь натиснувши кнопку або перейдіть по посиланню
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-1.5"
              onClick={() => onConnect(display)}
            >
              <display.icon className="size-4" />
              Підключити {display.name}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <IconShieldLock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Захищено OAuth 2.0 - ми не бачимо ваш пароль
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                Посилання також можна надіслати людині, після підключення акаунт
                людини буде доступний у вас
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={link} className="text-xs" />
                <Button variant="secondary" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AdAccountsStep({
  connectedAccounts,
  setConnectedAccounts,
  animate = true,
}: {
  connectedAccounts: ConnectedAdAccounts
  setConnectedAccounts: Dispatch<SetStateAction<ConnectedAdAccounts>>
  animate?: boolean
}) {
  const [connectPlatform, setConnectPlatform] = useState<AdPlatform | null>(
    null
  )
  const [accountToDelete, setAccountToDelete] = useState<{
    platform: AdPlatform
    index: number
  } | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Alert
        variant="info"
        className={cn(
          animate && "animate-in duration-300 fade-in slide-in-from-right-8"
        )}
      >
        <IconInfoCircle />
        <AlertDescription>
          Підключіть рекламні кабінети, вас перенаправить на платформу, на якій
          потрібно підтвердити інтеграцію
        </AlertDescription>
      </Alert>
      {AD_PLATFORMS.map((platform, i) => {
        const accounts = connectedAccounts[platform.name] ?? []
        const hasAccounts = accounts.length > 0
        return (
          <div
            key={platform.name}
            className={cn(
              "rounded-lg border p-3.5",
              animate &&
                "animate-in duration-300 fade-in slide-in-from-right-8"
            )}
            style={
              animate
                ? {
                    animationDelay: `${(i + 1) * 75}ms`,
                    animationFillMode: "both",
                  }
                : undefined
            }
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3",
                hasAccounts && "border-b pb-3"
              )}
            >
              <div className="flex items-center gap-3">
                <platform.icon className="size-7" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{platform.name}</span>
                  {hasAccounts ? (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                    >
                      {accounts.length} {pluralizeKabinet(accounts.length)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Не підключено
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="secondary"
                className="gap-1.5"
                onClick={() => setConnectPlatform(platform)}
              >
                <platform.icon className="size-4" />
                {hasAccounts ? "Додати ще" : "Підключити"}
              </Button>
            </div>
            {hasAccounts && (
              <div className="mt-3 flex flex-col gap-2">
                {accounts.map((account, accountIndex) => (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.manager} · {account.accountId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="gap-1 border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      >
                        <IconCheck className="size-3.5" />
                        Активний
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        onClick={() =>
                          setAccountToDelete({ platform, index: accountIndex })
                        }
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <ConnectPlatformDialog
        platform={connectPlatform}
        onOpenChange={(open) => !open && setConnectPlatform(null)}
        onConnect={(platform) => {
          setConnectedAccounts((prev) => {
            const existing = prev[platform.name] ?? []
            const pool = MOCK_AD_ACCOUNTS[platform.name]
            const next = pool[existing.length % pool.length]
            return {
              ...prev,
              [platform.name]: [...existing, next],
            }
          })
          setConnectPlatform(null)
        }}
      />
      <Dialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Видалити рекламний кабінет?</DialogTitle>
            <DialogDescription>
              {accountToDelete &&
                (() => {
                  const account =
                    connectedAccounts[accountToDelete.platform.name]?.[
                      accountToDelete.index
                    ]
                  return `Кабінет ${account?.name} (${accountToDelete.platform.name}) буде відключено від аналітики`
                })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setAccountToDelete(null)}
            >
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!accountToDelete) return
                setConnectedAccounts((prev) => {
                  const existing = prev[accountToDelete.platform.name] ?? []
                  const next = existing.filter(
                    (_, i) => i !== accountToDelete.index
                  )
                  const updated = { ...prev }
                  if (next.length > 0) {
                    updated[accountToDelete.platform.name] = next
                  } else {
                    delete updated[accountToDelete.platform.name]
                  }
                  return updated
                })
                setAccountToDelete(null)
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
