/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import type {
  CallCenter,
  ConnectedAdAccounts,
  ConnectedCrm,
} from "@/features/integrations/types"

type IntegrationsContextValue = {
  connectedAccounts: ConnectedAdAccounts
  setConnectedAccounts: React.Dispatch<React.SetStateAction<ConnectedAdAccounts>>
  connectedCrms: ConnectedCrm[]
  setConnectedCrms: React.Dispatch<React.SetStateAction<ConnectedCrm[]>>
  callCenters: CallCenter[]
  setCallCenters: React.Dispatch<React.SetStateAction<CallCenter[]>>
}

const STORAGE_KEY = "integrations"

type StoredState = {
  connectedAccounts: ConnectedAdAccounts
  connectedCrms: ConnectedCrm[]
  callCenters: CallCenter[]
}

const DEFAULT_STATE: StoredState = {
  connectedAccounts: {},
  connectedCrms: [],
  callCenters: [],
}

const IntegrationsContext = React.createContext<
  IntegrationsContextValue | undefined
>(undefined)

function readStoredState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE

    const parsed = JSON.parse(raw) as Partial<StoredState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return DEFAULT_STATE
  }
}

export function IntegrationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [connectedAccounts, setConnectedAccounts] =
    React.useState<ConnectedAdAccounts>(
      () => readStoredState().connectedAccounts
    )
  const [connectedCrms, setConnectedCrms] = React.useState<ConnectedCrm[]>(
    () => readStoredState().connectedCrms
  )
  const [callCenters, setCallCenters] = React.useState<CallCenter[]>(
    () => readStoredState().callCenters
  )

  React.useEffect(() => {
    const state: StoredState = { connectedAccounts, connectedCrms, callCenters }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [connectedAccounts, connectedCrms, callCenters])

  const value = React.useMemo(
    () => ({
      connectedAccounts,
      setConnectedAccounts,
      connectedCrms,
      setConnectedCrms,
      callCenters,
      setCallCenters,
    }),
    [connectedAccounts, connectedCrms, callCenters]
  )

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  )
}

export function useIntegrations() {
  const context = React.useContext(IntegrationsContext)

  if (context === undefined) {
    throw new Error("useIntegrations must be used within an IntegrationsProvider")
  }

  return context
}
