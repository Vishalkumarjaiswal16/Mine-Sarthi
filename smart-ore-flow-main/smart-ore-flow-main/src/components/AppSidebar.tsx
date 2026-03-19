import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Box,
  Zap,
  Settings,
  Activity,
  FileText,
  Sun,
  Cloud,
  Cpu,
  Brain,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Digital Twin", url: "/digital-twin", icon: Box },
  { title: "Energy Usage", url: "/energy-usage", icon: Zap },
  { title: "Renewable Energy", url: "/renewable-energy", icon: Sun },
  { title: "AI Monitoring", url: "/ai-monitoring", icon: Brain },
  { title: "Weather", url: "/weather", icon: Cloud },
  { title: "M2M", url: "/hardware", icon: Cpu },
  { title: "Custom Reports", url: "/custom-reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open, state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-bold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-semibold">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider font-bold">
              System Status
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-success animate-pulse shrink-0" />
                  <span className="text-xs font-medium">All Systems Operational</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Uptime: 99.8%
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
