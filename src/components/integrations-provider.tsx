/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import {
  MOCK_AD_ACCOUNTS,
  type AdAccount,
  type AdPlatform,
  type CallCenter,
  type ConnectedAdAccounts,
  type ConnectedCrm,
} from "@/features/integrations/types"

type IntegrationsContextValue = {
  connectedAccounts: ConnectedAdAccounts
  setConnectedAccounts: React.Dispatch<
    React.SetStateAction<ConnectedAdAccounts>
  >
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

// Call centres used to hold a single office number; saves from back then are
// lifted into the list shape rather than dropped, so a demo keeps its data.
type StoredCallCenter = Omit<CallCenter, "offices"> & {
  offices?: string[]
  office?: string
}

// Cabinets used to be stored flat, one entry per cabinet, before they were
// grouped under the account they were connected through. Such a save is
// regrouped through the catalogue - every connection comes out of it - so an
// older demo keeps its cabinets and their switches.
type StoredCabinet = { accountId: string; enabled?: boolean }

// A save only holds what the catalogue said the day it was made: an account
// connected before "who added it", the locked-cabinet state, or a cabinet the
// login has since been given comes back without them. All of that belongs to
// the platform rather than to the user, so the account is rebuilt from the
// catalogue on every load and only what the user did here - the names they
// gave, the switches they set - is carried over onto it.
function refreshFromCatalogue(
  platform: AdPlatform["name"],
  account: AdAccount
): AdAccount {
  const known = MOCK_AD_ACCOUNTS[platform]?.find(
    (a) => a.owner === account.owner
  )
  if (!known) return account

  const saved = new Map(account.cabinets.map((c) => [c.cabinetId, c]))

  return {
    ...known,
    ...account,
    connectedBy: account.connectedBy ?? known.connectedBy,
    cabinets: known.cabinets.map((source) => {
      const mine = saved.get(source.cabinetId)
      return mine
        ? { ...source, label: mine.label, enabled: mine.enabled }
        : source
    }),
  }
}

function restoreAccounts(
  stored: Partial<Record<AdPlatform["name"], (AdAccount | StoredCabinet)[]>>
): ConnectedAdAccounts {
  const entries = Object.entries(stored) as [
    AdPlatform["name"],
    (AdAccount | StoredCabinet)[] | undefined,
  ][]
  const restored: ConnectedAdAccounts = {}

  for (const [platform, saved] of entries) {
    const accounts: AdAccount[] = []

    for (const entry of saved ?? []) {
      if ("cabinets" in entry) {
        accounts.push(refreshFromCatalogue(platform, entry))
        continue
      }
      const known = MOCK_AD_ACCOUNTS[platform]?.find((a) =>
        a.cabinets.some((c) => c.cabinetId === entry.accountId)
      )
      const cabinet = known?.cabinets.find(
        (c) => c.cabinetId === entry.accountId
      )
      if (!known || !cabinet) continue

      let account = accounts.find((a) => a.owner === known.owner)
      if (!account) {
        account = { ...known, cabinets: [] }
        accounts.push(account)
      }
      account.cabinets.push({ ...cabinet, enabled: entry.enabled })
    }

    if (accounts.length > 0) restored[platform] = accounts
  }

  return restored
}

function readStoredState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE

    const parsed = JSON.parse(raw) as Partial<
      Omit<StoredState, "callCenters">
    > & {
      callCenters?: StoredCallCenter[]
    }
    const storedCallCenters: StoredCallCenter[] = parsed.callCenters ?? []

    return {
      ...DEFAULT_STATE,
      ...parsed,
      connectedAccounts: restoreAccounts(parsed.connectedAccounts ?? {}),
      callCenters: storedCallCenters.map(({ office, ...cc }) => ({
        ...cc,
        offices: cc.offices ?? (office ? [office] : []),
      })),
    }
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
    throw new Error(
      "useIntegrations must be used within an IntegrationsProvider"
    )
  }

  return context
}
