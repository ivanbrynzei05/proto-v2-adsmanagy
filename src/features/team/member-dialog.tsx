import {
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconRefresh,
} from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { OfficeChips } from "@/components/ui/office-chips"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  generatePassword,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  roleInfo,
  TEAM_ROLES,
  type TeamMember,
  type TeamRole,
} from "./types"

// What the dialog hands back. The password is deliberately not part of it - it
// is shown once and never stored in the prototype. Ad accounts aren't here
// either: they get assigned to a member in Інтеграції, not typed in by hand.
export type MemberDraft = {
  name: string
  email: string
  role: TeamRole
  offices: string[]
  salaryPercent: string
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

// What the picked role opens up, right under the picker.
function AccessPreview({ role }: { role: TeamRole }) {
  const info = roleInfo(role)

  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold">
        <info.icon className="size-4 text-muted-foreground" />
        Що може робити {info.label}:
      </p>
      <ul className="mt-2 flex flex-col gap-1 pl-6">
        {info.capabilities.map((item) => (
          <li
            key={item}
            className="list-disc text-xs text-muted-foreground marker:text-muted-foreground/50"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PasswordField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error: string | null
}) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard can be blocked - the field is visible anyway
    }
  }

  return (
    <Field label="Пароль" error={error}>
      <div className="flex gap-2">
        <div className="flex h-9 min-w-0 flex-1 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30">
          <Input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Пароль для входу"
            autoComplete="new-password"
            className="h-full min-w-0 flex-1 rounded-none border-0 px-2.5 font-mono shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={visible ? "Сховати пароль" : "Показати пароль"}
            className="my-0.5 mr-0.5 shrink-0 text-muted-foreground"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <IconEyeOff /> : <IconEye />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Скопіювати пароль"
            className="my-0.5 mr-0.5 shrink-0 text-muted-foreground"
            onClick={copy}
          >
            {copied ? (
              <IconCheck className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <IconCopy />
            )}
          </Button>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-1.5"
          onClick={() => onChange(generatePassword())}
        >
          <IconRefresh className="size-4" />
          Згенерувати
        </Button>
      </div>
    </Field>
  )
}

type MemberFormProps = {
  /** present = editing an existing member, absent = adding a new one */
  member?: TeamMember
  /** role a new member starts on - the one picked in the "Додати" menu */
  defaultRole?: TeamRole
  /** roles that can be assigned */
  allowedRoles: TeamRole[]
  /** emails already in the team, lowercased */
  takenEmails: string[]
  onCancel: () => void
  onSubmit: (draft: MemberDraft) => void
}

// Lives inside the popup, which unmounts on close - so every open starts from
// clean fields and a fresh generated password, with no reset to remember.
function MemberForm({
  member,
  defaultRole,
  allowedRoles,
  takenEmails,
  onCancel,
  onSubmit,
}: MemberFormProps) {
  const isEdit = member !== undefined

  const [name, setName] = useState(member?.name ?? "")
  const [email, setEmail] = useState(member?.email ?? "")
  const [role, setRole] = useState<TeamRole>(
    member?.role ?? defaultRole ?? allowedRoles[0] ?? "buyer"
  )
  const [offices, setOffices] = useState<string[]>(member?.offices ?? [])
  const [salaryPercent, setSalaryPercent] = useState(
    member?.salaryPercent ?? ""
  )
  const [password, setPassword] = useState(() =>
    member ? "" : generatePassword()
  )

  const roleOptions = TEAM_ROLES.filter(
    (r) => allowedRoles.includes(r.value) || r.value === member?.role
  )
  const showRolePicker = roleOptions.length > 1

  const normalizedEmail = email.trim().toLowerCase()
  const emailTaken = takenEmails.includes(normalizedEmail)
  const emailError =
    email.trim() !== "" && !isValidEmail(email)
      ? "Схоже, в пошті помилка"
      : emailTaken
        ? "Такий email уже є в команді"
        : null

  const percentValue = Number(salaryPercent.replace(",", "."))
  const percentValid =
    salaryPercent.trim() !== "" &&
    Number.isFinite(percentValue) &&
    percentValue > 0 &&
    percentValue <= 100
  const percentError =
    salaryPercent.trim() !== "" && !percentValid
      ? "Вкажіть відсоток від 1 до 100"
      : null

  const passwordError =
    !isEdit && password !== "" && password.length < MIN_PASSWORD_LENGTH
      ? `Мінімум ${MIN_PASSWORD_LENGTH} символів`
      : null

  const canSubmit =
    name.trim() !== "" &&
    isValidEmail(email) &&
    !emailTaken &&
    offices.length > 0 &&
    percentValid &&
    (isEdit || password.length >= MIN_PASSWORD_LENGTH)

  const submit = () => {
    onSubmit({
      name: name.trim(),
      email: normalizedEmail,
      role,
      offices,
      salaryPercent: salaryPercent.trim().replace(",", "."),
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Редагування користувача" : "Новий користувач"}
        </DialogTitle>
      </DialogHeader>

      <div className="-mx-1 flex flex-col gap-3 overflow-y-auto px-1">
        {showRolePicker && (
          <Field label="Роль">
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => roleInfo(v as TeamRole).label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <option.icon className="text-muted-foreground" />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <AccessPreview role={role} />

        <Field label="Імʼя та прізвище">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Наприклад, Олег Кравець"
          />
        </Field>

        <Field label="Робоча пошта" error={emailError}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="off"
            aria-invalid={emailError !== null}
          />
        </Field>

        {!isEdit && (
          <PasswordField
            value={password}
            onChange={setPassword}
            error={passwordError}
          />
        )}

        <Field label="Офіси">
          <OfficeChips value={offices} onChange={setOffices} />
        </Field>

        <Field label="Зарплата, % від прибутку" error={percentError}>
          <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30">
            <Input
              value={salaryPercent}
              onChange={(e) =>
                setSalaryPercent(e.target.value.replace(/[^\d.,]/g, ""))
              }
              placeholder="30"
              inputMode="decimal"
              className="h-full min-w-0 flex-1 rounded-none border-0 px-2.5 shadow-none focus-visible:ring-0"
            />
            <span className="flex shrink-0 items-center bg-muted pr-2.5 pl-1.5 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </Field>
      </div>

      <DialogFooter className="sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Скасувати
        </Button>
        <Button
          disabled={!canSubmit}
          className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          onClick={submit}
        >
          {isEdit ? "Зберегти" : "Створити"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function MemberDialog({
  open,
  onOpenChange,
  onSubmit,
  ...form
}: Omit<MemberFormProps, "onCancel" | "onSubmit"> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: MemberDraft) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[60] max-w-lg data-ending-style:-translate-y-1/2 data-starting-style:-translate-y-1/2"
        overlayClassName="z-[60] backdrop-blur-md"
      >
        <MemberForm
          {...form}
          onCancel={() => onOpenChange(false)}
          onSubmit={(draft) => {
            onSubmit(draft)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
