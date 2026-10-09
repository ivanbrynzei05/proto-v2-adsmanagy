import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconTrash,
  IconUser,
  IconUsers,
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
import { TelegramLogo } from "./logos"
import {
  MOCK_TELEGRAM_CHATS,
  pluralizeChat,
  TELEGRAM_BOT,
  type TelegramChat,
} from "./types"

const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

// The chat the mocked bot "hears back from": the next one on the list that
// isn't connected yet, or a numbered stand-in once the list runs out.
function nextChat(connected: TelegramChat[]): TelegramChat {
  return (
    MOCK_TELEGRAM_CHATS.find((c) => !connected.some((x) => x.id === c.id)) ?? {
      id: String(Date.now()),
      title: `Чат ${connected.length + 1}`,
      kind: "group",
    }
  )
}

// The bot learns which chat to write to from the code: whoever sends it -
// a person in their own chat or anyone in a group the bot was added to - is the
// chat that gets connected.
function ConnectDialog({
  open,
  onOpenChange,
  code,
  onConnect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  onConnect: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  const command = `/start ${code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard can be blocked - the field is visible anyway
    }
  }

  // Mock of the bot confirming it received the code.
  const handleCheck = () => {
    setChecking(true)
    window.setTimeout(() => {
      setChecking(false)
      onConnect()
      onOpenChange(false)
    }, 1100)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (checking) return
        onOpenChange(next)
        if (!next) setCopied(false)
      }}
    >
      <DialogContent
        className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TelegramLogo className="size-5" />
            Підключення Telegram
          </DialogTitle>
          <DialogDescription>
            Надішліть код боту @{TELEGRAM_BOT} в особистому чаті або в групі
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="secondary"
          size="lg"
          className="w-full gap-1.5"
          onClick={() =>
            window.open(
              `https://t.me/${TELEGRAM_BOT}?start=${code}`,
              "_blank",
              "noopener"
            )
          }
        >
          <TelegramLogo className="size-4" />
          Відкрити @{TELEGRAM_BOT}
        </Button>
        <div className="flex items-center gap-2">
          <Input readOnly value={command} className="font-mono" />
          <Button
            variant="secondary"
            size="icon"
            aria-label="Скопіювати код"
            onClick={handleCopy}
          >
            {copied ? (
              <IconCheck className="size-4" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </Button>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button
            variant="secondary"
            disabled={checking}
            onClick={() => onOpenChange(false)}
          >
            Скасувати
          </Button>
          <Button
            disabled={checking}
            className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={handleCheck}
          >
            {checking && <IconLoader2 className="size-4 animate-spin" />}
            {checking ? "Перевірка…" : "Перевірити"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TelegramStep({
  telegramChats,
  setTelegramChats,
}: {
  telegramChats: TelegramChat[]
  setTelegramChats: Dispatch<SetStateAction<TelegramChat[]>>
}) {
  const [connectOpen, setConnectOpen] = useState(false)
  // kept while the dialog animates out, so the code doesn't change under it
  const [code, setCode] = useState(makeCode)
  const [chatToDelete, setChatToDelete] = useState<TelegramChat | null>(null)
  const count = telegramChats.length

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border">
        <div className="flex items-center gap-2.5 border-b px-3.5 py-3">
          <TelegramLogo className="size-7 shrink-0" />
          <p className="text-sm font-bold tracking-tight">Telegram</p>
          {count > 0 && (
            <Badge
              variant="outline"
              className="border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            >
              {count} {pluralizeChat(count)}
            </Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => {
              setCode(makeCode())
              setConnectOpen(true)
            }}
          >
            <TelegramLogo className="size-4" />
            Підключити
          </Button>
        </div>

        <div className="flex flex-col gap-2 p-3.5">
          {count === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Чати не підключені
            </div>
          )}
          {telegramChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
                  {chat.kind === "group" ? (
                    <IconUsers className="size-4.5" />
                  ) : (
                    <IconUser className="size-4.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{chat.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {chat.username ? `@${chat.username}` : "Група"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                title="Відключити чат"
                aria-label="Відключити чат"
                onClick={() => setChatToDelete(chat)}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <ConnectDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        code={code}
        onConnect={() => setTelegramChats((prev) => [...prev, nextChat(prev)])}
      />
      <Dialog
        open={chatToDelete !== null}
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Відключити чат?</DialogTitle>
            <DialogDescription>
              {chatToDelete &&
                `«${chatToDelete.title}» більше не отримуватиме сповіщення`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setChatToDelete(null)}>
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!chatToDelete) return
                setTelegramChats((prev) =>
                  prev.filter((c) => c.id !== chatToDelete.id)
                )
                setChatToDelete(null)
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
