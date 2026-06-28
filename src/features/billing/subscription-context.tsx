/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import { SCENARIOS, type Scenario, type SubState } from "./subscription-state"

// Shared subscription state for the prototype. Lets the settings screen and the
// header billing chip read the same lifecycle state, so flipping a demo scenario
// updates the whole app at once. (Sync is intentionally light — it's a demo.)
type SubscriptionContextValue = {
  scenarioId: Scenario["id"]
  state: SubState
  // Account balance the plan + add-ons are charged against (static in the demo).
  balance: number
  setState: React.Dispatch<React.SetStateAction<SubState>>
  pickScenario: (scenario: Scenario) => void
}

// Land on the "healthy" active state so the header chip looks normal by default;
// the floating switcher lets you explore every other lifecycle state.
const DEFAULT_SCENARIO =
  SCENARIOS.find((s) => s.id === "active-monthly") ?? SCENARIOS[0]

const SubscriptionContext = React.createContext<
  SubscriptionContextValue | undefined
>(undefined)

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [scenarioId, setScenarioId] = React.useState<Scenario["id"]>(
    DEFAULT_SCENARIO.id
  )
  const [state, setState] = React.useState<SubState>(() =>
    DEFAULT_SCENARIO.make()
  )

  const pickScenario = React.useCallback((scenario: Scenario) => {
    setScenarioId(scenario.id)
    setState(scenario.make())
  }, [])

  const value = React.useMemo(
    () => ({ scenarioId, state, balance: 85, setState, pickScenario }),
    [scenarioId, state, pickScenario]
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = React.useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider")
  }
  return ctx
}
