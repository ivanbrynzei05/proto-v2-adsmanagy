import { useState } from "react"

import { EMPTY_FILTERS, sameFilters, type ReportFilters } from "./data"

/**
 * The filters as they are being ticked, before the report is asked to redraw.
 *
 * A report can run to a couple of thousand products over three years, and every
 * tick used to rebuild it - so the panel now edits a draft of its own and
 * Застосувати is what hands it over. Everything that narrows the report goes
 * through here; the period does not, because it is not one of the filters.
 *
 * A set applied somewhere else - the sheet on a phone, a reset on the page - is
 * the draft's new starting point, so the two can never drift apart.
 */
export function useDraftFilters(
  applied: ReportFilters,
  onApply: (next: ReportFilters) => void
) {
  const [draft, setDraft] = useState(applied)
  // adjusting state to a prop the way React asks for it: compared during the
  // render and corrected before paint, rather than shown stale and fixed in an
  // effect
  const [seen, setSeen] = useState(applied)
  if (seen !== applied) {
    setSeen(applied)
    setDraft(applied)
  }

  return {
    draft,
    setDraft,
    /** whether the draft says anything the report is not already built from */
    dirty: !sameFilters(draft, applied),
    apply: () => onApply(draft),
    /** the panel's "Скинути все" - empties the draft, applies nothing */
    clear: () => setDraft(EMPTY_FILTERS),
    /** back to what the report is actually built from */
    revert: () => setDraft(applied),
  }
}
