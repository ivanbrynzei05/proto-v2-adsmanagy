/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import {
  DEMO_RULES,
  demoLog,
  type Rule,
  type RuleLogEntry,
} from "@/features/rules/types"

type RulesContextValue = {
  rules: Rule[]
  log: RuleLogEntry[]
  /** adds a new rule on top, or replaces the one with the same id */
  saveRule: (rule: Rule) => void
  removeRule: (id: string) => void
  setEnabled: (id: string, enabled: boolean) => void
}

const RulesContext = React.createContext<RulesContextValue | undefined>(
  undefined
)

// Shared by the rules page and the campaigns table, which creates rules for the
// rows picked in it. A prototype: the state lives for the session only, and the
// journal is the demo history - saved rules don't fire.
export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = React.useState<Rule[]>(DEMO_RULES)
  const [log] = React.useState<RuleLogEntry[]>(demoLog)

  const saveRule = React.useCallback((rule: Rule) => {
    setRules((prev) =>
      prev.some((r) => r.id === rule.id)
        ? prev.map((r) => (r.id === rule.id ? rule : r))
        : [rule, ...prev]
    )
  }, [])

  const removeRule = React.useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const setEnabled = React.useCallback((id: string, enabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)))
  }, [])

  const value = React.useMemo(
    () => ({ rules, log, saveRule, removeRule, setEnabled }),
    [rules, log, saveRule, removeRule, setEnabled]
  )

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>
}

export function useRules() {
  const context = React.useContext(RulesContext)

  if (context === undefined) {
    throw new Error("useRules must be used within a RulesProvider")
  }

  return context
}
