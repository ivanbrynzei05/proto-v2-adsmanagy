import {
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconCreditCard,
  IconHelpCircle,
  IconLink,
  IconMail,
  IconMoodPuzzled,
  IconPlugConnected,
  IconRocket,
  IconSearch,
  type Icon,
} from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Question = {
  id: string
  question: string
  answer: ReactNode
}

type Topic = {
  id: string
  label: string
  icon: Icon
  questions: Question[]
}

const QUESTION_PATH = "/help/faq"
const QUESTION_PARAM = "q"
const TOPIC_PARAM = "topic"

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-foreground">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

// Placeholder copy - sections are final, answers are filler until the real
// wording arrives.
const TOPICS: Topic[] = [
  {
    id: "start",
    label: "Початок роботи",
    icon: IconRocket,
    questions: [
      {
        id: "start-1",
        question: "Lorem ipsum dolor sit amet, consectetur?",
        answer: (
          <>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
              ad minim veniam, quis nostrud exercitation ullamco.
            </p>
            <Steps
              items={[
                <>
                  <strong>Lorem ipsum</strong> - dolor sit amet consectetur
                  adipiscing elit sed do eiusmod.
                </>,
                <>
                  <strong>Tempor incididunt</strong> - ut labore et dolore magna
                  aliqua enim ad minim.
                </>,
                <>
                  <strong>Quis nostrud</strong> - exercitation ullamco laboris
                  nisi ut aliquip ex ea commodo.
                </>,
                <>
                  <strong>Duis aute irure</strong> - dolor in reprehenderit in
                  voluptate velit esse cillum.
                </>,
              ]}
            />
          </>
        ),
      },
      {
        id: "start-2",
        question: "Sed do eiusmod tempor incididunt ut labore?",
        answer: (
          <>
            <p>
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum.
            </p>
            <Steps
              items={[
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "Sed do eiusmod tempor incididunt ut labore et dolore.",
                "Ut enim ad minim veniam, quis nostrud exercitation.",
              ]}
            />
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit
              aut fugit, sed quia consequuntur magni dolores.
            </p>
          </>
        ),
      },
      {
        id: "start-3",
        question: "Ut enim ad minim veniam, quis nostrud?",
        answer: (
          <>
            <p>
              At vero eos et accusamus et iusto odio dignissimos ducimus qui
              blanditiis praesentium voluptatum deleniti atque corrupti quos
              dolores et quas molestias excepturi sint.
            </p>
            <p>
              Temporibus autem quibusdam et aut officiis debitis aut rerum
              necessitatibus saepe eveniet ut et voluptates repudiandae.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "sources",
    label: "Джерела даних",
    icon: IconPlugConnected,
    questions: [
      {
        id: "sources-1",
        question: "Duis aute irure dolor in reprehenderit?",
        answer: (
          <>
            <p>
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet,
              consectetur, adipisci velit, sed quia non numquam eius modi
              tempora incidunt ut labore.
            </p>
            <p>
              Lorem ipsum dolor sit amet - <a href="/settings">lorem ipsum</a>{" "}
              dolor sit amet consectetur.
            </p>
          </>
        ),
      },
      {
        id: "sources-2",
        question: "Excepteur sint occaecat cupidatat non proident?",
        answer: (
          <>
            <p>
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit
              esse quam nihil molestiae consequatur:
            </p>
            <Bullets
              items={[
                "lorem ipsum dolor sit amet consectetur adipiscing;",
                "sed do eiusmod tempor incididunt ut labore et dolore;",
                "ut enim ad minim veniam quis nostrud exercitation.",
              ]}
            />
            <p>
              Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur at
              vero eos et accusamus.
            </p>
          </>
        ),
      },
      {
        id: "sources-3",
        question: "Sunt in culpa qui officia deserunt mollit?",
        answer: (
          <p>
            Itaque earum rerum hic tenetur a sapiente delectus, ut aut
            reiciendis voluptatibus maiores alias consequatur aut perferendis
            doloribus asperiores repellat.
          </p>
        ),
      },
    ],
  },
  {
    id: "analytics",
    label: "Аналітика та звіти",
    icon: IconChartBar,
    questions: [
      {
        id: "analytics-1",
        question: "Nemo enim ipsam voluptatem quia voluptas?",
        answer: (
          <Bullets
            items={[
              <>
                <strong>Lorem ipsum</strong> - dolor sit amet, consectetur
                adipiscing elit sed do.
              </>,
              <>
                <strong>Tempor incididunt</strong> - ut labore et dolore magna
                aliqua ut enim.
              </>,
              <>
                <strong>Exercitation</strong> - ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
              </>,
              <>
                <strong>Voluptate velit</strong> - esse cillum dolore eu fugiat
                nulla pariatur.
              </>,
            ]}
          />
        ),
      },
      {
        id: "analytics-2",
        question: "Aspernatur aut odit aut fugit, sed quia?",
        answer: (
          <p>
            Consequuntur magni dolores eos qui ratione voluptatem sequi
            nesciunt, neque porro quisquam est qui dolorem ipsum quia dolor sit
            amet consectetur adipisci velit.
          </p>
        ),
      },
      {
        id: "analytics-3",
        question: "Ut aliquip ex ea commodo consequat?",
        answer: (
          <>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem
              accusantium doloremque laudantium, totam rem aperiam.
            </p>
            <p>
              Eaque ipsa quae ab illo inventore veritatis et quasi architecto
              beatae vitae dicta sunt explicabo.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "billing",
    label: "Підписка та оплата",
    icon: IconCreditCard,
    questions: [
      {
        id: "billing-1",
        question: "Totam rem aperiam eaque ipsa quae ab illo?",
        answer: (
          <p>
            Inventore veritatis et quasi architecto beatae vitae dicta sunt
            explicabo, nemo enim ipsam voluptatem quia voluptas sit aspernatur
            aut odit aut fugit.
          </p>
        ),
      },
      {
        id: "billing-2",
        question: "Voluptatem accusantium doloremque laudantium?",
        answer: (
          <p>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
            suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur -{" "}
            <a href="/settings?section=billing">lorem ipsum dolor</a>.
          </p>
        ),
      },
      {
        id: "billing-3",
        question: "Quis nostrum exercitationem ullam corporis?",
        answer: (
          <p>
            Et harum quidem rerum facilis est et expedita distinctio. Nam libero
            tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo
            minus id quod maxime placeat.
          </p>
        ),
      },
    ],
  },
  {
    id: "support",
    label: "Підтримка",
    icon: IconMail,
    questions: [
      {
        id: "support-1",
        question: "Nam libero tempore, cum soluta nobis?",
        answer: (
          <>
            <p>
              Est eligendi optio cumque nihil impedit quo minus id quod maxime
              placeat facere possimus, omnis voluptas assumenda est.
            </p>
            <p>
              Lorem ipsum: <a href="mailto:lorem@example.com">lorem@example.com</a>
            </p>
          </>
        ),
      },
      {
        id: "support-2",
        question: "Omnis dolor repellendus temporibus autem?",
        answer: (
          <p>
            Quibusdam et aut officiis debitis aut rerum necessitatibus saepe
            eveniet ut et voluptates repudiandae sint et molestiae non
            recusandae.
          </p>
        ),
      },
      {
        id: "support-3",
        question: "Itaque earum rerum hic tenetur a sapiente?",
        answer: (
          <p>
            Delectus, ut aut reiciendis voluptatibus maiores alias consequatur
            aut perferendis doloribus asperiores repellat lorem ipsum dolor sit
            amet.
          </p>
        ),
      },
    ],
  },
]

function findQuestion(id: string | null) {
  if (!id) return undefined
  for (const topic of TOPICS) {
    const question = topic.questions.find((q) => q.id === id)
    if (question) return { topic, question }
  }
  return undefined
}

function scrollToQuestion(id: string) {
  // Let the answer render (and the section switch) before scrolling to it.
  requestAnimationFrame(() => {
    document
      .getElementById(`faq-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })
  })
}

function AnswerRow({
  question,
  isOpen,
  onToggle,
}: {
  question: Question
  isOpen: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const url = `${window.location.origin}${QUESTION_PATH}?${QUESTION_PARAM}=${question.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (insecure origin, denied permission) - the
      // link is still reachable from the address bar, so just stay silent.
    }
  }

  return (
    <div
      id={`faq-${question.id}`}
      className="group scroll-mt-24 border-b last:border-b-0"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 py-3.5 text-left"
        >
          <span
            className={cn(
              "flex-1 text-sm font-medium transition-colors",
              isOpen ? "text-foreground" : "text-foreground/90"
            )}
          >
            {question.question}
          </span>
          <IconChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isOpen && "rotate-180"
            )}
          />
        </button>
        <button
          type="button"
          onClick={copyLink}
          title="Скопіювати посилання на відповідь"
          aria-label="Скопіювати посилання на відповідь"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 [&>svg]:size-4",
            copied && "text-emerald-600 opacity-100 dark:text-emerald-400"
          )}
        >
          {copied ? <IconCheck /> : <IconLink />}
        </button>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "space-y-3 pr-8 pb-4 text-sm leading-relaxed text-muted-foreground transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-foreground",
              isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            )}
          >
            {question.answer}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FaqPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState("")

  // The URL is the single source of truth for what is open: `?q=` deep-links a
  // single answer, `?topic=` a whole section. So a pasted link, the browser
  // back button and an in-page click all end up in the same state.
  const linked = findQuestion(searchParams.get(QUESTION_PARAM))
  const activeTopic =
    linked?.topic ??
    TOPICS.find((topic) => topic.id === searchParams.get(TOPIC_PARAM)) ??
    TOPICS[0]
  const activeTopicId = activeTopic.id
  // Without any parameter the first answer is expanded as a starting point;
  // once the URL says something, we follow it literally.
  const openId =
    linked?.question.id ??
    (searchParams.has(QUESTION_PARAM) || searchParams.has(TOPIC_PARAM)
      ? null
      : TOPICS[0].questions[0].id)

  const openInUrl = (params: Record<string, string>) =>
    setSearchParams(params, { replace: true })

  // Bring a deep-linked answer into view once, after the first paint.
  const deepLinkedId = useRef(linked?.question.id)
  useEffect(() => {
    if (deepLinkedId.current) scrollToQuestion(deepLinkedId.current)
  }, [])

  const search = query.trim().toLowerCase()
  const isSearching = search.length > 0

  const hasMatches = (topic: Topic) =>
    !isSearching ||
    topic.questions.some((q) => q.question.toLowerCase().includes(search))

  // While searching we show every matching question across topics, so the
  // answer is always one click away regardless of which topic is selected.
  const visibleTopics = isSearching
    ? TOPICS.map((topic) => ({
        ...topic,
        questions: topic.questions.filter((q) =>
          q.question.toLowerCase().includes(search)
        ),
      })).filter((topic) => topic.questions.length > 0)
    : TOPICS.filter((topic) => topic.id === activeTopicId)

  // Collapsing an answer falls back to its section, so the URL never points at
  // something that is no longer open.
  const toggleQuestion = (topicId: string, id: string) =>
    openInUrl(
      id === openId ? { [TOPIC_PARAM]: topicId } : { [QUESTION_PARAM]: id }
    )

  const selectTopic = (topic: Topic) => {
    setQuery("")
    openInUrl({ [QUESTION_PARAM]: topic.questions[0].id })
  }

  const selectQuestion = (questionId: string) => {
    setQuery("")
    openInUrl({ [QUESTION_PARAM]: questionId })
    scrollToQuestion(questionId)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IconHelpCircle className="size-5" />
          </div>
          <h1 className="self-center text-xl font-bold tracking-tight">
            Питання та відповіді
          </h1>
        </div>
        <div className="relative w-full sm:max-w-[280px]">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за питанням"
            className="bg-card pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-6 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0">
          {TOPICS.map((topic) => {
            const isActive = !isSearching && topic.id === activeTopicId
            return (
              <div key={topic.id} className="shrink-0 lg:contents">
                <button
                  type="button"
                  aria-expanded={isActive}
                  onClick={() => selectTopic(topic)}
                  className={cn(
                    "flex h-9 w-full shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors [&>svg]:size-4 [&>svg]:shrink-0",
                    isActive
                      ? "bg-card font-medium shadow-sm"
                      : cn(
                          "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                          !hasMatches(topic) && "opacity-40"
                        )
                  )}
                >
                  <topic.icon />
                  <span className="flex-1 truncate text-left">
                    {topic.label}
                  </span>
                  <IconChevronDown
                    className={cn(
                      "text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      !isActive && "-rotate-90"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "hidden lg:grid lg:transition-[grid-template-rows] lg:duration-300 lg:ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isActive ? "lg:grid-rows-[1fr]" : "lg:grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div
                      className={cn(
                        "ml-[19px] flex flex-col border-l transition-opacity duration-300",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {topic.questions.map((question) => (
                        <button
                          key={question.id}
                          type="button"
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => selectQuestion(question.id)}
                          className={cn(
                            "-ml-px border-l py-1.5 pr-2 pl-3 text-left text-[13px] leading-snug transition-colors",
                            isActive && question.id === openId
                              ? "border-foreground/70 text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {question.question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          {visibleTopics.map((topic) => (
            <Card key={topic.id}>
              <CardContent className="px-5 py-0 md:px-6">
                <div className="flex items-center gap-2.5 border-b py-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <topic.icon className="size-4" />
                  </div>
                  <h2 className="text-[15px] font-bold tracking-tight">
                    {topic.label}
                  </h2>
                </div>
                {topic.questions.map((question) => (
                  <AnswerRow
                    key={question.id}
                    question={question}
                    isOpen={question.id === openId}
                    onToggle={() => toggleQuestion(topic.id, question.id)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}

          {visibleTopics.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <IconMoodPuzzled className="size-7 text-muted-foreground" />
                <p className="text-sm font-medium">Нічого не знайшлося</p>
                <p className="max-w-[320px] text-sm text-muted-foreground">
                  Спробуйте інше формулювання або напишіть в підтримку.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2 rounded-xl border border-dashed px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">Не знайшли відповіді?</p>
            <a
              href="mailto:support@adsmetry.app"
              className="flex h-9 w-fit items-center gap-2 rounded-lg bg-neutral-900 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <IconMail className="size-4" />
              Написати в підтримку
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaqPage
