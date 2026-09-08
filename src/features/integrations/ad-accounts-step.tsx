import {
  IconCheck,
  IconCopy,
  IconLock,
  IconPencil,
  IconShieldLock,
  IconTrash,
  IconUser,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  AD_PLATFORMS,
  countCabinets,
  MOCK_AD_ACCOUNTS,
  pluralizeKabinet,
  type AdPlatform,
  type ConnectedAdAccounts,
} from "./types"

// The authorisation lives in this dialog, so the page behind it stays a plain
// list of switches. Which platform is being connected is settled before it
// opens - each platform card carries its own button - so the dialog itself
// never asks.
function ConnectDialog({
  open,
  onOpenChange,
  platform,
  onConnect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: AdPlatform | null
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
        {platform && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <platform.icon className="size-5" />
                Підключення {platform.name}
              </DialogTitle>
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
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Who brought the account in.
 *
 * An account can arrive through a link a colleague followed, so on a team the
 * list holds logins nobody at this desk has ever seen. The name rides under the
 * account behind a person glyph - enough to know who to ask about it, quiet
 * enough not to compete with the account's own name. An account connected at
 * this desk carries no name and shows nothing.
 */
function ConnectedBy({ name }: { name?: string }) {
  if (!name) return null
  return (
    <span className="flex min-w-0 items-center gap-1">
      <IconUser className="size-3.5 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
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

  // three levels, in the order the connection actually nests: the platform is
  // connected once, logins arrive under it, and the cabinets the analytics
  // reads hang off a login. Every platform gets a card whether or not anything
  // is under it yet - the card is where its "connect" button lives.
  const groups = AD_PLATFORMS.map((platform) => ({
    platform,
    accounts: connectedAccounts[platform.name] ?? [],
  }))

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
      {groups.map(({ platform, accounts }, groupIndex) => {
        const cabinets = countCabinets({ [platform.name]: accounts })
        return (
          <div
            key={platform.name}
            {...rowProps(groupIndex, "rounded-xl border")}
          >
            {/* the platform is the card, not a logo repeated on every row, and
                its own connect button sits opposite it */}
            <div className="flex items-center gap-2.5 border-b px-3.5 py-3">
              <platform.icon className="size-7 shrink-0" />
              <p className="text-sm font-bold tracking-tight">
                {platform.name}
              </p>
              {cabinets > 0 && (
                <Badge
                  variant="outline"
                  className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                >
                  {cabinets} {pluralizeKabinet(cabinets)}
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="ml-auto gap-1.5"
                onClick={() => {
                  setConnectPlatform(platform)
                  setConnectOpen(true)
                }}
              >
                <platform.icon className="size-4" />
                Підключити
              </Button>
            </div>

            <div className="flex flex-col gap-3 p-3.5">
              {accounts.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Акаунти не підключені
                </div>
              )}
              {accounts.map((account, index) => {
                const accountEnabled = account.enabled !== false
                return (
                  <div
                    key={`${platform.name}-${index}`}
                    className="rounded-lg border p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3 border-b pb-3">
                      <div className="flex min-w-0 items-center gap-3">
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
                          {(account.label || account.connectedBy) && (
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                              {account.label && (
                                <span className="truncate">
                                  {account.owner}
                                </span>
                              )}
                              {account.label && account.connectedBy && (
                                <span className="text-muted-foreground/50">
                                  ·
                                </span>
                              )}
                              <ConnectedBy name={account.connectedBy} />
                            </div>
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
                          onClick={() =>
                            setAccountToDelete({ platform, index })
                          }
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
                    {/* an account that's off takes its cabinets out of the
                        analytics with it, so they all read as greyed */}
                    <div
                      className={cn(
                        "mt-3 flex flex-col gap-2 transition-opacity",
                        !accountEnabled && "opacity-45"
                      )}
                    >
                      {account.cabinets.map((cabinet, cabinetIndex) => {
                        // a locked cabinet is not "off" - the platform won't
                        // give us its numbers at all, so the switch is dead
                        // rather than waiting to be flipped back
                        const locked = Boolean(cabinet.lockReason)
                        const enabled = !locked && cabinet.enabled !== false
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
                                {!locked && (
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
                                )}
                              </div>
                              {locked ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {cabinet.lockReason}
                                </p>
                              ) : (
                                cabinet.label && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {cabinet.name}
                                  </p>
                                )
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {locked ? (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <span className="flex size-8 cursor-default items-center justify-center text-muted-foreground" />
                                    }
                                  >
                                    <IconLock className="size-4" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Кабінет недоступний - увімкнути його не
                                    можна
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
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
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <ConnectDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        platform={connectPlatform}
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
