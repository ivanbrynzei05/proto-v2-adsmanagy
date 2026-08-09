import {
  IconAlertTriangle,
  IconChevronDown,
  IconPencil,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useTeam } from "@/components/team-provider"
import { Alert } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSubscription } from "@/features/billing/subscription-context"
import { planById } from "@/features/billing/subscription-state"
import { MemberDialog, type MemberDraft } from "@/features/team/member-dialog"
import {
  initialsOf,
  roleInfo,
  type TeamMember,
  type TeamRole,
} from "@/features/team/types"
import { cn } from "@/lib/utils"

// The screen belongs to the account owner, so these are the roles they hand out.
const INVITABLE_ROLES = roleInfo("owner").canInvite

// Same read as the plan-usage bars in the header billing chip: a thin bar plus
// a used/limit count, tinted once it gets close to or hits the ceiling.
function SeatsIndicator({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 100
  const tone =
    pct >= 100
      ? "bg-destructive"
      : pct >= 80
        ? "bg-amber-500"
        : "bg-foreground/60"

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {used} / {limit}
      </span>
    </div>
  )
}

export function TeamSection() {
  const { members, setMembers } = useTeam()
  const { state } = useSubscription()
  const navigate = useNavigate()

  // Dialog config is kept separately from `open`, so the popup keeps its title
  // and fields while it animates out.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTarget, setDialogTarget] = useState<{
    member?: TeamMember
    role: TeamRole
  }>({ role: "buyer" })
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)

  const plan = planById(state.planId)
  const seatLimit = (plan?.limits.members ?? 0) + (state.addons.members ?? 0)
  const atLimit = members.length >= seatLimit

  const openAdd = (role: TeamRole) => {
    setDialogTarget({ role })
    setDialogOpen(true)
  }

  const openEdit = (member: TeamMember) => {
    setDialogTarget({ member, role: member.role })
    setDialogOpen(true)
  }

  const submitMember = (draft: MemberDraft) => {
    const target = dialogTarget.member
    if (target) {
      setMembers((prev) =>
        prev.map((m) => (m.id === target.id ? { ...m, ...draft } : m))
      )
      return
    }
    setMembers((prev) => [
      ...prev,
      // Ad accounts are attached later, in Інтеграції.
      { id: `member-${Date.now()}`, adAccounts: "", ...draft },
    ])
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            Користувачі
          </CardTitle>

          <CardAction className="flex items-center gap-3">
            <SeatsIndicator used={members.length} limit={seatLimit} />
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={atLimit}
                render={
                  <Button variant="secondary" className="gap-1.5">
                    <IconUserPlus className="size-4" />
                    Додати
                    <IconChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                {INVITABLE_ROLES.map((role) => {
                  const info = roleInfo(role)
                  return (
                    <DropdownMenuItem key={role} onClick={() => openAdd(role)}>
                      <info.icon className="text-muted-foreground" />
                      {info.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {atLimit && (
            // A row rather than the alert's default icon/text grid: the button
            // makes the strip taller than one line, and that grid pins the icon
            // to the top of it.
            <Alert
              variant="info"
              className="flex flex-wrap items-center gap-x-3 gap-y-2 [&>svg]:translate-y-0"
            >
              <IconAlertTriangle className="shrink-0" />
              <span className="flex-1 text-sm">
                {seatLimit === 0
                  ? "Тариф не передбачає учасників команди"
                  : "Ви досягли ліміту"}
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => navigate("/settings?section=plans")}
              >
                Розширити тариф
              </Button>
            </Alert>
          )}

          <Table containerClassName="rounded-lg border">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-3 text-xs font-medium text-muted-foreground">
                  Користувач
                </TableHead>
                <TableHead className="px-3 text-xs font-medium text-muted-foreground">
                  Роль
                </TableHead>
                <TableHead className="px-3 text-xs font-medium text-muted-foreground">
                  Офіси
                </TableHead>
                <TableHead className="px-3 text-right text-xs font-medium text-muted-foreground">
                  Зарплата
                </TableHead>
                <TableHead className="px-3 text-right text-xs font-medium text-muted-foreground">
                  Акаунти
                </TableHead>
                <TableHead className="w-0 px-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const info = roleInfo(member.role)
                return (
                  <TableRow key={member.id}>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                            {initialsOf(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5 text-sm">
                        <info.icon className="size-4 text-muted-foreground" />
                        {info.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      {member.offices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.offices.map((office) => (
                            <Badge
                              key={office}
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              {office}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          0
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right text-sm">
                      <span className="font-semibold tabular-nums">
                        {member.salaryPercent || "0"}%
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right text-sm">
                      <span className="tabular-nums">
                        {member.adAccounts || "0"}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Редагувати"
                          className="text-muted-foreground"
                          onClick={() => openEdit(member)}
                        >
                          <IconPencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Видалити"
                          className="text-muted-foreground"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={dialogTarget.member}
        defaultRole={dialogTarget.role}
        allowedRoles={INVITABLE_ROLES}
        takenEmails={members
          .filter((m) => m.id !== dialogTarget.member?.id)
          .map((m) => m.email.toLowerCase())}
        onSubmit={submitMember}
      />

      <Dialog
        open={memberToRemove !== null}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent
          className="z-[60] max-w-md data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
          overlayClassName="z-[60] backdrop-blur-md"
        >
          <DialogHeader>
            <DialogTitle>Видалити користувача?</DialogTitle>
            <DialogDescription>
              {memberToRemove &&
                `${memberToRemove.name} втратить доступ до кабінету, а місце за тарифом звільниться`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setMemberToRemove(null)}>
              Скасувати
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!memberToRemove) return
                setMembers((prev) =>
                  prev.filter((m) => m.id !== memberToRemove.id)
                )
                setMemberToRemove(null)
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
