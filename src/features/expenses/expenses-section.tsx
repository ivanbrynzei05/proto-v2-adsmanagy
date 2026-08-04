import { IconHeadset } from "@tabler/icons-react"

import { useIntegrations } from "@/components/integrations-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ExpenseFieldsGrid } from "@/features/expenses/expense-fields"
import {
  BUYOUT_EXPENSE_FIELDS,
  ORDER_EXPENSE_FIELDS,
} from "@/features/expenses/types"
import { CallCentersStep } from "@/features/integrations/call-centers-step"

export function ExpensesSection() {
  const { callCenters, setCallCenters } = useIntegrations()

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            Витрати на замовлення
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseFieldsGrid fields={ORDER_EXPENSE_FIELDS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-[15px] font-bold tracking-tight">
            Розрахунок % викупу
          </CardTitle>
          <CardDescription className="text-xs">
            Поки в товару мало завершених замовлень, аналітика рахує викуп за
            вашим стартовим значенням - і перемикається на фактичне, коли
            статистики стане достатньо
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseFieldsGrid fields={BUYOUT_EXPENSE_FIELDS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <IconHeadset className="size-4 text-muted-foreground" />
            <CardTitle className="text-[15px] font-bold tracking-tight">
              Колцентри
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Оплата за підтверджене замовлення і відсоток за допродаж - це теж
            витрата, тому вона враховується разом з рештою
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CallCentersStep
            callCenters={callCenters}
            setCallCenters={setCallCenters}
            animate={false}
            showHint={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
