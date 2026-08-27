/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState } from "react"

// What one row of a metrics table is worth in pixels - text-xs on a 16px line
// with py-2 either side. It is only the opening guess: the first row that
// actually draws is measured, so a row that lands a pixel taller does not walk
// the list out of place.
const ROW_HEIGHT = 33
// rows kept above and below the window, so a flick of the wheel never lands on
// a blank strip before the next render catches up
const OVERSCAN = 8
// how tall the scroller opens: past this many rows the table scrolls inside the
// card instead of growing the page
const ROWS_IN_VIEW = 14
export const TABLE_MAX_H = "max-h-[520px]"

/**
 * Keeps only the rows on screen in the DOM.
 *
 * An account can run thousands of products or campaigns over a long period,
 * and a table that renders all of them costs a second of layout on every
 * report. This one renders the window the scroller sits over and stands the
 * rest of the list up as two blank rows, so the scrollbar still measures the
 * whole thing.
 *
 * Every row has to be the same height for the count to hold - which is why the
 * cells are single-line and the badges inside them are capped.
 */
export function useVirtualRows<T>(rows: T[]) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const [rowHeight, setRowHeight] = useState(ROW_HEIGHT)
  const [view, setView] = useState({ start: 0, end: ROWS_IN_VIEW + OVERSCAN })

  useEffect(() => {
    if (!scroller) return
    const measure = () => {
      const first = Math.floor(scroller.scrollTop / rowHeight)
      const fits = Math.ceil(scroller.clientHeight / rowHeight)
      const next = {
        start: Math.max(0, first - OVERSCAN),
        end: first + fits + OVERSCAN,
      }
      setView((prev) =>
        prev.start === next.start && prev.end === next.end ? prev : next
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    scroller.addEventListener("scroll", measure, { passive: true })
    return () => {
      observer.disconnect()
      scroller.removeEventListener("scroll", measure)
    }
  }, [scroller, rowHeight])

  // a new report is a new list, and a list is read from the top
  useEffect(() => {
    scroller?.scrollTo({ top: 0 })
  }, [scroller, rows])

  // the drawn row is what the spacers are counted in, not the guess above
  const onFirstRow = useCallback((node: HTMLTableRowElement | null) => {
    const height = node?.getBoundingClientRect().height
    if (!height) return
    setRowHeight((prev) => (Math.abs(prev - height) > 0.5 ? height : prev))
  }, [])

  const start = Math.min(view.start, Math.max(0, rows.length - 1))
  const end = Math.min(rows.length, Math.max(view.end, start + 1))

  return {
    /** goes on the scrolling element the table sits in */
    onScroller: setScroller,
    /** goes on the first row of the window */
    onFirstRow,
    rows: rows.slice(start, end),
    padTop: start * rowHeight,
    padBottom: Math.max(0, (rows.length - end) * rowHeight),
  }
}

/**
 * The rows outside the window, as one blank row of their combined height -
 * what holds the scrollbar to the length of the whole list.
 */
export function RowSpacer({ height, span }: { height: number; span: number }) {
  if (height <= 0) return null
  return (
    <tr aria-hidden>
      <td colSpan={span} className="border-0 p-0" style={{ height }} />
    </tr>
  )
}
