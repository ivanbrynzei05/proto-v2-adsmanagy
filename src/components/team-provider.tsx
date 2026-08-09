/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import { DEFAULT_MEMBERS, type TeamMember } from "@/features/team/types"

type TeamContextValue = {
  members: TeamMember[]
  setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>
}

// Versioned: the member shape changed, so older saves are dropped rather than
// migrated - it is demo data either way.
const STORAGE_KEY = "team.v3"

const TeamContext = React.createContext<TeamContextValue | undefined>(undefined)

function readStoredMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MEMBERS

    const parsed = JSON.parse(raw) as TeamMember[]
    return Array.isArray(parsed) ? parsed : DEFAULT_MEMBERS
  } catch {
    return DEFAULT_MEMBERS
  }
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = React.useState<TeamMember[]>(readStoredMembers)

  React.useEffect(() => {
    // Passwords never land here - the dialog hands one over once and the
    // prototype keeps only the profile.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
  }, [members])

  const value = React.useMemo(() => ({ members, setMembers }), [members])

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const context = React.useContext(TeamContext)

  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider")
  }

  return context
}
