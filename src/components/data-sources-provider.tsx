/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

export type DataSource = "crm" | "callCenter" | "adAccounts"

export type DataSourcesState = Record<DataSource, boolean>

type DataSourcesContextValue = {
  sources: DataSourcesState
  toggleSource: (source: DataSource) => void
}

const STORAGE_KEY = "data-sources"

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

export function DataSourcesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sources, setSources] = React.useState<DataSourcesState>(() =>
    readStoredState()
  )

  const toggleSource = React.useCallback((source: DataSource) => {
    setSources((prev) => {
      const next = { ...prev, [source]: !prev[source] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = React.useMemo(
    () => ({ sources, toggleSource }),
    [sources, toggleSource]
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
