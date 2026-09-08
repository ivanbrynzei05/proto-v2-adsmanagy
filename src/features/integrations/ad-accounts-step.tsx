import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconPencil,
  IconPlus,
  IconShieldLock,
  IconTrash,
} from "@tabler/icons-react"
import { useState, type Dispatch, type SetStateAction } from "react"

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
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  AD_PLATFORMS,
  countCabinets,
  MOCK_AD_ACCOUNTS,
  pluralizeKabinet,
  type AdPlatform,
  type ConnectedAdAccounts,
} from "./types"

// The whole connect flow lives in this dialog - first the platform, then the
// authorisation for it - so the page behind it stays a plain list of switches.
function ConnectDialog({
  open,
  onOpenChange,
  platform,
  onPickPlatform,
  connectedAccounts,
  onConnect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: AdPlatform | null
  onPickPlatform: (platform: AdPlatform | null) => void
  connectedAccounts: ConnectedAdAccounts
  onConnect: (platform: AdPlatform) => void
}) {
  const [copied, setCopied] = useState(false)

  const link = platform
    ? `https://app.adsmetry.io/connect/${platform.name.toLowerCase().replace(/\s+/g, "-")}`
    : ""

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setCopied(false)
      }}
    >
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        {platform ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="-ml-1.5 shrink-0 text-muted-foreground"
                  aria-label="Назад"
                  onClick={() => onPickPlatform(null)}
                >
                  <IconArrowLeft className="size-4" />
                </Button>
                <DialogTitle className="flex items-center gap-2">
                  <platform.icon className="size-5" />
                  Підключення {platform.name}
                </DialogTitle>
              </div>
              <DialogDescription>
                Авторизуйтесь натиснувши кнопку або перейдіть по посиланню
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-1.5"
              onClick={() => onConnect(platform)}
            >
              <platform.icon className="size-4" />
              Підключити {platform.name}
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
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Підключити рекламний акаунт</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {AD_PLATFORMS.map((p) => {
                const count = countCabinets({
                  [p.name]: connectedAccounts[p.name],
                })
                return (
                  <button
                    key={p.name}
                    type="button"
                    className="flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors hover:bg-muted"
                    onClick={() => onPickPlatform(p)}
                  >
                    <p.icon className="size-7 shrink-0" />
                    <span className="text-sm font-semibold">{p.name}</span>
                    {count > 0 && (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      >
                        {count} {pluralizeKabinet(count)}
                      </Badge>
                    )}
                    <IconChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
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
  const [connectOpen, setConnectOpen] = useState(false)
  // kept while the dialog animates out, so closing it doesn't flash the picker
  const [connectPlatform, setConnectPlatform] = useState<AdPlatform | null>(
    null
  )
  const [accountToDelete, setAccountToDelete] = useState<{
    platform: AdPlatform
    index: number
  } | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  // one dialog renames both - a null cabinetIndex means the account itself.
  // The target outlives the closing animation, so the field doesn't blank out.
  const [rename, setRename] = useState<{
    platform: AdPlatform
    accountIndex: number
    cabinetIndex: number | null
    value: string
    original: string
  } | null>(null)

  const openRename = (
    platform: AdPlatform,
    accountIndex: number,
    cabinetIndex: number | null,
    original: string,
    value: string
  ) => {
    setRename({ platform, accountIndex, cabinetIndex, value, original })
    setRenameOpen(true)
  }

  const saveRename = () => {
    if (!rename) return
    const { platform, accountIndex, cabinetIndex, original } = rename
    const value = rename.value.trim()
    // an empty field, or the platform's own name typed back in, drops the
    // custom name instead of freezing today's original as a label
    const label = !value || value === original ? undefined : value

    setConnectedAccounts((prev) => ({
      ...prev,
      [platform.name]: (prev[platform.name] ?? []).map((account, i) => {
        if (i !== accountIndex) return account
        if (cabinetIndex === null) return { ...account, label }
        return {
          ...account,
          cabinets: account.cabinets.map((cabinet, j) =>
            j === cabinetIndex ? { ...cabinet, label } : cabinet
          ),
        }
      }),
    }))
    setRenameOpen(false)
  }

  // one flat list of accounts - an account's platform is its logo, so they
  // don't need to be grouped under a card per platform
  const rows = AD_PLATFORMS.flatMap((platform) =>
    (connectedAccounts[platform.name] ?? []).map((account, index) => ({
      platform,
      account,
      index,
    }))
  )

  const setAccountEnabled = (
    platform: AdPlatform,
    accountIndex: number,
    enabled: boolean
  ) =>
    setConnectedAccounts((prev) => ({
      ...prev,
      [platform.name]: (prev[platform.name] ?? []).map((account, i) =>
        i === accountIndex ? { ...account, enabled } : account
      ),
    }))

  const setCabinetEnabled = (
    platform: AdPlatform,
    accountIndex: number,
    cabinetIndex: number,
    enabled: boolean
  ) =>
    setConnectedAccounts((prev) => ({
      ...prev,
      [platform.name]: (prev[platform.name] ?? []).map((account, i) =>
        i === accountIndex
          ? {
              ...account,
              cabinets: account.cabinets.map((cabinet, j) =>
                j === cabinetIndex ? { ...cabinet, enabled } : cabinet
              ),
            }
          : account
      ),
    }))

  // every row slides in one after another, the same as the other setup steps
  const rowProps = (i: number, className: string) => ({
    className: cn(
      className,
      animate && "animate-in duration-300 fade-in slide-in-from-right-8"
    ),
    style: animate
      ? { animationDelay: `${i * 75}ms`, animationFillMode: "both" }
      : undefined,
  })

  return (
    <div className="flex flex-col gap-3">
      <div {...rowProps(0, "flex justify-end")}>
        <Button
          variant="secondary"
          className="gap-1.5"
          onClick={() => {
            setConnectPlatform(null)
            setConnectOpen(true)
          }}
        >
          <IconPlus className="size-4" />
          Підключити акаунт
        </Button>
      </div>
      {rows.length === 0 ? (
        <div
          {...rowProps(
            1,
            "rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
          )}
        >
          Акаунти не підключені
        </div>
      ) : (
        rows.map(({ platform, account, index }, i) => {
          const accountEnabled = account.enabled !== false
          return (
            <div
              key={`${platform.name}-${index}`}
              {...rowProps(i + 1, "rounded-lg border p-3.5")}
            >
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <platform.icon className="size-7 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1">
                      <p className="truncate text-sm font-semibold">
                        {account.label ?? account.owner}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground"
                        aria-label="Перейменувати акаунт"
                        onClick={() =>
                          openRename(
                            platform,
                            index,
                            null,
                            account.owner,
                            account.label ?? account.owner
                          )
                        }
                      >
                        <IconPencil />
                      </Button>
                    </div>
                    {account.label && (
                      <p className="truncate text-xs text-muted-foreground">
                        {account.owner}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  >
                    {account.cabinets.length}{" "}
                    {pluralizeKabinet(account.cabinets.length)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label="Відключити акаунт"
                    onClick={() => setAccountToDelete({ platform, index })}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                  <Switch
                    checked={accountEnabled}
                    onCheckedChange={(next) =>
                      setAccountEnabled(platform, index, next)
                    }
                    aria-label={`Акаунт ${account.label ?? account.owner}`}
                  />
                </div>
              </div>
              {/* an account that's off takes its cabinets out of the analytics
                  with it, so they all read as greyed */}
              <div
                className={cn(
                  "mt-3 flex flex-col gap-2 transition-opacity",
                  !accountEnabled && "opacity-45"
                )}
              >
                {account.cabinets.map((cabinet, cabinetIndex) => {
                  const enabled = cabinet.enabled !== false
                  return (
                    <div
                      key={cabinet.cabinetId}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
                    >
                      <div
                        className={cn(
                          "min-w-0 transition-opacity",
                          !enabled && "opacity-50"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-1">
                          <p className="truncate text-sm font-semibold">
                            {cabinet.label ?? cabinet.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0 text-muted-foreground"
                            aria-label="Перейменувати кабінет"
                            onClick={() =>
                              openRename(
                                platform,
                                index,
                                cabinetIndex,
                                cabinet.name,
                                cabinet.label ?? cabinet.name
                              )
                            }
                          >
                            <IconPencil />
                          </Button>
                        </div>
                        {cabinet.label && (
                          <p className="truncate text-xs text-muted-foreground">
                            {cabinet.name}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(next) =>
                            setCabinetEnabled(
                              platform,
                              index,
                              cabinetIndex,
                              next
                            )
                          }
                          aria-label={`Кабінет ${cabinet.label ?? cabinet.name}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
      <ConnectDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        platform={connectPlatform}
        onPickPlatform={setConnectPlatform}
        connectedAccounts={connectedAccounts}
        onConnect={(platform) => {
          setConnectedAccounts((prev) => {
            const existing = prev[platform.name] ?? []
            const pool = MOCK_AD_ACCOUNTS[platform.name]
            // the demo hands out the next login nobody has connected yet
            const next =
              pool.find((a) => !existing.some((e) => e.owner === a.owner)) ??
              pool[existing.length % pool.length]
            return {
              ...prev,
              [platform.name]: [...existing, next],
            }
          })
          setConnectOpen(false)
        }}
      />
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>
              {rename?.cabinetIndex === null
                ? "Перейменувати акаунт"
                : "Перейменувати кабінет"}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={rename?.value ?? ""}
            onChange={(e) =>
              setRename((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename()
            }}
          />
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={saveRename}>Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Відключити рекламний акаунт?</DialogTitle>
            <DialogDescription>
              {accountToDelete &&
                (() => {
                  const account =
                    connectedAccounts[accountToDelete.platform.name]?.[
                      accountToDelete.index
                    ]
                  const count = account?.cabinets.length ?? 0
                  return `Акаунт ${account?.label ?? account?.owner} (${accountToDelete.platform.name}) та його ${count} ${pluralizeKabinet(count)} буде відключено від аналітики`
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
              Відключити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
