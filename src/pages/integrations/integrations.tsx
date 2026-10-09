import {
  IconAd,
  IconBrandTelegram,
  IconDatabase,
  type Icon,
} from "@tabler/icons-react"
import { useSearchParams } from "react-router-dom"

import { useIntegrations } from "@/components/integrations-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionNav } from "@/components/ui/section-nav"
import { AdAccountsStep } from "@/features/integrations/ad-accounts-step"
import { CrmStep } from "@/features/integrations/crm-step"
import { TelegramStep } from "@/features/integrations/telegram-step"
import { countCabinets } from "@/features/integrations/types"

// Call centres used to live here, but they're a cost line rather than a data
// source - they sit under Налаштування → Витрати.
type SectionId = "ads" | "crm" | "telegram"

// `?section=` keeps the open section in the link, so a notification can point
// at it - the same way Налаштування does.
function sectionFromParam(value: string | null): SectionId {
  return value === "crm" || value === "telegram" ? value : "ads"
}

export function IntegrationsPage() {
  const {
    connectedAccounts,
    setConnectedAccounts,
    connectedCrms,
    setConnectedCrms,
    telegramChats,
    setTelegramChats,
  } = useIntegrations()
  const [searchParams, setSearchParams] = useSearchParams()
  const active = sectionFromParam(searchParams.get("section"))
  const setActive = (id: SectionId) =>
    setSearchParams(id === "ads" ? {} : { section: id }, { replace: true })

  const sections: {
    id: SectionId
    label: string
    icon: Icon
    count: number
  }[] = [
    {
      id: "ads",
      label: "Рекламні кабінети",
      icon: IconAd,
      count: countCabinets(connectedAccounts),
    },
    {
      id: "crm",
      label: "CRM",
      icon: IconDatabase,
      count: connectedCrms.length,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: IconBrandTelegram,
      count: telegramChats.length,
    },
  ]

  const current = sections.find((s) => s.id === active)!

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Інтеграції</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <SectionNav items={sections} value={active} onChange={setActive} />

        <div className="min-w-0">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-[15px] font-bold tracking-tight">
                {current.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {active === "ads" && (
                <AdAccountsStep
                  connectedAccounts={connectedAccounts}
                  setConnectedAccounts={setConnectedAccounts}
                  animate={false}
                />
              )}
              {active === "crm" && (
                <CrmStep
                  connectedCrms={connectedCrms}
                  setConnectedCrms={setConnectedCrms}
                  animate={false}
                />
              )}
              {active === "telegram" && (
                <TelegramStep
                  telegramChats={telegramChats}
                  setTelegramChats={setTelegramChats}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
