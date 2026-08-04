// Date helpers shared by the campaigns date picker (desktop popover + the
// mobile filter sheet). Kept apart from the components so both can import them.

// ---- date-range picker (calendar, "від - до") ----
export type DateRange = { from: Date; to: Date }

export const UA_MONTHS = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
]
export const UA_MONTHS_SHORT = [
  "січ",
  "лют",
  "бер",
  "кві",
  "тра",
  "чер",
  "лип",
  "сер",
  "вер",
  "жов",
  "лис",
  "гру",
]
export const UA_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
// earliest selectable day - the window is limited to the last 1.5 months
export const DATE_WINDOW_DAYS = 45

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export function addDays(d: Date, n: number) {
  const x = startOfDay(d)
  x.setDate(x.getDate() + n)
  return x
}
export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
export function fmtDay(d: Date, withYear = false) {
  return (
    `${d.getDate()} ${UA_MONTHS_SHORT[d.getMonth()]}` +
    (withYear ? ` ${d.getFullYear()}` : "")
  )
}
// The named ranges offered everywhere a period is picked - the popover's quick
// list, the mobile period select, and the label lookup below.
export function datePresets(
  today: Date
): { label: string; range: DateRange }[] {
  const day = (n: number) => addDays(today, n)
  return [
    { label: "Сьогодні", range: { from: today, to: today } },
    { label: "Вчора", range: { from: day(-1), to: day(-1) } },
    { label: "Останні 7 днів", range: { from: day(-6), to: today } },
    { label: "Останні 30 днів", range: { from: day(-29), to: today } },
    { label: "Макс.", range: { from: day(-DATE_WINDOW_DAYS), to: today } },
  ]
}

// Trigger / footer label: ranges that match a preset show the preset's name; a
// lone day collapses to its date; anything else reads "від - до".
export function rangeLabel(r: DateRange, today: Date) {
  for (const { label, range } of datePresets(today)) {
    if (sameDay(r.from, range.from) && sameDay(r.to, range.to)) return label
  }
  if (sameDay(r.from, r.to)) return fmtDay(r.from, true)
  return `${fmtDay(r.from)} – ${fmtDay(r.to, true)}`
}
