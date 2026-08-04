/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import {
  DEFAULT_EXPENSE_SETTINGS,
  type ExpenseSettings,
} from "@/features/expenses/types"

type ExpensesContextValue = {
  expenses: ExpenseSettings
  setExpense: (key: keyof ExpenseSettings, value: string) => void
}

const STORAGE_KEY = "expenses"

const ExpensesContext = React.createContext<ExpensesContextValue | undefined>(
  undefined
)

function readStoredState(): ExpenseSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_EXPENSE_SETTINGS

    const parsed = JSON.parse(raw) as Partial<ExpenseSettings>
    return { ...DEFAULT_EXPENSE_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_EXPENSE_SETTINGS
  }
}

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] =
    React.useState<ExpenseSettings>(readStoredState)

  const setExpense = React.useCallback(
    (key: keyof ExpenseSettings, value: string) => {
      setExpenses((prev) => {
        const next = { ...prev, [key]: value }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const value = React.useMemo(
    () => ({ expenses, setExpense }),
    [expenses, setExpense]
  )

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const context = React.useContext(ExpensesContext)

  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpensesProvider")
  }

  return context
}
