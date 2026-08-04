import {
  IconArrowBackUp,
  IconPackage,
  IconPercentage,
  IconTargetArrow,
  type Icon as TablerIcon,
} from "@tabler/icons-react"

// Everything the analytics needs to turn a raw order into a margin figure.
// Kept as strings because these are all free-text inputs in a prototype - the
// formatting happens where they're displayed.
export type ExpenseSettings = {
  // Fixed cost of packing one order.
  packagingPrice: string
  // What a single return costs us: shipping both ways, handling, repacking.
  returnPrice: string
  // Buyout % assumed while a product has no statistics of its own yet.
  startingBuyoutPercent: string
  // How many completed orders a product needs before we switch from the
  // assumed % above to its own measured buyout rate.
  buyoutThresholdOrders: string
}

export const DEFAULT_EXPENSE_SETTINGS: ExpenseSettings = {
  packagingPrice: "",
  returnPrice: "",
  startingBuyoutPercent: "70",
  buyoutThresholdOrders: "30",
}

// How one expense introduces itself: the icon and wording on its tile, plus the
// unit its value is read in. Shared by the settings page and the setup step, so
// a field is described in exactly one place.
export type ExpenseField = {
  key: keyof ExpenseSettings
  icon: TablerIcon
  label: string
  note: string
  hint: string
  // Unit welded to the right of the value, both on the tile and in the dialog.
  suffix: string
  placeholder: string
}

export const ORDER_EXPENSE_FIELDS: ExpenseField[] = [
  {
    key: "packagingPrice",
    icon: IconPackage,
    label: "Упаковка",
    note: "Фіксована ціна за 1 запаковане замовлення",
    hint: "Скільки коштує запакувати одне замовлення. Враховується по кожному запакованому замовленню.",
    suffix: "₴ / замовлення",
    placeholder: "Вкажіть суму",
  },
  {
    key: "returnPrice",
    icon: IconArrowBackUp,
    label: "Базова ціна повернення",
    note: "Скільки коштує одне повернення",
    hint: "Вартість одного повернення. Застосовується до кожного повернутого замовлення.",
    suffix: "₴ / повернення",
    placeholder: "Вкажіть суму",
  },
]

export const BUYOUT_EXPENSE_FIELDS: ExpenseField[] = [
  {
    key: "startingBuyoutPercent",
    icon: IconPercentage,
    label: "Стартовий % викупу",
    note: "Показуємо, поки немає точного викупу",
    hint: "Товар щойно запустився і ще не має власної статистики. До набору порогу аналітика підставляє цей відсоток, щоб прогноз маржі не був порожнім.",
    suffix: "%",
    placeholder: "Вкажіть відсоток",
  },
  {
    key: "buyoutThresholdOrders",
    icon: IconTargetArrow,
    label: "Поріг переходу на фактичний %",
    note: "Після цієї кількості рахуємо фактичний викуп",
    hint: "Скільки завершених замовлень має набрати товар, щоб аналітика перестала використовувати стартовий відсоток і почала рахувати його власний фактичний викуп.",
    suffix: "замовлень",
    placeholder: "Вкажіть кількість",
  },
]

// The setup step counts as done only once every value is in - a half-filled
// list still leaves the margin unpriced.
export const hasAllExpenses = (expenses: ExpenseSettings) =>
  Object.values(expenses).every((value) => value.trim() !== "")
