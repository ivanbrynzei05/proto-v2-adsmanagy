import { Navigate, Outlet, Route, Routes } from "react-router-dom"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { DataSourcesProvider } from "@/components/data-sources-provider"
import { IntegrationsProvider } from "@/components/integrations-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CampaignsPage } from "@/pages/campaigns/campaigns"
import { DashboardPage } from "@/pages/dashboard/dashboard"
import { OnboardingPage } from "@/pages/onboarding/onboarding"
import { SettingsPage } from "@/pages/settings/settings"

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted dark:bg-background">
        <SiteHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}

export function App() {
  return (
    <TooltipProvider>
      <DataSourcesProvider>
        <IntegrationsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </IntegrationsProvider>
      </DataSourcesProvider>
    </TooltipProvider>
  )
}

export default App
