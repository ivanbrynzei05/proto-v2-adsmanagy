import { IconArrowRight } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

import {
  actionInfo,
  actionLabel,
  conditionLabel,
  rangeInfo,
  type Rule,
} from "./types"

export function Chip({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums [&>svg]:size-3.5 [&>svg]:shrink-0",
        className
      )}
    >
      {children}
    </span>
  )
}

export function ActionChip({
  action,
  className,
}: {
  action: Rule["action"]
  className?: string
}) {
  const info = actionInfo(action.type)
  return (
    <Chip className={cn(info.tone, className)}>
      <info.icon />
      {actionLabel(action)}
    </Chip>
  )
}

// The rule read left to right: if … over the period → do.
export function RuleSentence({
  rule,
}: {
  rule: Pick<Rule, "conditions" | "range" | "action">
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {rule.conditions.length === 0 ? (
        <Chip className="bg-muted text-muted-foreground">Без умов</Chip>
      ) : (
        <>
          {rule.conditions.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-[11px] text-muted-foreground">і</span>
              )}
              <Chip className="bg-muted">{conditionLabel(c)}</Chip>
            </span>
          ))}
          <span className="text-xs text-muted-foreground">
            {rangeInfo(rule.range).label}
          </span>
        </>
      )}
      <IconArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
      <ActionChip action={rule.action} />
    </div>
  )
}
