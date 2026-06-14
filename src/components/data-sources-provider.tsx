/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

export type DataSource = "crm" | "callCenter" | "adAccounts"

export type DataSourcesState = Record<DataSource, boolean>

type DataSourcesContextValue = {
  sources: DataSourcesState
  toggleSource: (source: DataSource) => void
  noPlan: boolean
  toggleNoPlan: () => void
}

const STORAGE_KEY = "data-sources"
const NO_PLAN_KEY = "data-sources-no-plan"

// New users start with nothing connected.
const DEFAULT_STATE: DataSourcesState = {
  crm: false,
  callCenter: false,
  adAccounts: false,
}

const DataSourcesContext = React.createContext<
  DataSourcesContextValue | undefined
>(undefined)

function readStoredState(): DataSourcesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE

    const parsed = JSON.parse(raw) as Partial<DataSourcesState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return DEFAULT_STATE
  }
}

function readStoredNoPlan(): boolean {
  try {
    return localStorage.getItem(NO_PLAN_KEY) === "true"
  } catch {
    return false
  }
}

export function DataSourcesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sources, setSources] = React.useState<DataSourcesState>(() =>
    readStoredState()
  )
  const [noPlan, setNoPlan] = React.useState<boolean>(() => readStoredNoPlan())

  const toggleSource = React.useCallback((source: DataSource) => {
    setSources((prev) => {
      const next = { ...prev, [source]: !prev[source] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const toggleNoPlan = React.useCallback(() => {
    setNoPlan((prev) => {
      const next = !prev
      localStorage.setItem(NO_PLAN_KEY, String(next))
      return next
    })
  }, [])

  const value = React.useMemo(
    () => ({ sources, toggleSource, noPlan, toggleNoPlan }),
    [sources, toggleSource, noPlan, toggleNoPlan]
  )

  return (
    <DataSourcesContext.Provider value={value}>
      {children}
    </DataSourcesContext.Provider>
  )
}

export function useDataSources() {
  const context = React.useContext(DataSourcesContext)

  if (context === undefined) {
    throw new Error("useDataSources must be used within a DataSourcesProvider")
  }

  return context
}
