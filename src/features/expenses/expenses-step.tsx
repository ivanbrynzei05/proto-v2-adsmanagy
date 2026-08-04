import {
  IconCoins,
  IconInfoCircle,
  IconPercentage,
  type Icon as TablerIcon,
} from "@tabler/icons-react"

import { useIntegrations } from "@/components/integrations-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExpenseFieldsGrid } from "@/features/expenses/expense-fields"
import {
  BUYOUT_EXPENSE_FIELDS,
  ORDER_EXPENSE_FIELDS,
  type ExpenseField,
} from "@/features/expenses/types"
import { CallCentersStep } from "@/features/integrations/call-centers-step"
import { cn } from "@/lib/utils"

// One heading plus the expenses under it, framed like the CRM and call-centre
// blocks so every setup step reads the same way. Each tile already says whether
// its value is in, so the heading stays a heading.
function ExpenseGroup({
  icon: Icon,
  title,
  fields,
  animate,
  delay,
}: {
  icon: TablerIcon
  title: string
  fields: ExpenseField[]
  animate: boolean
  delay: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5",
        animate && "animate-in duration-300 fade-in slide-in-from-right-8"
      )}
      style={
        animate
          ? { animationDelay: delay, animationFillMode: "both" }
          : undefined
      }
    >
      <div className="flex items-center gap-3 border-b pb-3">
        <Icon className="size-7 text-muted-foreground" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <ExpenseFieldsGrid fields={fields} className="mt-3" />
    </div>
  )
}

export function ExpensesStep({ animate = true }: { animate?: boolean }) {
  const { callCenters, setCallCenters } = useIntegrations()

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
          Вкажіть, у що вам обходиться замовлення - упаковка, повернення та
          робота колцентру.
        </AlertDescription>
      </Alert>
      <ExpenseGroup
        icon={IconCoins}
        title="Витрати на замовлення"
        fields={ORDER_EXPENSE_FIELDS}
        animate={animate}
        delay="75ms"
      />
      <ExpenseGroup
        icon={IconPercentage}
        title="Розрахунок % викупу"
        fields={BUYOUT_EXPENSE_FIELDS}
        animate={animate}
        delay="150ms"
      />
      {/* call centres are an expense too, so they're settled here rather than
          in a step of their own */}
      <div
        className={cn(
          animate && "animate-in duration-300 fade-in slide-in-from-right-8"
        )}
        style={
          animate
            ? { animationDelay: "225ms", animationFillMode: "both" }
            : undefined
        }
      >
        <CallCentersStep
          callCenters={callCenters}
          setCallCenters={setCallCenters}
          animate={false}
          showHint={false}
        />
      </div>
    </div>
  )
}
