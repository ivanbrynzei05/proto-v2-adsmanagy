/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import {
  DEFAULT_CURRENCY_SETTINGS,
  displayCurrency,
  type CurrencySettings,
  type DisplayCurrency,
} from "@/features/currency/types"

type CurrencyContextValue = {
  settings: CurrencySettings
  setSetting: <K extends keyof CurrencySettings>(
    key: K,
    value: CurrencySettings[K]
  ) => void
  /** the resolved currency the tables format money with */
  currency: DisplayCurrency
}

const STORAGE_KEY = "currency"

const CurrencyContext = React.createContext<CurrencyContextValue | undefined>(
  undefined
)

function readStoredState(): CurrencySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CURRENCY_SETTINGS

    const parsed = JSON.parse(raw) as Partial<CurrencySettings>
    return { ...DEFAULT_CURRENCY_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_CURRENCY_SETTINGS
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] =
    React.useState<CurrencySettings>(readStoredState)

  const setSetting = React.useCallback(
    <K extends keyof CurrencySettings>(key: K, value: CurrencySettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const value = React.useMemo(
    () => ({ settings, setSetting, currency: displayCurrency(settings) }),
    [settings, setSetting]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = React.useContext(CurrencyContext)

  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }

  return context
}
