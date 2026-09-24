/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import { demoComments, type FbComment } from "@/features/comments/types"

// Both take a batch - one comment from its row, a page of them from the
// selection.
type CommentsContextValue = {
  comments: FbComment[]
  setHidden: (ids: string[], hidden: boolean) => void
  remove: (ids: string[]) => void
}

const CommentsContext = React.createContext<CommentsContextValue | undefined>(
  undefined
)

// A prototype: the comments are demo data that lives for the session, so a
// hide or a delete survives moving between pages and nothing more.
export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const [comments, setComments] = React.useState<FbComment[]>(demoComments)

  const setHidden = React.useCallback((ids: string[], hidden: boolean) => {
    const set = new Set(ids)
    setComments((list) =>
      list.map((c) => (set.has(c.id) ? { ...c, hidden } : c))
    )
  }, [])

  const remove = React.useCallback((ids: string[]) => {
    const set = new Set(ids)
    setComments((list) => list.filter((c) => !set.has(c.id)))
  }, [])

  const value = React.useMemo(
    () => ({ comments, setHidden, remove }),
    [comments, setHidden, remove]
  )

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  )
}

export function useComments() {
  const context = React.useContext(CommentsContext)

  if (context === undefined) {
    throw new Error("useComments must be used within a CommentsProvider")
  }

  return context
}
