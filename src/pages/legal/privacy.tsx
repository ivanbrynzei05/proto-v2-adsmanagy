import {
  IconArrowLeft,
  IconCookie,
  IconDatabase,
  IconFileText,
  IconLock,
  IconMail,
  IconPlugConnected,
  IconRefresh,
  IconShare,
  IconShieldLock,
  IconUserCheck,
  type Icon,
} from "@tabler/icons-react"
import { useNavigate } from "react-router-dom"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const UPDATED = "21 липня 2026"

type SectionMeta = {
  id: string
  title: string
  icon: Icon
}

const SECTIONS: SectionMeta[] = [
  { id: "intro", title: "Загальні положення", icon: IconFileText },
  { id: "collect", title: "Які дані ми збираємо", icon: IconDatabase },
  { id: "sources", title: "Джерела даних та інтеграції", icon: IconPlugConnected },
  { id: "usage", title: "Як ми використовуємо дані", icon: IconShieldLock },
  { id: "sharing", title: "Передача третім сторонам", icon: IconShare },
  { id: "storage", title: "Зберігання та захист", icon: IconLock },
  { id: "rights", title: "Ваші права", icon: IconUserCheck },
  { id: "cookies", title: "Файли cookie", icon: IconCookie },
  { id: "changes", title: "Зміни до політики", icon: IconRefresh },
  { id: "contacts", title: "Контакти", icon: IconMail },
]

function Section({
  meta,
  children,
}: {
  meta: SectionMeta
  children: ReactNode
}) {
  return (
    <section
      id={meta.id}
      className="scroll-mt-24 border-b border-border/60 py-6 first:pt-0 last:border-b-0 last:pb-0"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <meta.icon className="size-4" />
        </div>
        <h2 className="text-[15px] font-bold tracking-tight">{meta.title}</h2>
      </div>
      <div className="space-y-3 pl-[42px] text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  )
}

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

export function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          className="h-8 w-fit gap-1.5 px-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <IconArrowLeft className="size-4" />
          Назад
        </Button>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IconShieldLock className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Політика конфіденційності
            </h1>
            <p className="text-sm text-muted-foreground">
              Як AdsMetry збирає, використовує та захищає ваші дані. Чинна з{" "}
              {UPDATED}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-0.5">
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Зміст
            </p>
            {SECTIONS.map((section, i) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="w-4 text-right text-xs tabular-nums text-muted-foreground/60">
                  {i + 1}
                </span>
                <span className="truncate">{section.title}</span>
              </a>
            ))}
          </div>
        </nav>

        <Card>
          <CardContent className="px-5 py-1 md:px-8">
            <Section meta={SECTIONS[0]}>
              <p>
                Ця Політика конфіденційності описує, як сервіс аналітики реклами{" "}
                <strong>AdsMetry</strong> («ми», «сервіс») обробляє інформацію
                користувачів. Використовуючи сервіс, ви погоджуєтеся з умовами,
                викладеними в цьому документі.
              </p>
              <p>
                Ми прагнемо збирати лише ті дані, які потрібні для роботи
                аналітики, і не використовувати їх у жодних інших цілях без
                вашої згоди.
              </p>
            </Section>

            <Section meta={SECTIONS[1]}>
              <p>Ми обробляємо кілька категорій даних:</p>
              <Bullets
                items={[
                  <>
                    <strong>Дані акаунту</strong> - імʼя, email, телефон, які ви
                    вказуєте в налаштуваннях профілю.
                  </>,
                  <>
                    <strong>Дані підключених джерел</strong> - статистика
                    рекламних кампаній, звернення з CRM та колцентру, отримані
                    через інтеграції.
                  </>,
                  <>
                    <strong>Платіжні дані</strong> - інформація про тариф,
                    баланс та історію списань (реквізити карток обробляє
                    платіжний провайдер, ми їх не зберігаємо).
                  </>,
                  <>
                    <strong>Технічні дані</strong> - тип пристрою, браузер,
                    налаштування вигляду та журнали використання сервісу.
                  </>,
                ]}
              />
            </Section>

            <Section meta={SECTIONS[2]}>
              <p>
                AdsMetry підключається до зовнішніх систем, щоб будувати
                наскрізну аналітику. Ми отримуємо доступ лише до тих даних, які
                ви явно надаєте під час підключення джерела:
              </p>
              <Bullets
                items={[
                  <>
                    <strong>Рекламні кабінети</strong> - статистика показів,
                    кліків та витрат по кампаніях.
                  </>,
                  <>
                    <strong>CRM</strong> - угоди, статуси та суми замовлень для
                    звʼязування витрат із результатом.
                  </>,
                  <>
                    <strong>Колцентр</strong> - дані про дзвінки та звернення
                    для оцінки якості лідів.
                  </>,
                ]}
              />
              <p>
                Ви можете будь-коли відключити джерело в розділі{" "}
                <a href="/settings?section=sources">Налаштування → Інтеграції</a>
                . Після відключення ми припиняємо отримувати нові дані з цього
                джерела.
              </p>
            </Section>

            <Section meta={SECTIONS[3]}>
              <p>Отримані дані використовуються виключно для того, щоб:</p>
              <Bullets
                items={[
                  "будувати звіти та дашборди з ефективності реклами;",
                  "звʼязувати рекламні витрати з реальними продажами;",
                  "надавати доступ до функцій відповідно до вашого тарифу;",
                  "покращувати роботу сервісу та повідомляти про важливі зміни.",
                ]}
              />
              <p>
                Ми <strong>не продаємо</strong> ваші дані та не використовуємо
                їх для реклами третіх сторін.
              </p>
            </Section>

            <Section meta={SECTIONS[4]}>
              <p>
                Ми можемо передавати дані обмеженому колу партнерів, які
                допомагають надавати сервіс, - і лише в обсязі, необхідному для
                їхньої роботи:
              </p>
              <Bullets
                items={[
                  "постачальникам хмарної інфраструктури для зберігання даних;",
                  "платіжним провайдерам для обробки оплат;",
                  "аналітичним інструментам для стабільності сервісу.",
                ]}
              />
              <p>
                Усі партнери зобовʼязані дотримуватися конфіденційності. Ми також
                можемо розкрити дані на вимогу закону.
              </p>
            </Section>

            <Section meta={SECTIONS[5]}>
              <p>
                Дані зберігаються на захищених серверах із шифруванням під час
                передавання. Доступ до них мають лише уповноважені співробітники.
                Ми зберігаємо дані стільки, скільки діє ваш акаунт, і видаляємо
                їх протягом розумного строку після його закриття.
              </p>
            </Section>

            <Section meta={SECTIONS[6]}>
              <p>Щодо своїх персональних даних ви маєте право:</p>
              <Bullets
                items={[
                  "отримати доступ до даних, які ми зберігаємо;",
                  "виправити неточну інформацію в налаштуваннях профілю;",
                  "вимагати видалення акаунту та повʼязаних даних;",
                  "відкликати згоду на обробку, відключивши джерела даних.",
                ]}
              />
              <p>
                Щоб скористатися будь-яким із прав, напишіть нам на адресу нижче.
              </p>
            </Section>

            <Section meta={SECTIONS[7]}>
              <p>
                Ми використовуємо файли cookie та подібні технології, щоб
                памʼятати ваш вхід, зберігати налаштування вигляду (наприклад,
                тему) та розуміти, як використовується сервіс. Ви можете керувати
                cookie в налаштуваннях браузера, проте частина функцій без них
                може працювати некоректно.
              </p>
            </Section>

            <Section meta={SECTIONS[8]}>
              <p>
                Ми можемо оновлювати цю політику, щоб відображати зміни в сервісі
                чи законодавстві. Про суттєві зміни ми повідомимо в інтерфейсі
                або електронною поштою. Дата останнього оновлення завжди вказана
                вгорі сторінки.
              </p>
            </Section>

            <Section meta={SECTIONS[9]}>
              <p>
                Якщо у вас є запитання щодо цієї політики або обробки ваших
                даних, звертайтеся:
              </p>
              <p>
                <strong>AdsMetry</strong>
                <br />
                Email: <a href="mailto:privacy@adsmetry.app">privacy@adsmetry.app</a>
              </p>
            </Section>
          </CardContent>
        </Card>
      </div>

      <p className="px-1 text-center text-xs text-muted-foreground">
        © 2026 AdsMetry · Це демонстраційний документ прототипу
      </p>
    </div>
  )
}

export default PrivacyPolicyPage
