// The page a long list is cut to - a list shows one page, never everything.
// Pages are zero-based; a page left past the end by a shrinking list folds
// back onto the last one that still exists.
export function pageOf<T>(items: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, pageCount - 1)
  return {
    items: items.slice(current * size, (current + 1) * size),
    page: current,
    pageCount,
  }
}
