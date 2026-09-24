import {
  IconBan,
  IconHelpCircle,
  IconMessageCircle,
  IconMoodSad,
  IconMoodSmile,
  IconShoppingBag,
  type Icon,
} from "@tabler/icons-react"

import { ADS, parseProductId, type Row } from "@/pages/campaigns/data"

// Comments under the Facebook ads - dark posts included, which never show up
// in the Page's own feed. The prototype browses them ad by ad, tells what kind
// each one is, and does the two things a Page can do to someone else's comment
// here: hide it or delete it.

export type CommentCategory =
  | "question"
  | "order"
  | "negative"
  | "positive"
  | "spam"
  | "other"

export const CATEGORIES: {
  id: CommentCategory
  label: string
  icon: Icon
  tone: string
}[] = [
  {
    id: "question",
    label: "Питання",
    icon: IconHelpCircle,
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "order",
    label: "Замовлення",
    icon: IconShoppingBag,
    tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "negative",
    label: "Негатив",
    icon: IconMoodSad,
    tone: "bg-destructive/10 text-destructive",
  },
  {
    id: "positive",
    label: "Позитив",
    icon: IconMoodSmile,
    tone: "bg-violet-500/12 text-violet-700 dark:text-violet-400",
  },
  {
    id: "spam",
    label: "Спам",
    icon: IconBan,
    tone: "bg-muted text-muted-foreground",
  },
  {
    id: "other",
    label: "Інше",
    icon: IconMessageCircle,
    tone: "bg-muted text-muted-foreground",
  },
]

export function categoryInfo(id: CommentCategory) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

export type FbComment = {
  id: string
  /** index into ADS - the ad the comment sits under */
  ad: number
  author: string
  text: string
  at: Date
  category: CommentCategory
  /** still visible to the author and their friends, to nobody else */
  hidden: boolean
}

export function adOf(c: FbComment): Row {
  return ADS[c.ad]
}

// "1042 - Широка аудиторія · Відео 15с" → "Широка аудиторія · Відео 15с"
export function adTitle(row: Row) {
  return parseProductId(row.name).rest
}

// campaign names without the product id they start with
export function campaignLabel(name: string) {
  return parseProductId(name).rest
}

// Facebook ads under their campaigns, in table order - what the comments are
// browsed by
export const FB_AD_GROUPS: { campaign: string; ads: number[] }[] = (() => {
  const map = new Map<string, number[]>()
  ADS.forEach((a, i) => {
    if (a.platform !== "facebook" || !a.campaign) return
    const list = map.get(a.campaign)
    if (list) list.push(i)
    else map.set(a.campaign, [i])
  })
  return Array.from(map, ([campaign, ads]) => ({ campaign, ads }))
})()

// FB-style short age: "щойно", "12 хв", "3 год", "2 дн"
export function ago(d: Date) {
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  if (m < 1) return "щойно"
  if (m < 60) return m + " хв"
  const h = Math.floor(m / 60)
  if (h < 24) return h + " год"
  return Math.floor(h / 24) + " дн"
}

// a steady avatar tint per person, so a long list isn't one grey column
const AVATAR_TONES = [
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
]

export function avatarTone(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

// ---- demo data ----
// A few hundred comments, so the paging and the per-ad counts have something
// to cut through. Seeded, so every load shows the same inbox.

const FIRST_NAMES = [
  "Олена",
  "Ірина",
  "Тетяна",
  "Наталія",
  "Марина",
  "Юлія",
  "Оксана",
  "Людмила",
  "Катерина",
  "Анна",
  "Галина",
  "Світлана",
  "Вікторія",
  "Дарина",
  "Андрій",
  "Сергій",
  "Ігор",
  "Роман",
  "Олексій",
  "Віктор",
  "Василь",
  "Тарас",
  "Максим",
  "Дмитро",
  "Олег",
  "Богдан",
]

const LAST_NAMES = [
  "Коваленко",
  "Шевченко",
  "Бондаренко",
  "Ткаченко",
  "Кравченко",
  "Олійник",
  "Мельник",
  "Поліщук",
  "Остапчук",
  "Гаврилюк",
  "Лисенко",
  "Павленко",
  "Руденко",
  "Марченко",
  "Мороз",
  "Бойко",
  "Гончаренко",
  "Власенко",
  "Кучер",
  "Левченко",
  "Ковальчук",
  "Романюк",
]

const BOTS = [
  "Заробіток Онлайн",
  "Crypto Invest UA",
  "Марія Підробіток",
  "Бонус Дня",
  "Кредит Швидко",
  "Ads Accounts Shop",
]

const TEXTS: Record<CommentCategory, string[]> = {
  question: [
    "Ціна?",
    "Скільки коштує?",
    "Яка ціна з доставкою?",
    "Скільки йде доставка у Львів?",
    "Доставка в Одесу є?",
    "Оплата при отриманні можлива?",
    "А гарантія яка?",
    "Можна оглянути на пошті перед оплатою?",
    "Є інші кольори?",
    "Коли знову буде в наявності?",
    "Скільки часу працює від зарядки?",
    "А на два товари знижка є?",
    "Підійде як подарунок? Є коробка?",
    "Відправляєте в село Укрпоштою?",
  ],
  order: [
    "Хочу замовити, напишіть мені в особисті",
    "Беру два, як оформити?",
    "Замовляю, передзвоніть",
    "Хочу один, як замовити?",
    "Оформіть мені, будь ласка",
    "Беру! Куди писати?",
    "Мені теж один",
  ],
  negative: [
    "Замовляла місяць тому - вже не працює",
    "Прийшло не те, що на відео",
    "На дзвінки не відповідаєте!",
    "На Розетці такий самий дешевше",
    "Якість жахлива, не раджу",
    "Чекаю посилку вже два тижні",
    "Це розвод, не ведіться",
    "Повернення так і не оформили",
    "В Китаї такий коштує втричі дешевше",
    "Через тиждень зламався",
  ],
  positive: [
    "Купила мамі - дуже задоволена!",
    "Користуюсь місяць, усе супер 👍",
    "Прийшло швидко, якість нормальна",
    "Рекомендую, корисна річ",
    "Дякую, все працює!",
    "Брала собі й сестрі - обидві задоволені",
    "Найкраща покупка цього року 😍",
  ],
  spam: [
    "Заробляй від 3000 грн на день з телефону 💰 Пиши в телеграм",
    "Інвестуй у крипту - 30% на місяць! Деталі в профілі",
    "Хто хоче підробіток - пишіть у телеграм",
    "Перейди за посиланням і забери бонус 🎁",
    "Швидкі кредити без довідок - пиши в особисті",
    "Продам рекламні акаунти, недорого",
  ],
  other: [
    "@{friend} дивись, ти ж хотіла",
    "@{friend} глянь 👀",
    "😂😂😂",
    "👍",
    "@{friend} тобі треба",
    "Цікаво 🤔",
  ],
}

// how the comments split by kind - the pricier products and the clearance
// campaign draw noticeably more complaints
const CALM: [CommentCategory, number][] = [
  ["question", 34],
  ["order", 12],
  ["positive", 22],
  ["negative", 12],
  ["spam", 10],
  ["other", 10],
]
const TENSE: [CommentCategory, number][] = [
  ["question", 30],
  ["order", 10],
  ["positive", 14],
  ["negative", 26],
  ["spam", 10],
  ["other", 10],
]
const TENSE_CAMPAIGNS = new Set([
  "2087 - CleanMax X9 | FB ретаргет",
  "4120 - Смарт-годинник FitWatch 7",
  "Розпродаж тижня - мікс товарів",
])

const DAYS = 14

// mulberry32 - a tiny seeded generator
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function weighted(weights: [CommentCategory, number][], r: number) {
  let x = r * weights.reduce((sum, [, w]) => sum + w, 0)
  for (const [category, w] of weights) if ((x -= w) < 0) return category
  return weights[weights.length - 1][0]
}

export function demoComments(): FbComment[] {
  const rand = rng(24092026)
  function pick<T>(list: T[]) {
    return list[Math.floor(rand() * list.length)]
  }
  function person() {
    return pick(FIRST_NAMES) + " " + pick(LAST_NAMES)
  }

  const out: FbComment[] = []
  for (const group of FB_AD_GROUPS) {
    const weights = TENSE_CAMPAIGNS.has(group.campaign) ? TENSE : CALM
    for (const ad of group.ads) {
      // busier ads collect more comments
      const n = Math.max(4, Math.round(ADS[ad].spend / 600))
      for (let k = 0; k < n; k++) {
        const category = weighted(weights, rand())
        // most of it recent, with a tail two weeks long
        const minutes = Math.floor(rand() ** 2 * DAYS * 1440) + 2
        out.push({
          id: "c" + out.length,
          ad,
          author: category === "spam" ? pick(BOTS) : person(),
          text: pick(TEXTS[category]).replace("{friend}", person()),
          at: new Date(Date.now() - minutes * 60_000),
          category,
          // what was moderated before: most of the spam, some complaints
          hidden:
            (category === "spam" && rand() < 0.7) ||
            (category === "negative" && rand() < 0.2),
        })
      }
    }
  }
  return out
}
