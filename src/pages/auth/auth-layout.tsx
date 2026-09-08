import { IconChartPie, type Icon } from "@tabler/icons-react"

import authRightImage from "@/assets/auth-right.png"

/**
 * The frame every auth screen sits in.
 *
 * It is the layout the live app already signs people in with - one card on a
 * tinted page, the form on the left in a 380px column, the artwork on the right
 * folding away under 900px - so a screen added to the flow reads as part of it
 * rather than as a page of its own. The three background classes live in
 * index.css beside the rest of the theme.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page-background grid min-h-svh place-items-center overflow-y-auto p-[26px] text-slate-950 dark:text-slate-50">
      <div className="auth-card-shadow grid h-[calc(100svh-52px)] max-h-[760px] w-full max-w-[1180px] grid-cols-[1.05fr_1fr] overflow-hidden rounded-[26px] border border-slate-200 bg-white max-[900px]:h-auto max-[900px]:max-h-none max-[900px]:max-w-[520px] max-[900px]:grid-cols-1 dark:border-slate-800 dark:bg-slate-900">
        <section className="flex flex-col overflow-y-auto px-14 py-[34px] max-[900px]:px-7 max-[900px]:py-9">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-blue-600 text-white">
              <IconChartPie className="size-[18px]" />
            </div>
            <p className="text-[19px] font-bold text-slate-950 dark:text-white">
              Ads<span className="text-blue-600">Metry</span>
            </p>
          </div>
          <div className="my-auto w-full max-w-[380px] self-center py-6">
            {children}
          </div>
        </section>

        <section className="m-3.5 ml-0 overflow-hidden rounded-[20px] bg-blue-100 max-[900px]:hidden dark:bg-slate-800">
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover dark:brightness-[0.55] dark:saturate-[0.8]"
            src={authRightImage}
          />
        </section>
      </div>
    </main>
  )
}

/**
 * The mark and the title over an auth form.
 *
 * The squares and the ruled grid behind the tile are the live app's, kept to
 * the pixel: it is the first thing anyone sees on the login screen, so a screen
 * that opens with anything else looks like another product.
 */
export function AuthHero({ icon: Icon, title }: { icon: Icon; title: string }) {
  return (
    <div className="mb-6">
      <div className="relative mb-0.5 grid h-[92px] place-items-center">
        <div className="auth-hero-grid absolute inset-0" />
        <span className="absolute top-1.5 left-[calc(50%-84px)] size-[26px] rounded-md bg-blue-100 dark:bg-blue-950" />
        <span className="absolute top-1.5 left-[calc(50%+58px)] size-[26px] rounded-md bg-blue-100 dark:bg-blue-950" />
        <span className="absolute bottom-1.5 left-[calc(50%-58px)] size-[26px] rounded-md bg-blue-100 dark:bg-blue-900" />
        <span className="absolute bottom-1.5 left-[calc(50%+32px)] size-[26px] rounded-md bg-blue-100 dark:bg-blue-900" />
        <div className="relative z-10 grid size-12 place-items-center rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_10px_22px_-10px_rgba(37,99,235,0.75)] before:absolute before:-inset-1.5 before:-z-10 before:rounded-[18px] before:bg-blue-500/10">
          <Icon className="size-[23px]" />
        </div>
      </div>
      <h1 className="text-center text-2xl font-bold text-slate-950 dark:text-white">
        {title}
      </h1>
    </div>
  )
}
