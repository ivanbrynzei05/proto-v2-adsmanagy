import {
  IconChartBar,
  IconChartPie,
  IconLayoutDashboard,
  IconRocket,
  IconSettings,
  IconTable,
} from "@tabler/icons-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const NAV = [
  { path: "/", label: "Дашборд", icon: IconLayoutDashboard },
  { path: "/campaigns", label: "Кампанії", icon: IconTable },
  { path: "/statistics", label: "Статистика", icon: IconChartBar },
  { path: "/settings", label: "Налаштування", icon: IconSettings },
] as const

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <IconChartPie className="size-5" />
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Ads<span className="text-primary">Metry</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={item.path === pathname}
                  tooltip={item.label}
                  render={<NavLink to={item.path} />}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Первинне налаштування">
              <IconRocket />
              <span>Первинне налаштування</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-1 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          © 2026 AdsMetry · v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
