import { Navigate, Route, Routes } from "react-router-dom"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { DataSourcesProvider } from "@/components/data-sources-provider"
import { IntegrationsProvider } from "@/components/integrations-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CampaignsPage } from "@/pages/campaigns/campaigns"
import { DashboardPage } from "@/pages/dashboard/dashboard"
import { SettingsPage } from "@/pages/settings/settings"

export function App() {
  return (
    <TooltipProvider>
      <DataSourcesProvider>
        <IntegrationsProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-muted dark:bg-background">
              <SiteHeader />
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SidebarInset>
          </SidebarProvider>
        </IntegrationsProvider>
      </DataSourcesProvider>
    </TooltipProvider>
  )
}

export default App
